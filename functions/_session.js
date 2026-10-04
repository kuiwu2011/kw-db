// functions/_session.js
export function beijingNow() {
  const fmt = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
  // sv-SE 输出 2026-10-04 18:30:00
  return fmt.format(new Date()).replace('T', ' ');
}

export async function hashPassword(password) {
  const salt = crypto.randomUUID(); // 每用户独立盐
  const enc = new TextEncoder().encode(salt + ':' + password);
  const keyMaterial = await crypto.subtle.importKey('raw', enc, 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256);
  const hex = [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
  return 'pbkdf2$' + salt + '$' + hex;
}

export async function verifyPassword(password, stored) {
  if (!stored || !stored.startsWith('pbkdf2$')) return false;
  const [, salt, hex] = stored.split('$');
  const enc = new TextEncoder().encode(salt + ':' + password);
  const keyMaterial = await crypto.subtle.importKey('raw', enc, 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256);
  const newHex = [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
  return newHex === hex;
}

export function getCookie(cookieHeader, name) {
  if (!cookieHeader) return '';
  for (const part of cookieHeader.split(';')) {
    const [k, v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v || '');
  }
  return '';
}

export async function getSessionUser(env, request) {
  const token = getCookie(request.headers.get('Cookie'), 'session');
  if (!token) return null;
  const row = await env.DB.prepare(
    'SELECT s.user_id, s.expires_at, u.username FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?'
  ).bind(token).first();
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  return row;
}

export function sessionCookie(token, days = 7) {
  const maxAge = days * 86400;
  return `session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookie() {
  return 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
}