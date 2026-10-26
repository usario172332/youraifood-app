import { NextResponse } from 'next/server';
import { sendEmail } from '../../../lib/email';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { unsubscribeUrl } from '../../../lib/unsubscribe';
import { welcomeEmail, welcomeSubject } from '../../../lib/welcomeEmail';

// Fired (fire-and-forget from the client) right after a successful
// supabase.auth.signUp(). It (1) emails the site owner and (2) sends the new
// user an automated welcome email. Best-effort only: never blocks or breaks the
// signup flow if SMTP isn't configured or a send fails.
//
// Abuse protection: the welcome email is only sent if the userId belongs to a
// real account with a matching email created in the last 10 minutes, and only
// once per account (flag stored in user_metadata).
async function sendWelcome(userId, email) {
  const admin = supabaseAdmin();
  if (!admin || !userId || !email) return false;

  const { data, error } = await admin.auth.admin.getUserById(userId);
  const user = data?.user;
  if (error || !user) return false;
  if ((user.email || '').toLowerCase() !== String(email).toLowerCase()) return false;
  if (Date.now() - new Date(user.created_at).getTime() > 10 * 60 * 1000) return false;
  if (user.user_metadata?.welcome_sent) return false;

  // Claim first so a double call can't send twice.
  await admin.auth.admin.updateUserById(userId, {
    user_metadata: { ...(user.user_metadata || {}), welcome_sent: true },
  });

  const { html, text } = welcomeEmail({ unsubscribeLink: unsubscribeUrl(userId) });
  const res = await sendEmail({ to: user.email, subject: welcomeSubject(), html, text });
  return !!res.sent;
}

export async function POST(req) {
  try {
    const { email, userId } = await req.json();
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER;

    let welcomeSent = false;
    try {
      welcomeSent = await sendWelcome(userId, email);
    } catch (err) {
      console.error('welcome email failed:', err);
    }

    if (!adminEmail) {
      return NextResponse.json({ sent: false, welcomeSent, reason: 'no admin email configured' });
    }

    await sendEmail({
      to: adminEmail,
      subject: `New YourAiFood signup: ${email || 'unknown'}`,
      html: `<p>Someone just created a free account on YourAiFood.</p><p><strong>Email:</strong> ${email || 'unknown'}</p><p><strong>When:</strong> ${new Date().toUTCString()}</p>`,
      text: `New YourAiFood signup: ${email || 'unknown'} (${new Date().toUTCString()})`,
    });

    return NextResponse.json({ sent: true, welcomeSent });
  } catch (err) {
    console.error('notify-signup failed:', err);
    // Never surface this as an error to the client — it's a best-effort notification.
    return NextResponse.json({ sent: false });
  }
}
