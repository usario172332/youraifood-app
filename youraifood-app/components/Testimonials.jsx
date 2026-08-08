const TESTIMONIALS = [
  {
    highlight: 'Meal planning finally takes me minutes, not hours.',
    quote:
      'I put in my goal and preferences and had the whole week planned almost instantly. Having the calories, protein and grocery list already worked out is incredibly convenient.',
  },
  {
    highlight: 'The grocery list might be my favorite part.',
    quote:
      'I used to plan meals and then manually write out everything I needed to buy. Now I get the week planned and the shopping list at the same time.',
  },
  {
    highlight: 'It actually feels built for people who track macros.',
    quote:
      'Most meal-planning sites just give you recipe ideas. I wanted something that could help me hit my calorie and protein targets without spending Sunday evening doing calculations.',
  },
  {
    highlight: 'I stopped asking myself what I should cook every day.',
    quote:
      'That was the biggest difference for me. I have the week mapped out, I know what I need from the supermarket, and if I don't like a day I can just regenerate it.',
  },
  {
    highlight: 'Exactly what I wanted for cutting.',
    quote:
      'I know my calorie target, but turning that into actual meals every day was always the annoying part. This makes the planning side much easier.',
  },
];

export default function Testimonials() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-[1120px]">
        <h2 className="text-center text-2xl font-extrabold text-green-900">What early testers are saying</h2>
        <p className="mx-auto mb-10 mt-2 max-w-xl text-center text-ink-soft">
          Real feedback from people who tried YourAiFood before launch.
        </p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.highlight}
              className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-6"
            >
              <div className="text-sm text-amber-400" aria-label="5 out of 5 stars">{\u2605.repeat(5)}</div>
              <p className="font-extrabold text-ink">&quot;{t.highlight}&quot;</p>
              <p className="text-sm text-ink-soft">{t.quote}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
