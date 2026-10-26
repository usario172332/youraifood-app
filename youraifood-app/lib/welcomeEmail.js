// Welcome email sent immediately after a new signup.
const SITE = 'https://www.youraifood.com';

export function welcomeSubject() {
  return "Welcome to YourAiFood — let's build your first plan 💪";
}

export function welcomeEmail({ unsubscribeLink }) {
  const html = [
    '<div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">',
    '  <div style="background: #16a34a; padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">',
    '    <h1 style="color: #ffffff; margin: 0; font-size: 26px;">You\'re in. Let\'s get to work! 💪</h1>',
    '  </div>',
    '  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px; padding: 32px 24px;">',
    '    <p style="font-size: 16px; line-height: 1.6;">Welcome to YourAiFood! No more guessing what to eat — tell us your goal and we\'ll build your week: meals, macros and a ready-made shopping list.</p>',
    '    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 8px;"><strong>Your game plan:</strong></p>',
    '    <ol style="font-size: 15px; line-height: 1.8; padding-left: 20px; margin-top: 0;">',
    '      <li><strong>Generate your plan</strong> — pick your goal, diet and time.</li>',
    '      <li><strong>Grab your shopping list</strong> — grouped by aisle, one tap away.</li>',
    '      <li><strong>Try the AI Recipe Generator</strong> — turn what\'s in your fridge into a high-protein meal.</li>',
    '    </ol>',
    `    <p style="text-align: center; margin: 28px 0;"><a href="${SITE}/" style="background: #16a34a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 999px; font-weight: bold; font-size: 16px; display: inline-block;">Generate my plan</a></p>`,
    '    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px 20px; margin: 24px 0;">',
    '      <p style="margin: 0 0 6px; font-size: 15px; font-weight: bold; color: #14532d;">Want to train harder? Go Premium.</p>',
    '      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #14532d;">Unlock the full recipe library and more AI meal plans and shopping lists. Start with a free trial and cancel anytime from your profile.</p>',
    `      <p style="margin: 12px 0 0;"><a href="${SITE}/#pricing" style="color: #16a34a; font-weight: bold; text-decoration: none;">See Premium &rarr;</a></p>`,
    '    </div>',
    '    <p style="font-size: 13px; color: #9ca3af; line-height: 1.5;">Questions? Just reply to this email.</p>',
    unsubscribeLink
      ? `    <p style="font-size: 12px; color: #9ca3af;"><a href="${unsubscribeLink}" style="color: #9ca3af;">Unsubscribe</a> from non-essential emails.</p>`
      : '',
    '  </div>',
    '</div>',
  ].join('\n');

  const text = [
    "You're in. Let's get to work!",
    '',
    "Welcome to YourAiFood! Tell us your goal and we'll build your week: meals, macros and a ready-made shopping list.",
    '',
    'Your game plan:',
    '1. Generate your plan - pick your goal, diet and time.',
    '2. Grab your shopping list - grouped by aisle.',
    "3. Try the AI Recipe Generator - turn what's in your fridge into a high-protein meal.",
    '',
    `Generate my plan: ${SITE}/`,
    '',
    `Want to train harder? Go Premium - full recipe library, more AI plans and shopping lists. Start with a free trial, cancel anytime: ${SITE}/#pricing`,
    '',
    'Questions? Just reply to this email.',
    unsubscribeLink ? `Unsubscribe: ${unsubscribeLink}` : '',
  ].join('\n');

  return { html, text };
}
