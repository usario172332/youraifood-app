import nodemailer from 'nodemailer';

export const CAMPAIGN = '2026-10-ai-recipe-generator';
export const SUBJECT = 'Your fridge just got a chef 🍳 (new on YourAiFood)';

const LINK = 'https://www.youraifood.com/recipe-generator';

const ITEMS = [
  ['✨', 'Describe it, get it.', 'Type a dish like "high-protein chicken burrito bowl" and get a full recipe with ingredients, steps and calculated macros.'],
  ['🥕', 'Cook With What You Have.', 'Enter what\'s in your fridge and get a recipe built around it.'],
  ['💚', 'Make it healthier.', 'One tap lightens any recipe while keeping the protein.'],
  ['🔄', 'Swap any ingredient.', 'Don\'t have it, or don\'t like it? Pick a swap and the macros update.'],
  ['📅', 'Add it to your plan.', 'Save a recipe, drop it into your meal plan, and it joins your shopping list.'],
  ['👋', 'A smoother start.', 'New accounts now get a 30-second setup for goal, stats and foods to avoid. Your stats stay in your browser.'],
];

export function buildUpdateEmail(unsubUrl) {
  const rows = ITEMS.map(
    ([icon, title, body]) =>
      `<p style="font-size:15px;line-height:1.6;margin:0 0 14px;">${icon} <strong>${title}</strong> ${body}</p>`
  ).join('\n');

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937;">
  <div style="background:#16a34a;padding:28px 24px;border-radius:16px 16px 0 0;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">Your fridge just got a chef 🍳</h1>
  </div>
  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;padding:28px 24px;">
    <p style="font-size:16px;line-height:1.6;">Hi there,</p>
    <p style="font-size:16px;line-height:1.6;">You asked for less meal-prep stress, so we built it. YourAiFood now has an <strong>AI Recipe Generator</strong>:</p>
    ${rows}
    <p style="text-align:center;margin:26px 0;"><a href="${LINK}" style="background:#16a34a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:bold;display:inline-block;">Open the Recipe Generator</a></p>
    <p style="font-size:14px;line-height:1.6;color:#4b5563;">Free accounts get 2 AI recipes a month. Premium gets 30.</p>
    <p style="font-size:15px;line-height:1.6;">We're building this with you, so hit reply and tell us what to add next. We read every message.</p>
    <p style="font-size:15px;line-height:1.6;">Happy cooking,<br>The YourAiFood team</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 12px;">
    <p style="font-size:12px;color:#9ca3af;line-height:1.5;">You're receiving this because you have a YourAiFood account. <a href="${unsubUrl}" style="color:#9ca3af;">Unsubscribe</a> from update emails.</p>
  </div>
</div>`;

  const text = [
    'Your fridge just got a chef (new on YourAiFood)',
    '',
    'Hi there,',
    '',
    'You asked for less meal-prep stress, so we built it. YourAiFood now has an AI Recipe Generator:',
    '',
    ...ITEMS.map(([, t, b]) => `- ${t} ${b}`),
    '',
    `Try it now: ${LINK}`,
    '',
    'Free accounts get 2 AI recipes a month. Premium gets 30.',
    '',
    "We're building this with you, so hit reply and tell us what to add next. We read every message.",
    '',
    'Happy cooking,',
    'The YourAiFood team',
    '',
    `Unsubscribe from update emails: ${unsubUrl}`,
  ].join('\n');

  return { html, text };
}

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) return null;
  transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
  return transporter;
}

// Same SMTP settings as lib/email.js, plus List-Unsubscribe headers.
export async function sendUpdateEmail(to, unsubUrl) {
  const t = getTransporter();
  if (!t) return { sent: false, error: 'SMTP not configured' };
  const { html, text } = buildUpdateEmail(unsubUrl);
  try {
    await t.sendMail({
      from: `"YourAiFood" <${process.env.SMTP_USER}>`,
      to,
      replyTo: 'support@youraifood.com',
      subject: SUBJECT,
      html,
      text,
      headers: {
        'List-Unsubscribe': `<${unsubUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err.message };
  }
}
