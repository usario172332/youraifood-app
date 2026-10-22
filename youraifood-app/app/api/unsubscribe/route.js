import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { verifyUnsubscribeToken } from '../../../lib/unsubscribe';

export const dynamic = 'force-dynamic';

async function optOut(userId, token) {
  if (!verifyUnsubscribeToken(userId, token)) return false;
  const admin = supabaseAdmin();
  if (!admin) return false;
  const { error } = await admin.from('profiles').update({ marketing_opt_out: true }).eq('id', userId);
  return !error;
}

function page(ok) {
  const body = ok
    ? '<h1>You\'re unsubscribed</h1><p>You won\'t receive update emails from YourAiFood any more. Account and billing emails may still be sent.</p>'
    : '<h1>Link not valid</h1><p>This unsubscribe link is invalid or expired. Reply to any of our emails and we\'ll remove you manually.</p>';
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribe - YourAiFood</title></head><body style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:480px;margin:15vh auto;padding:0 20px;color:#1f2937;text-align:center">${body}<p><a href="https://www.youraifood.com/" style="color:#16a34a">Back to YourAiFood</a></p></body></html>`;
  return new Response(html, { status: ok ? 200 : 400, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

// Link click in the email.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  return page(await optOut(searchParams.get('u'), searchParams.get('t')));
}

// One-click unsubscribe (RFC 8058, used by Gmail/Apple Mail's own button).
export async function POST(req) {
  const { searchParams } = new URL(req.url);
  return page(await optOut(searchParams.get('u'), searchParams.get('t')));
}
