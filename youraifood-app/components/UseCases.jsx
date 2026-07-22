const CASES = [
  { icon: '🏋️', label: 'Want to build muscle?' },
  { icon: '👨‍👩‍👧', label: 'Cooking for your family?' },
  { icon: '🥗', label: 'Trying to lose weight?' },
  { icon: '💰', label: 'Watching your food budget?' },
  { icon: '⏱️', label: "Don't know what to cook after work?" },
  { icon: '🌱', label: 'Eating vegetarian or vegan?' },
  { icon: '🍳', label: 'Looking for high-protein meals?' },
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
