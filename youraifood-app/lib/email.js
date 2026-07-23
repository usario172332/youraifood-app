import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
    if (transporter) return transporter;
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 465);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;
    if (!host || !user || !pass) return null;
    transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
    });
    return transporter;
}

export async function sendEmail({ to, subject, html, text }) {
    const t = getTransporter();
    if (!t) {
          console.error('sendEmail: SMTP env vars are not configured, skipping send.');
          return { sent: false, error: 'SMTP not configured' };
    }
    try {
          await t.sendMail({
                  from: `"YourAiFood" <${process.env.SMTP_USER}>`,
                  to,
                  subject,
                  html,
                  text,
          });
          return { sent: true };
    } catch (err) {
          console.error('sendEmail failed:', err);
          return { sent: false, error: err.message };
    }
}

function formatPrice(amount, currency) {
    const value = (amount / 100).toFixed(2);
    const symbols = { eur: '€', usd: '$', gbp: '£' };
    const symbol = symbols[(currency || '').toLowerCase()] || '';
    return symbol ? `${symbol}${value}` : `${value} ${(currency || '').toUpperCase()}`;
}

export function formatRenewalDate(unixSeconds) {
    return new Date(unixSeconds * 1000).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
    });
}

export function premiumConfirmationSubject() {
    return "You're in — YourAiFood Premium is live!";
}

export function premiumConfirmationEmail({ planInterval, unitAmount, currency, renewalDateLabel, isTrial }) {
    const planLabel = planInterval === 'year' ? 'Yearly' : 'Monthly';
    const priceLabel = `${formatPrice(unitAmount, currency)} / ${planInterval}`;
  
    const renewalLine = isTrial
                  ? `Your free trial runs until <strong>${renewalDateLabel}</strong> — after that, it automatically becomes your ${planLabel} subscription at ${priceLabel}. Cancel anytime before then from your profile and you won't pay a thing.`
          : `Your ${planLabel} plan renews on <strong>${renewalDateLabel}</strong> for ${priceLabel}. Cancel anytime from your profile — no questions asked.`;
  
    const renewalLineText = renewalLine.replace(/<[^>]+>/g, '');
  
    const html = [
          '<div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">',
          '  <div style="background: #16a34a; padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">',
          '    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Welcome to Premium!</h1>',
          '  </div>',
          '  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px; padding: 32px 24px;">',
          '    <p style="font-size: 16px; line-height: 1.6;">You\'re officially a YourAiFood Premium member. Your full recipe library, unlimited AI meal plans, and shopping lists are unlocked — enjoy!</p>',
          `    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px 20px; margin: 24px 0;"><p style="margin: 0; font-size: 15px; line-height: 1.6; color: #14532d;">${renewalLine}</p></div>`,
          '    <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">Ready to build this week\'s plan?</p>',
          '    <p style="text-align: center; margin: 24px 0;"><a href="https://www.youraifood.com/" style="background: #16a34a; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 999px; font-weight: bold; display: inline-block;">Build my week</a></p>',
          '    <p style="font-size: 13px; color: #9ca3af; line-height: 1.5;">Manage or cancel your subscription anytime from your Profile page. Questions? Just reply to this email.</p>',
          '  </div>',
          '</div>',
        ].join('\n');
  
    const text = [
          'Welcome to YourAiFood Premium!',
          '',
          "You're officially a Premium member. Your full recipe library, unlimited AI meal plans, and shopping lists are unlocked.",
          '',
          renewalLineText,
          '',
          "Build this week's plan: https://www.youraifood.com/",
          '',
          'Manage or cancel anytime from your Profile page.',
        ].join('\n');
  
    return { html, text };
}
