import { hashPassword, beijingNow } from '../_session.js';

export async function onRequestPost(context) {
  const { env, request } = context;
  let body;
  try { body = await request.json(); } catch { return json({ message: '参数错误' }, 400); }

  const username = (body.username || '').trim();
  const password = body.password || '';
  if (username.length < 2 || password.length < 6) return json({ message: '账号至少2位、密码至少6位' }, 400);

  const exists = await env.DB.prepare('SELECT id FROM users WHERE username=?').bind(username).first();
  if (exists) return json({ message: '账号已存在' }, 400);

  const password_hash = await hashPassword(password);
  await env.DB.prepare('INSERT INTO users (username, password_hash, created_at) VALUES (?,?,?)')
    .bind(username, password_hash, beijingNow()).run();

  return json({ success: true, message: '注册成功，请登录' }, 201);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}