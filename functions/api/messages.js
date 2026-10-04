import { getSessionUser, beijingNow } from '../_session.js';

export async function onRequestGet(context) {
  const { env } = context;
  const me = await getSessionUser(env, context.request);
  const { results } = await env.DB.prepare(
    `SELECT m.id, m.content, m.created_at, u.username, u.id as user_id
     FROM messages m JOIN users u ON u.id=m.user_id
     ORDER BY m.id DESC LIMIT 100`
  ).all();
  return json({
    loggedIn: !!me,
    username: me ? me.username : '',
    messages: results.map(r => ({
      id: r.id,
      content: r.content,
      created_at: r.created_at,
      username: r.username,
      mine: me ? r.user_id === me.user_id : false
    }))
  });
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const me = await getSessionUser(env, request);
  if (!me) return json({ message: '未登录' }, 401);

  const body = await request.json().catch(() => ({}));
  const content = (body.content || '').trim();
  if (!content) return json({ message: '留言内容不能为空' }, 400);
  if (content.length > 5000) return json({ message: '留言过长' }, 400);

  await env.DB.prepare('INSERT INTO messages (user_id, content, created_at) VALUES (?,?,?)')
    .bind(me.user_id, content, beijingNow()).run();
  return json({ success: true }, 201);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}