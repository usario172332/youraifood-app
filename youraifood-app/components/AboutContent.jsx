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
          <h2 className="mb-2 text-lg font-extrabold text-green-900">Why I built this</h2>
          <p className="text-ink-soft">
            I kept running into the same problem: generic AI chatbots are great at suggesting a single recipe, but
            they're not built to turn a fitness goal into a structured week of meals with real nutrition numbers and
            a shopping list to match. Every time I asked for a full week, I'd get inconsistent, half-invented
            calorie counts and no easy way to shop for it. YourAiFood is the tool I wanted to exist — built to close
            that specific gap, not to be a general-purpose chatbot with a recipe skin on top.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-green-900">How it's different</h2>
          <p className="text-ink-soft">
            Every recipe in the catalog has real, calculated macros and cook time — the AI picks from that
            catalog rather than inventing numbers, so what you see is what you get. Calorie and protein targets are
            calculated from your own stats using the Mifflin-St Jeor formula, not a generic guess.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-green-900">How recipes and macros are checked</h2>
          <p className="text-ink-soft">
            Each recipe's nutrition figures are calculated from its actual ingredient list and serving size —
            calories, protein, carbs, and fat are computed from the ingredients themselves, not written by hand or
            estimated by AI. New and edited recipes go through the same calculation before they're published, and
            the recipe library is reviewed on an ongoing basis to catch and correct mistakes (wrong quantities,
            missing ingredients, mislabelled dietary tags) as they're found.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-green-900">Found something wrong?</h2>
          <p className="text-ink-soft">
            If a recipe's nutrition numbers, ingredients, or instructions look off, please tell me — that's the
            fastest way anything gets fixed. Email{' '}
            <a href="mailto:support@youraifood.com" className="font-semibold text-green-700 underline">
              support@youraifood.com
            </a>{' '}
            with the recipe name and what looks wrong, and I'll look into it directly.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-green-900">Who's behind it</h2>
          <p className="text-ink-soft">
            YourAiFood is built and run independently — it's a small operation, not a big company. There's no large
            support department yet, but every email that comes in gets read by a real person, and the recipe
            library and meal-planning logic are maintained directly by me rather than outsourced.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-green-900">Get in touch</h2>
          <p className="text-ink-soft">
            Questions, feedback, or something broken?{' '}
            <a href="mailto:support@youraifood.com" className="font-semibold text-green-700 underline">
              support@youraifood.com
            </a>{' '}
            — I mean it when I say I read everything.
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
