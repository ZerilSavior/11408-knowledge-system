/**
 * 408 知识体系 · Cloudflare Pages Functions —— /api/state
 * 用 D1 数据库（SQLite 兼容）替代本地 server.js 的存储。
 *
 * 部署后产生两个接口：
 *   GET /api/state  ->  { ok:true, data: {mastery,notes,...} | null }
 *   PUT /api/state  ->  body: 完整 state JSON，返回 { ok:true }
 *
 * 前置：在 Cloudflare 控制台创建 D1 数据库，绑定到 Pages 项目，绑定名必须为 DB。
 * 首次请求会自动建表（kv），无需手动执行迁移。
 */

async function ensureTable(env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS kv(
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    )`
  ).run();
}

export async function onRequestGet({ env }) {
  try {
    await ensureTable(env);
    const row = await env.DB.prepare('SELECT value FROM kv WHERE key = ?').bind('state').first();
    return json(200, { ok: true, data: row ? JSON.parse(row.value) : null });
  } catch (e) {
    return json(500, { ok: false, error: String(e && e.message || e) });
  }
}

export async function onRequestPut({ request, env }) {
  try {
    await ensureTable(env);
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return json(400, { ok: false, error: 'invalid state payload' });
    }
    await env.DB.prepare(
      `INSERT INTO kv(key, value, updated_at) VALUES(?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
    ).bind('state', JSON.stringify(body)).run();
    return json(200, { ok: true, savedAt: new Date().toISOString() });
  } catch (e) {
    return json(400, { ok: false, error: String(e && e.message || e) });
  }
}

function json(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
