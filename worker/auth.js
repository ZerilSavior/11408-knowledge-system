// 注册 / 登录 / 令牌鉴权
import { sha256, generateToken } from './crypto.js';
import { json } from './http.js';

export async function register(env, body, cors) {
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

export async function login(env, body, cors) {
  const { username, password } = body;
  const hash = await sha256(password);
  const row = await env.DB.prepare('SELECT id, username FROM users WHERE username = ? AND password_hash = ?').bind(username, hash).first();
  if (!row) return json(401, { ok: false, error: '用户名或密码错误' }, cors);
  const token = generateToken();
  await env.DB.prepare('INSERT INTO sessions(token, user_id) VALUES(?, ?)').bind(token, row.id).run();
  return json(200, { ok: true, token, username: row.username }, cors);
}

// 返回 userId；令牌缺失/无效时返回 null
export async function authenticate(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return null;
  const sess = await env.DB.prepare('SELECT user_id FROM sessions WHERE token = ?').bind(token).first();
  return sess ? sess.user_id : null;
}
