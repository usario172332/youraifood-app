const ROWS = [
  { before: 'Manual prompting, every single week', after: 'One-click weekly plan generation' },
  { before: "Plans aren't saved anywhere", after: 'Every plan saved to your account, ready to revisit' },
  { before: 'No shopping list', after: 'Aisle-organized shopping list, included automatically' },
  { before: 'Generic, unverified nutrition guesses', after: 'Real macros, calculated from actual recipe data' },
  { before: 'One recipe at a time, no structure', after: 'A complete, structured 7-day plan' },
];

export default function WhyNotChatGPT() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-[840px]">
        <h2 className="mb-3 text-center text-2xl font-extrabold text-green-900">
          Why not just ask ChatGPT?
        </h2>
        <p className="mx-auto mb-10 max-w-lg text-center text-sm text-ink-soft">
          A general AI chatbot can absolutely suggest a recipe. It's just not built to plan your whole week, remember
          your targets, or hand you a shopping list — that's the gap YourAiFood exists to close.
        </p>
        <div className="overflow-hidden rounded-2xl border border-gray-200">
          <div className="grid grid-cols-2 bg-gray-50 text-sm font-extrabold text-ink">
            <div className="border-r border-gray-200 px-5 py-3 text-gray-500">A general AI chatbot</div>
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
