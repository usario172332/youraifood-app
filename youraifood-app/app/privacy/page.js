export const metadata = {
  title: 'Privacy Policy — YourAiFood',
  description: 'What personal data YourAiFood collects, why, and how you can control it.',
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-ink">
      <a href="/" className="text-sm font-semibold text-green-700">← Back to YourAiFood</a>
      <h1 className="mb-2 mt-4 text-3xl font-extrabold text-green-900">Privacy Policy</h1>
      <p className="mb-10 text-sm text-ink-soft">Last updated: 23 July 2026</p>

      <div className="space-y-8 text-[15px] leading-relaxed">
        <section>
          <h2 className="mb-2 text-lg font-bold text-green-900">1. Who we are</h2>
          <p>
            YourAiFood ("we", "us") operates youraifood.com, a service that generates personalized meal
            plans using AI. This policy explains what personal data we collect, why, and how you can
            control it.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-green-900">2. What we collect</h2>
          <p className="mb-2"><b>Account information:</b> your email address and password (your password is stored securely by our authentication provider, Supabase, and is never visible to us in plain text).</p>
          <p className="mb-2"><b>Sensitive body metrics (weight, height, age, sex, activity level):</b> you enter these into the planner so we can calculate your daily calorie and protein targets. This calculation happens entirely in your browser — the raw weight, height, age, and sex values are <b>not</b> sent to our servers or to Anthropic. Only the calculated calorie and protein targets (numbers like "2,100 kcal" and "140g protein") are transmitted to generate your plan.</p>
          <p className="mb-2"><b>Weight diary (optional):</b> if you choose to log your weight over time on your profile page, those individual entries are stored in our database, tied to your account, and protected so that only you can view or delete them.</p>
          <p className="mb-2"><b>Plan preferences:</b> your fitness goal, calculated targets, dietary preferences, ingredient preference, cooking time preference, and household size are sent to our servers to generate your plan.</p>
          <p className="mb-2"><b>Generated content:</b> the meal plans, grocery lists, and nutrition breakdowns produced for you, which we store so you can revisit past plans.</p>
          <p className="mb-2"><b>Subscription & billing:</b> if you subscribe to Premium, our payment processor, Stripe, handles your card details directly — we never see or store your full card number. We keep a reference to your Stripe customer and subscription ID so we know your account is subscribed.</p>
          <p><b>Cookies & local storage:</b> we use browser storage to keep you signed in (via Supabase authentication) and to remember your cookie preference. See Section 5.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-green-900">3. How we use your data</h2>
          <p>We use your data to: generate your personalized meal plans, maintain your account and subscription status, enforce free-tier usage limits, process payments, and improve the service. We do not sell your personal data.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-green-900">4. Who we share it with</h2>
          <p className="mb-2">We share data with the following service providers, only as needed to run YourAiFood:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li><b>Supabase</b> — hosts our database and handles account authentication.</li>
            <li><b>Anthropic</b> — receives your goal, calorie/protein targets, ingredient preference, dietary needs, and our recipe catalog in order to generate your plan. Anthropic does not receive your name, email, or payment information.</li>
            <li><b>Stripe</b> — processes payments and manages subscriptions; receives your email and payment details directly.</li>
            <li><b>Vercel</b> — hosts the website and processes requests to deliver the app to your browser.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-green-900">5. Cookies</h2>
          <p>We use essential browser storage to keep you signed in. We don't currently use third-party advertising or tracking cookies. If that changes, this policy and the cookie banner will be updated accordingly.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-green-900">6. Your rights</h2>
          <p>You can access, correct, or delete your account data at any time by contacting us (Section 8). If you're in the EU/EEA or UK, you have rights under GDPR/UK GDPR including access, rectification, erasure, and data portability.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-green-900">7. Data retention</h2>
          <p>We retain your account and plan data for as long as your account is active. If you delete your account, we delete your associated data, except where we're required to retain billing records for legal or tax purposes.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-green-900">8. Contact</h2>
          <p>Questions about this policy or your data? Contact us at <b>privacy@youraifood.com</b>.</p>
        </section>
      </div>
    </div>
  );
}
