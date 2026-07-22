const ITEMS = [
  'Order groceries from nearby supermarkets, one click',
  'AI meal-prep calendar',
  'Pantry tracking — plans built around what you already have',
  'Family meal planning with per-person portions',
  'Fitness app integrations (Apple Health, Strava, and more)',
];

export default function Roadmap() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-[900px]">
        <div className="rounded-[24px] border border-green-100 bg-green-50 p-8 text-center sm:p-10">
          <span className="mb-3 inline-block rounded-full bg-white px-3.5 py-1.5 text-[13px] font-bold text-green-700">
            Where we're headed
          </span>
          <h2 className="mb-3 text-2xl font-extrabold text-green-900">Plan my week, then order everything I need.</h2>
          <p className="mx-auto mb-8 max-w-xl text-ink-soft">
            The vision: goal → plan → grocery list → local supermarket → checkout, all in one place. Today we
            handle the planning, nutrition, and shopping list — the rest is next.
          </p>
          <div className="mx-auto grid max-w-lg grid-cols-1 gap-2.5 text-left">
            {ITEMS.map((item) => (
              <div key={item} className="flex items-start gap-2.5 rounded-xl bg-white px-4 py-3 text-sm text-ink">
                <span className="mt-0.5 text-green-600">✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
