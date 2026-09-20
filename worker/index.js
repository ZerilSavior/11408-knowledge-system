// Worker 入口：静态资源直出 + /api/* 路由分发
import { json, corsHeaders } from './http.js';
import { ensureSchema } from './schema.js';
import { register, login, authenticate } from './auth.js';
import { handleDataGet, handleDataPost } from './data.js';
import { handlePhotos } from './photos.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 非 API：静态资源
    if (!url.pathname.startsWith('/api/')) {
      if (env.ASSETS) return env.ASSETS.fetch(request);
      return new Response('Not Found', { status: 404 });
    }

    const cors = corsHeaders(request);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    try {
      await ensureSchema(env);

      const path = url.pathname;
      const body = request.method === 'POST' ? await request.json() : {};

      // 注册 / 登录（无需令牌）
      if (path === '/api/register' && request.method === 'POST') return await register(env, body, cors);
      if (path === '/api/login' && request.method === 'POST') return await login(env, body, cors);

      // 以下接口需要认证
      const userId = await authenticate(request, env);
      if (userId === null) return json(401, { ok: false, error: '未登录' }, cors);

      // 通用数据 KV
      if (path === '/api/data' && request.method === 'GET') return await handleDataGet(env, userId, cors);
      if (path === '/api/data' && request.method === 'POST') return await handleDataPost(env, userId, body, cors);

      // 照片（R2）
      const photoResp = await handlePhotos(request, env, userId, path, body);
      if (photoResp) return photoResp;

      return json(404, { ok: false, error: 'not found' }, cors);
    } catch (e) {
      return json(500, { ok: false, error: String(e && e.message || e) }, cors);
    }
  },
};
