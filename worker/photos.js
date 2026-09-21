// 附件存储：Cloudflare R2，对象 key 强制按 userId 隔离，防越权
//  - 真题/错题照片：{userId}/{uuid}.{ext}（读取需登录）
//  - 笔记图片/文件（folder:'note'）：{userId}/note/{uuid}.{ext}
//    笔记图片要能在 <img src> 里直接显示（浏览器不会带 Authorization 头），
//    故 /note/ 下的对象凭「不可猜的 UUID 能力 URL」匿名只读；无法列目录，拿到完整 URL 才能访问。
//    普通文件以 Content-Disposition: attachment 下载，可经 ?name= 指定原文件名。
import { base64ToBytes } from './crypto.js';
import { json } from './http.js';

const PREFIX = '/api/photo/';
const IMG_EXT = ['jpg','jpeg','png','gif','webp','bmp'];
const DOC_EXT = ['pdf','doc','docx','xls','xlsx','ppt','pptx','txt','md','csv','zip','rar','7z','gz','tar','mp4','mov','m4v','mp3','m4a'];
const DOC_MIME = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain; charset=utf-8', md: 'text/plain; charset=utf-8', csv: 'text/csv; charset=utf-8',
  zip: 'application/zip', rar: 'application/vnd.rar', '7z': 'application/x-7z-compressed',
  gz: 'application/gzip', tar: 'application/x-tar',
  mp4: 'video/mp4', mov: 'video/quicktime', m4v: 'video/x-m4v',
  mp3: 'audio/mpeg', m4a: 'audio/mp4'
};
// {userId}/note/{36位uuid}.{ext}
const NOTE_CAP_RE = /^[^/]+\/note\/[0-9a-fA-F-]{36}\.[a-z0-9]+$/;

function corsFor(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  };
}

export async function handlePhotos(request, env, userId, path, body) {
  const origin = request.headers.get('Origin') || '*';

  // 上传：POST /api/photo/upload  { folder, ext, dataBase64, contentType }
  if (path === PREFIX + 'upload' && request.method === 'POST') {
    if (!env.PHOTOS) return json(500, { ok: false, error: 'R2 未绑定' }, corsFor(origin));
    const { ext, dataBase64, contentType, folder } = body;
    if (!dataBase64) return json(400, { ok: false, error: '缺少文件数据' }, corsFor(origin));
    const clean = String(dataBase64).replace(/^data:[^;]*;base64,/, '');
    let bytes;
    try { bytes = base64ToBytes(clean); }
    catch (e) { return json(400, { ok: false, error: '文件解码失败' }, corsFor(origin)); }
    const e = String(ext || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6) || 'jpg';
    const isImg = IMG_EXT.includes(e);
    const isDoc = DOC_EXT.includes(e);
    if (!isImg && !isDoc) return json(400, { ok: false, error: '不支持的文件类型（' + e + '）' }, corsFor(origin));
    const limit = isImg ? 12 * 1024 * 1024 : 25 * 1024 * 1024;
    if (bytes.length > limit) return json(413, { ok: false, error: isImg ? '图片过大（上限12MB），请压缩后上传' : '文件过大（上限25MB）' }, corsFor(origin));
    let mime;
    if (isImg) {
      mime = (contentType && /^image\//.test(contentType)) ? contentType
        : (e === 'png' ? 'image/png' : e === 'webp' ? 'image/webp' : e === 'gif' ? 'image/gif' : e === 'bmp' ? 'image/bmp' : 'image/jpeg');
    } else {
      mime = DOC_MIME[e] || 'application/octet-stream';
    }
    const key = userId + '/' + (folder === 'note' ? 'note/' : '') + crypto.randomUUID() + '.' + e;
    await env.PHOTOS.put(key, bytes, { httpMetadata: { contentType: mime } });
    return json(200, { ok: true, key, url: PREFIX + key }, corsFor(origin));
  }

  if (path.startsWith(PREFIX)) {
    const key = decodeURIComponent(path.slice(PREFIX.length));
    const owned = !!userId && key.startsWith(userId + '/');
    const cap = NOTE_CAP_RE.test(key); // 笔记附件能力 URL（仅匿名只读）
    if (!owned && !(request.method === 'GET' && cap)) {
      if (request.method === 'GET') return new Response('Forbidden', { status: 403 });
      return json(403, { ok: false, error: 'forbidden' }, corsFor(origin));
    }

    // 读取：GET /api/photo/{userId}/[note/]{file}
    if (request.method === 'GET') {
      const obj = await env.PHOTOS.get(key);
      if (!obj) return new Response('Not Found', { status: 404 });
      const headers = new Headers();
      obj.writeHttpMetadata(headers);
      headers.set('Access-Control-Allow-Origin', origin);
      headers.set('Cache-Control', 'private, max-age=31536000, immutable');
      const e = (key.split('.').pop() || '').toLowerCase();
      const inline = IMG_EXT.includes(e);
      let name = null;
      try { name = new URL(request.url).searchParams.get('name'); } catch (e2) { name = null; }
      if (name) {
        const fn = encodeURIComponent(name);
        headers.set('Content-Disposition', (inline ? 'inline' : 'attachment') + "; filename*=UTF-8''" + fn);
      } else if (!inline) {
        headers.set('Content-Disposition', 'attachment');
      }
      return new Response(obj.body, { status: 200, headers });
    }

    // 删除：DELETE（仅属主，能力 URL 不允许匿名删）
    if (request.method === 'DELETE') {
      if (!owned) return json(403, { ok: false, error: 'forbidden' }, corsFor(origin));
      await env.PHOTOS.delete(key);
      return json(200, { ok: true }, corsFor(origin));
    }
  }

  return null;
}
