import { NextResponse } from 'next/server';
import { sendEmail } from '../../../lib/email';

// Fired (fire-and-forget from the client) right after a successful
// supabase.auth.signUp() so the site owner gets a heads-up email whenever
// someone creates a free account. Best-effort only: never blocks or breaks
// the signup flow if SMTP isn't configured or the send fails.
export async function POST(req) {
  try {
    const { email } = await req.json();
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER;

    if (!adminEmail) {
      return NextResponse.json({ sent: false, reason: 'no admin email configured' });
    }

    await sendEmail({
      to: adminEmail,
      subject: `New YourAiFood signup: ${email || 'unknown'}`,
      html: `<p>Someone just created a free account on YourAiFood.</p><p><strong>Email:</strong> ${email || 'unknown'}</p><p><strong>When:</strong> ${new Date().toUTCString()}</p>`,
      text: `New YourAiFood signup: ${email || 'unknown'} (${new Date().toUTCString()})`,
    });

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error('notify-signup failed:', err);
    // Never surface this as an error to the client — it's a best-effort notification.
    return NextResponse.json({ sent: false });
  }
}
