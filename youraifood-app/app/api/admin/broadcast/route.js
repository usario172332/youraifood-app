import { NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromToken } from '../../../../lib/supabaseAdmin';
import { unsubscribeUrl } from '../../../../lib/unsubscribe';
import { CAMPAIGN, sendUpdateEmail } from '../../../../lib/updateEmail';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Admin-only. POST { mode: 'preview' | 'test' | 'all' } with the admin's
// Supabase access token as a Bearer token.
//   preview: counts who would receive it, sends nothing
//   test:    sends one copy to the admin address only
//   all:     sends to every account not opted out and not already sent this campaign
export async function POST(req) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const user = await getUserFromToken(token);
  const adminEmail = (process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER || '').toLowerCase();
  if (!user || !adminEmail || (user.email || '').toLowerCase() !== adminEmail) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { mode } = await req.json().catch(() => ({}));
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

  if (mode === 'test') {
    const r = await sendUpdateEmail(user.email, unsubscribeUrl(user.id));
    return NextResponse.json({ mode, to: user.email, ...r });
  }

  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id, email, marketing_opt_out')
    .not('email', 'is', null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: sentRows } = await admin.from('email_broadcasts').select('user_id').eq('campaign', CAMPAIGN);
  const already = new Set((sentRows || []).map((r) => r.user_id));
  const targets = profiles.filter((p) => !p.marketing_opt_out && !already.has(p.id));

  if (mode !== 'all') {
    return NextResponse.json({
      mode: 'preview',
      total: profiles.length,
      optedOut: profiles.filter((p) => p.marketing_opt_out).length,
      alreadySent: already.size,
      wouldSend: targets.length,
    });
  }

  let sent = 0;
  const failed = [];
  for (const p of targets) {
    const r = await sendUpdateEmail(p.email, unsubscribeUrl(p.id));
    if (r.sent) {
      sent += 1;
      await admin.from('email_broadcasts').upsert({ campaign: CAMPAIGN, user_id: p.id });
    } else {
      failed.push({ email: p.email, error: r.error });
    }
    await new Promise((res) => setTimeout(res, 400));
  }
  return NextResponse.json({ mode: 'all', attempted: targets.length, sent, failed });
}
