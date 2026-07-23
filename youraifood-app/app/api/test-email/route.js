import { NextResponse } from 'next/server';
import { sendEmail, premiumConfirmationSubject, premiumConfirmationEmail, formatRenewalDate } from '../../../lib/email';

// TEMPORARY: verifies SMTP wiring for the Premium confirmation email. Remove after testing.
const TEST_KEY = 'yaf-temp-test-8821xk';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    if (key !== TEST_KEY) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const isTrial = searchParams.get('trial') === '1';
    const renewalDateLabel = formatRenewalDate(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60);

  const result = await sendEmail({
        to: 'support@youraifood.com',
        subject: premiumConfirmationSubject(),
        ...premiumConfirmationEmail({
                planInterval: 'month',
                unitAmount: 777,
                currency: 'eur',
                renewalDateLabel,
                isTrial,
        }),
  });

  return NextResponse.json(result);
}
