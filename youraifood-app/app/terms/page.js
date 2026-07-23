export const metadata = {
  title: 'Terms of Service — YourAiFood',
  description: 'The terms that apply to using YourAiFood, including subscription billing, free trials, and cancellation.',
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-ink">
      <a href="/" className="text-sm font-semibold text-green-700">← Back to YourAiFood</a>
      <h1 className="mb-2 mt-4 text-3xl font-extrabold text-green-900">Terms of Service</h1>
      <p className="mb-10 text-sm text-ink-soft">Last updated: 23 July 2026</p>

      <div className="space-y-8 text-[15px] leading-relaxed">
        <section>
          <h2 className="mb-2 text-lg font-bold text-green-900">1. Agreement to these terms</h2>
          <p>
            These terms govern your use of YourAiFood ("we", "us"), a service available at youraifood.com that
            generates personalised meal plans using AI. By creating an account or using the site, you agree to
            these terms. If you don't agree, please don't use the service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-green-900">2. What the service is</h2>
          <p>
            YourAiFood generates weekly meal plans, grocery lists, and nutrition estimates based on the goals,
            ingredient preferences, and dietary needs you provide, drawing from our recipe library. Nutrition
            figures (calories, protein, cost) are calculated from the recipe data itself, not estimated by the AI.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-green-900">3. Not medical or dietary advice</h2>
          <p>
            YourAiFood is a planning tool, not a medical, nutritional, or dietary advice service. The meal plans
            and calorie/protein targets it produces are general suggestions and shouldn't replace guidance from a
            doctor, registered dietitian, or other qualified professional — especially if you have a medical
            condition, are pregnant or breastfeeding, or have specific dietary or health needs. Always consult a
            professional before making significant changes to your diet.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-green-900">4. Accounts</h2>
          <p>
            You need an account to save plans, favourite recipes, and subscribe to Premium. You're responsible for
            keeping your login credentials secure and for activity that happens under your account. You must be
            able to legally enter into a contract in your country to create an account.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-green-900">5. Free plan and Premium subscription</h2>
          <p className="mb-2">
            <b>Free plan:</b> includes browsing the recipe library, a limited number of AI-generated meal plans
            per month, and a shopping list generator, at no cost.
          </p>
          <p className="mb-2">
            <b>Premium subscription:</b> unlocks unlimited AI meal plans and the full recipe library for a
            recurring fee, billed monthly or yearly at the price shown on the pricing page at the time you
            subscribe. New monthly subscriptions include a 7-day free trial and require valid payment details at
            signup; you won't be charged until the trial ends, and you can cancel any time before then to avoid
            being charged. The yearly plan is billed in full at signup and does not include a free trial.
          </p>
          <p>
            Subscriptions renew automatically at the end of each billing period until cancelled. Payments are
            processed by Stripe; we don't store your full card details.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-green-900">6. Cancellation and refunds</h2>
          <p className="mb-2">
            You can cancel your Premium subscription at any time from your profile page, which opens Stripe's
            billing portal. Cancelling stops future renewals — you'll keep Premium access until the end of the
            billing period you already paid for, and you won't be charged again after that.
          </p>
          <p>
            We don't offer prorated refunds for the unused portion of a billing period. If you believe you were
            charged in error, contact us (Section 10) and we'll look into it.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-green-900">7. Acceptable use</h2>
          <p>
            Please don't misuse the service — for example, by attempting to circumvent free-tier limits, scraping
            the recipe library at scale, sharing a single Premium account across many people, or using the
            service in a way that disrupts it for others.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-green-900">8. Changes to the service or these terms</h2>
          <p>
            We may update these terms, the recipe library, pricing, or features of the service over time. If we
            make material changes to these terms, we'll update the "Last updated" date above. Continuing to use
            the service after changes take effect means you accept the updated terms.
        </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-green-900">9. Limitation of liability</h2>
          <p>
            The service is provided "as is." To the extent permitted by law, we're not liable for indirect
            damages arising from your use of the service, including outcomes related to diet, health, or
            nutrition decisions you make based on a generated plan.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-green-900">10. Contact</h2>
          <p>
            Questions about these terms, your subscription, or a charge? Contact us at{' '}
            <b>support@youraifood.com</b>.
          </p>
        </section>
      </div>
    </div>
  );
}
