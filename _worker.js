/**
 * 408 知识体系 · Cloudflare Worker 主入口
 * - /api/state  GET/PUT：读写学习进度（Cloudflare D1 数据库，绑定名 DB）
 * - 其余路径：服务 public/ 下的静态页面（index.html 等）
 *
 * 首次请求自动创建 kv 表，无需手动迁移。
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, env);
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    return new Response('Not Found', { status: 404 });
  },
};

async function handleApi(request, env) {
  try {
    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS kv(
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT DEFAULT (datetime('now'))
      )`
    ).run();

    if (request.method === 'GET') {
      if (new URL(request.url).pathname !== '/api/state') {
        return json(404, { ok: false, error: 'not found' });
      }
      const row = await env.DB.prepare('SELECT value FROM kv WHERE key = ?').bind('state').first();
      return json(200, { ok: true, data: row ? JSON.parse(row.value) : null });
    }

    if (request.method === 'PUT') {
      if (new URL(request.url).pathname !== '/api/state') {
        return json(404, { ok: false, error: 'not found' });
      }
      const body = await request.json();
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return json(400, { ok: false, error: 'invalid state payload' });
      }
      await env.DB.prepare(
        `INSERT INTO kv(key, value, updated_at) VALUES(?, ?, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
      ).bind('state', JSON.stringify(body)).run();
      return json(200, { ok: true, savedAt: new Date().toISOString() });
    }

    return json(405, { ok: false, error: 'method not allowed' });
  } catch (e) {
    return json(500, { ok: false, error: String(e && e.message || e) });
  }
}

function json(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
