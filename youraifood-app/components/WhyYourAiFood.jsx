const ROWS = [
  { before: 'You re-type the same prompt every week', after: 'Guided setup — set your goal once, get a full plan' },
  { before: 'Nutrition numbers are often invented or estimated', after: 'Calories and macros calculated from real recipe ingredients' },
  { before: 'Recipes are disconnected, one-off suggestions', after: 'A complete, structured weekly meal plan' },
  { before: 'No shopping list — you build it yourself', after: 'Automatic, combined grocery list every time' },
  { before: 'Hard to change just one day without starting over', after: 'Replace a single day instantly, keep the rest' },
];

export default function WhyYourAiFood() {
  return (
    <section className="bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-[1120px]">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold text-green-900">Why not just use ChatGPT?</h2>
          <p className="mx-auto mt-3 text-ink-soft">
            A dedicated platform built for meal planning — not a chatbot you have to steer.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="grid grid-cols-2 border-b border-gray-200 text-sm font-extrabold">
            <div className="border-r border-gray-200 px-5 py-3 text-gray-500">Generic AI</div>
            <div className="px-5 py-3 text-green-700">YourAiFood</div>
          </div>
          {ROWS.map((row) => (
            <div key={row.before} className="grid grid-cols-2 border-b border-gray-100 text-sm last:border-b-0">
              <div className="flex items-start gap-2 border-r border-gray-200 px-5 py-4 text-ink-soft">
                <span className="mt-0.5 text-gray-300">✕</span>
                <span>{row.before}</span>
              </div>
              <div className="flex items-start gap-2 px-5 py-4 font-semibold text-ink">
                <span className="mt-0.5 text-green-600">✓</span>
                <span>{row.after}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
