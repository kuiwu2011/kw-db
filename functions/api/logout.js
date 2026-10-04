import { getCookie, clearSessionCookie } from '../_session.js';

export async function onRequestPost(context) {
  const { env, request } = context;
  const token = getCookie(request.headers.get('Cookie'), 'session');
  if (token) {
    await env.DB.prepare('DELETE FROM sessions WHERE token=?').bind(token).run();
  }
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': clearSessionCookie()
    }
  });
}