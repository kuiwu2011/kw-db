import { verifyPassword, getCookie, sessionCookie, beijingNow } from '../_session.js';

export async function onRequestPost(context) {
  const { env, request } = context;
  const { username, password } = await request.json().catch(() => ({}));
  if (!username || !password) return json({ message: '请输入账号密码' }, 400);

  const user = await env.DB.prepare('SELECT id, username, password_hash FROM users WHERE username=?')
    .bind(username.trim()).first();
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return json({ message: '用户名或密码错误' }, 401);
  }

  const token = crypto.randomUUID();
  const expire = new Date(Date.now() + 7 * 86400 * 1000).toISOString();
  await env.DB.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?,?)')
    .bind(token, user.id, expire).run();

  return new Response(JSON.stringify({ success: true, username: user.username }), {
    headers: { 'Content-Type': 'application/json', 'Set-Cookie': sessionCookie(token) }
  });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}