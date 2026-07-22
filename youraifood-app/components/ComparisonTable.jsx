const TRADITIONAL = ['Search recipes', 'Count calories', 'Write shopping list', 'Repeat every week'];
const YOURAIFOOD = ['One click', 'Complete weekly plan', 'Automatic shopping list', 'Nutrition included'];

export default function ComparisonTable() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-[840px]">
        <h2 className="mb-10 text-center text-2xl font-extrabold text-green-900">
          Traditional planning vs. YourAiFood
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-7">
            <h3 className="mb-5 text-xs font-extrabold uppercase tracking-wide text-gray-500">Traditional planning</h3>
            <ul className="space-y-3.5">
              {TRADITIONAL.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm font-semibold text-ink-soft">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-500">✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border-2 border-green-300 bg-green-50/60 p-7">
            <h3 className="mb-5 text-xs font-extrabold uppercase tracking-wide text-green-700">YourAiFood</h3>
            <ul className="space-y-3.5">
              {YOURAIFOOD.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm font-bold text-ink">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-600 text-xs text-white">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
