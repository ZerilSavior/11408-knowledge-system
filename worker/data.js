// 每用户通用 KV：整体读取 / 按 key 整体覆盖
import { json } from './http.js';

export async function handleDataGet(env, userId, cors) {
  const rows = await env.DB.prepare('SELECT key, value FROM user_data WHERE user_id = ?').bind(userId).all();
  const data = {};
  for (const r of rows.results) { try { data[r.key] = JSON.parse(r.value); } catch (e) {} }
  return json(200, { ok: true, data }, cors);
}

export async function handleDataPost(env, userId, body, cors) {
  const { key, value } = body;
  if (!key || value === undefined) return json(400, { ok: false, error: 'bad payload' }, cors);
  await env.DB.prepare(
    `INSERT INTO user_data(user_id, key, value, updated_at) VALUES(?, ?, ?, datetime('now'))
     ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
  ).bind(userId, key, JSON.stringify(value)).run();
  return json(200, { ok: true }, cors);
}
