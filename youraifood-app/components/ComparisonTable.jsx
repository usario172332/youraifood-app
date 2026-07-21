const ROWS = [
  { before: 'Search recipes manually', after: 'AI builds your week in seconds' },
  { before: 'Guess calories', after: 'Exact nutrition, computed from real recipes' },
  { before: 'Forget ingredients', after: 'Automatic, aisle-organized shopping list' },
  { before: 'Eat the same meals on repeat', after: 'Endless variety across 235+ recipes' },
  { before: "Doesn't fit your goals", after: 'Personalized to your calories, protein, and budget' },
];

export default function ComparisonTable() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-[840px]">
        <h2 className="mb-10 text-center text-2xl font-extrabold text-green-900">
          Traditional meal planning vs. YourAiFood
        </h2>
        <div className="overflow-hidden rounded-2xl border border-gray-200">
          <div className="grid grid-cols-2 bg-gray-50 text-sm font-extrabold text-ink">
            <div className="border-r border-gray-200 px-5 py-3 text-gray-500">Traditional planning</div>
            <div className="px-5 py-3 text-green-700">YourAiFood</div>
          </div>
          {ROWS.map((row, i) => (
            <div
              key={row.before}
              className={`grid grid-cols-2 text-sm ${i !== ROWS.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <div className="flex items-start gap-2 border-r border-gray-100 px-5 py-4 text-ink-soft">
                <span className="mt-0.5 text-gray-300">✕</span>
                {row.before}
              </div>
              <div className="flex items-start gap-2 bg-green-50/40 px-5 py-4 font-semibold text-ink">
                <span className="mt-0.5 text-green-600">✓</span>
                {row.after}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
