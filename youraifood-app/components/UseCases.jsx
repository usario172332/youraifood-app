const CASES = [
  { icon: '🏋️', label: 'Gym-goers building muscle' },
  { icon: '👨‍👩‍👧', label: 'Families cooking for the week' },
  { icon: '🥗', label: 'Weight loss, done sustainably' },
  { icon: '💰', label: 'Budget-conscious cooking' },
  { icon: '🥣', label: 'Meal preppers' },
  { icon: '🌱', label: 'Vegetarian & vegan diets' },
  { icon: '🍳', label: 'High-protein eating' },
];

export default function UseCases() {
  return (
    <section className="px-6 py-14">
      <div className="mx-auto max-w-[1120px] text-center">
        <h2 className="mb-8 text-2xl font-extrabold text-green-900">Perfect for</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {CASES.map((c) => (
            <div
              key={c.label}
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink"
            >
              <span className="text-lg">{c.icon}</span>
              {c.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
