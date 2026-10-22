import crypto from 'crypto';

// Signed unsubscribe links. The secret is the server-only Supabase service
// key, so no extra env var is needed and tokens can't be forged client-side.
const SITE = 'https://www.youraifood.com';

function secret() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

export function unsubscribeToken(userId) {
  return crypto.createHmac('sha256', secret()).update(String(userId)).digest('base64url');
}

export function verifyUnsubscribeToken(userId, token) {
  if (!secret() || !userId || !token) return false;
  const expected = Buffer.from(unsubscribeToken(userId));
  const given = Buffer.from(String(token));
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

export function unsubscribeUrl(userId) {
  return `${SITE}/api/unsubscribe?u=${encodeURIComponent(userId)}&t=${unsubscribeToken(userId)}`;
}
