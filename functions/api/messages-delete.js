import { getSessionUser } from '../_session.js';

export async function onRequestPost(context) {
  const { env, request } = context;
  const me = await getSessionUser(env, request);
  if (!me) return json({ message: '未登录' }, 401);

  const body = await request.json().catch(() => ({}));
  const id = Number(body.id);
  if (!id) return json({ message: '缺少留言ID' }, 400);

  await env.DB.prepare('DELETE FROM messages WHERE id=? AND user_id=?')
    .bind(id, me.user_id).run();
  return json({ success: true });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}