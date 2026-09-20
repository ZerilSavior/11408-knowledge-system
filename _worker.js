/**
 * 408 知识体系 · Cloudflare Worker
 * - 用户注册/登录（简单密码认证）
 * - 每用户独立数据：进度、笔记、自定义框架图
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, env);
    }
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response('Not Found', { status: 404 });
  },
};

async function handleApi(request, env) {
  const origin = request.headers.get('Origin') || '*';
  const cors = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  try {
    // 建表
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS users(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`).run();
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS sessions(
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`).run();
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS user_data(
      user_id INTEGER NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY(user_id, key)
    )`).run();

    const path = new URL(request.url).pathname;
    const body = request.method === 'POST' ? await request.json() : {};

    // 注册
    if (path === '/api/register' && request.method === 'POST') {
      const { username, password } = body;
      if (!username || !password || username.length < 2 || password.length < 4) {
        return json(400, { ok: false, error: '用户名至少2位，密码至少4位' }, cors);
      }
      const hash = await sha256(password);
      try {
        const r = await env.DB.prepare('INSERT INTO users(username, password_hash) VALUES(?, ?)').bind(username, hash).run();
        const userId = r.meta.last_row_id;
        const token = generateToken();
        await env.DB.prepare('INSERT INTO sessions(token, user_id) VALUES(?, ?)').bind(token, userId).run();
        return json(200, { ok: true, token, username }, cors);
      } catch (e) {
        if (String(e.message).includes('UNIQUE')) return json(400, { ok: false, error: '用户名已存在' }, cors);
        throw e;
      }
    }

    // 登录
    if (path === '/api/login' && request.method === 'POST') {
      const { username, password } = body;
      const hash = await sha256(password);
      const row = await env.DB.prepare('SELECT id, username FROM users WHERE username = ? AND password_hash = ?').bind(username, hash).first();
      if (!row) return json(401, { ok: false, error: '用户名或密码错误' }, cors);
      const token = generateToken();
      await env.DB.prepare('INSERT INTO sessions(token, user_id) VALUES(?, ?)').bind(token, row.id).run();
      return json(200, { ok: true, token, username: row.username }, cors);
    }

    // 以下接口需要认证
    const auth = request.headers.get('Authorization') || '';
    const token = auth.replace('Bearer ', '');
    const sess = token ? await env.DB.prepare('SELECT user_id FROM sessions WHERE token = ?').bind(token).first() : null;
    if (!sess) return json(401, { ok: false, error: '未登录' }, cors);
    const userId = sess.user_id;

    // 读数据
    if (path === '/api/data' && request.method === 'GET') {
      const rows = await env.DB.prepare('SELECT key, value FROM user_data WHERE user_id = ?').bind(userId).all();
      const data = {};
      for (const r of rows.results) { try { data[r.key] = JSON.parse(r.value); } catch(e){} }
      return json(200, { ok: true, data }, cors);
    }

    // 写数据（整体覆盖）
    if (path === '/api/data' && request.method === 'POST') {
      const { key, value } = body;
      if (!key || value === undefined) return json(400, { ok: false, error: 'bad payload' }, cors);
      await env.DB.prepare(
        `INSERT INTO user_data(user_id, key, value, updated_at) VALUES(?, ?, ?, datetime('now'))
         ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
      ).bind(userId, key, JSON.stringify(value)).run();
      return json(200, { ok: true }, cors);
    }

    // ===== 照片（真题/错题）：Cloudflare R2，对象 key 强制按 userId 隔离，防越权 =====
    // 上传：POST /api/photo/upload  { ext:'jpg'|'png'|'webp', dataBase64: dataURL或纯base64 }
    if (path === '/api/photo/upload' && request.method === 'POST') {
      if (!env.PHOTOS) return json(500, { ok: false, error: 'R2 未绑定' }, cors);
      const { ext, dataBase64, contentType } = body;
      if (!dataBase64) return json(400, { ok: false, error: '缺少图片数据' }, cors);
      const clean = String(dataBase64).replace(/^data:[^;]*;base64,/, '');
      let bytes;
      try { bytes = base64ToBytes(clean); }
      catch (e) { return json(400, { ok: false, error: '图片解码失败' }, cors); }
      if (bytes.length > 12 * 1024 * 1024) return json(413, { ok: false, error: '图片过大（上限12MB），请压缩后上传' }, cors);
      const e = String(ext || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'jpg';
      const mime = contentType || (e === 'png' ? 'image/png' : e === 'webp' ? 'image/webp' : e === 'gif' ? 'image/gif' : 'image/jpeg');
      const key = userId + '/' + crypto.randomUUID() + '.' + e;
      await env.PHOTOS.put(key, bytes, { httpMetadata: { contentType: mime } });
      return json(200, { ok: true, key, url: '/api/photo/' + key }, cors);
    }

    // 读取：GET /api/photo/{userId}/{file}（只能取自己目录）
    if (path.startsWith('/api/photo/') && request.method === 'GET') {
      const key = decodeURIComponent(path.slice('/api/photo/'.length));
      if (!key.startsWith(userId + '/')) return new Response('Forbidden', { status: 403 });
      const obj = await env.PHOTOS.get(key);
      if (!obj) return new Response('Not Found', { status: 404 });
      const headers = new Headers();
      obj.writeHttpMetadata(headers);
      headers.set('Access-Control-Allow-Origin', origin);
      headers.set('Cache-Control', 'private, max-age=31536000, immutable');
      return new Response(obj.body, { status: 200, headers });
    }

    // 删除：DELETE /api/photo/{userId}/{file}
    if (path.startsWith('/api/photo/') && request.method === 'DELETE') {
      const key = decodeURIComponent(path.slice('/api/photo/'.length));
      if (!key.startsWith(userId + '/')) return json(403, { ok: false, error: 'forbidden' }, cors);
      await env.PHOTOS.delete(key);
      return json(200, { ok: true }, cors);
    }

    return json(404, { ok: false, error: 'not found' }, cors);
  } catch (e) {
    return json(500, { ok: false, error: String(e && e.message || e) }, cors);
  }
}

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function base64ToBytes(b64) {
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}

function generateToken() {
  return crypto.randomUUID() + crypto.randomUUID();
}

function json(status, obj, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders },
  });
}
