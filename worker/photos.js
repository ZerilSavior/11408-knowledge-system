// 真题 / 错题照片：Cloudflare R2，对象 key 强制按 userId 隔离，防越权
import { base64ToBytes } from './crypto.js';
import { json } from './http.js';

const PREFIX = '/api/photo/';

export async function handlePhotos(request, env, userId, path, body) {
  const origin = request.headers.get('Origin') || '*';

  // 上传：POST /api/photo/upload  { ext, dataBase64, contentType }
  if (path === PREFIX + 'upload' && request.method === 'POST') {
    if (!env.PHOTOS) return json(500, { ok: false, error: 'R2 未绑定' }, corsFor(origin));
    const { ext, dataBase64, contentType } = body;
    if (!dataBase64) return json(400, { ok: false, error: '缺少图片数据' }, corsFor(origin));
    const clean = String(dataBase64).replace(/^data:[^;]*;base64,/, '');
    let bytes;
    try { bytes = base64ToBytes(clean); }
    catch (e) { return json(400, { ok: false, error: '图片解码失败' }, corsFor(origin)); }
    if (bytes.length > 12 * 1024 * 1024) return json(413, { ok: false, error: '图片过大（上限12MB），请压缩后上传' }, corsFor(origin));
    const e = String(ext || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'jpg';
    const mime = contentType || (e === 'png' ? 'image/png' : e === 'webp' ? 'image/webp' : e === 'gif' ? 'image/gif' : 'image/jpeg');
    const key = userId + '/' + crypto.randomUUID() + '.' + e;
    await env.PHOTOS.put(key, bytes, { httpMetadata: { contentType: mime } });
    return json(200, { ok: true, key, url: PREFIX + key }, corsFor(origin));
  }

  if (path.startsWith(PREFIX)) {
    const key = decodeURIComponent(path.slice(PREFIX.length));
    if (!key.startsWith(userId + '/')) {
      if (request.method === 'GET') return new Response('Forbidden', { status: 403 });
      return json(403, { ok: false, error: 'forbidden' }, corsFor(origin));
    }

    // 读取：GET /api/photo/{userId}/{file}
    if (request.method === 'GET') {
      const obj = await env.PHOTOS.get(key);
      if (!obj) return new Response('Not Found', { status: 404 });
      const headers = new Headers();
      obj.writeHttpMetadata(headers);
      headers.set('Access-Control-Allow-Origin', origin);
      headers.set('Cache-Control', 'private, max-age=31536000, immutable');
      return new Response(obj.body, { status: 200, headers });
    }

    // 删除：DELETE /api/photo/{userId}/{file}
    if (request.method === 'DELETE') {
      await env.PHOTOS.delete(key);
      return json(200, { ok: true }, corsFor(origin));
    }
  }

  return null;
}

function corsFor(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  };
}
