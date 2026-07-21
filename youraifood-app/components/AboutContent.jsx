import Link from 'next/link';

export default function AboutContent() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="text-3xl font-extrabold text-green-900">About YourAiFood</h1>
      <p className="mt-4 text-lg text-ink-soft">
        YourAiFood exists to close the gap between "I know roughly what I should eat" and "I have a real plan and a
        grocery list in hand."
      </p>

      <div className="mt-10 space-y-8 text-ink">
        <section>
          <h2 className="mb-2 text-lg font-extrabold text-green-900">Why this exists</h2>
          <p className="text-ink-soft">
            Generic AI chatbots are great at suggesting a recipe. They're not built to turn a fitness goal into a
            structured week of meals, with real nutrition numbers and a shopping list to match. That gap — between a
            single suggestion and an actual usable plan — is what YourAiFood is built to close.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-green-900">How it's different</h2>
          <p className="text-ink-soft">
            Every recipe in the catalog has real, calculated macros, cost, and cook time — the AI picks from that
            catalog rather than inventing numbers, so what you see is what you get. Calorie and protein targets are
            calculated from your own stats using the Mifflin-St Jeor formula, not a generic guess.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-green-900">Who's behind it</h2>
          <p className="text-ink-soft">
            YourAiFood is built and run independently — it's a small operation, not a big company. There's no large
            support department yet, but every email that comes in gets read by a real person.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-green-900">Get in touch</h2>
          <p className="text-ink-soft">
            Questions, feedback, or something broken?{' '}
            <a href="mailto:support@youraifood.com" className="font-semibold text-green-700 underline">
              support@youraifood.com
            </a>{' '}
            — we mean it when we say we read everything.
          </p>
        </section>
      </div>

      <div className="mt-12 rounded-xl border border-dashed border-green-300 bg-green-50 p-6 text-center">
        <p className="mb-3 text-sm text-ink-soft">Ready to see what a real weekly plan looks like?</p>
        <Link
          href="/#planner"
          className="inline-block rounded-full bg-green-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-700"
        >
          Build my weekly plan →
        </Link>
      </div>
    </div>
  );
}
