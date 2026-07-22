const BENEFITS = [
  { icon: '🥗', title: 'Personalised weekly meal plans', text: 'Every plan is built around your goal, not a generic recipe list.' },
  { icon: '⚡', title: 'Save hours every week', text: 'Your whole week is planned in seconds, not hours of scrolling.' },
  { icon: '🛒', title: 'Automatic shopping lists', text: 'Every plan comes with a grocery list, organized and ready to shop.' },
  { icon: '💪', title: 'Nutrition designed around your goals', text: 'Real calories, protein and macros — calculated for every meal.' },
];

const ROWS = [
  { before: 'Requires manual prompting', after: 'One-click personalised meal plans' },
  { before: 'No saved plans', after: 'Saved plans' },
  { before: 'No structured weekly planning', after: 'Weekly planning' },
  { before: 'No shopping list', after: 'Automatic shopping lists' },
  { before: 'No nutrition dashboard', after: 'Nutrition tracking' },
];

export default function WhyYourAiFood() {
  return (
    <section className="bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-[1120px]">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold text-green-900">Why people choose YourAiFood</h2>
          <p className="mx-auto mt-3 text-ink-soft">
            A dedicated platform built for meal planning — not a chatbot you have to steer.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
          {BENEFITS.map((b, i) => (
            <div key={b.title} className="relative rounded-2xl border border-gray-200 bg-white p-6">
              <span className="absolute right-4 top-4 text-xs font-extrabold text-gray-300">0{i + 1}</span>
              <div className="mb-3 text-3xl">{b.icon}</div>
              <h3 className="mb-1.5 text-sm font-extrabold text-green-900">{b.title}</h3>
              <p className="text-sm text-ink-soft">{b.text}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="grid grid-cols-2 bg-gray-50 text-sm font-extrabold">
            <div className="border-r border-gray-200 px-5 py-3 text-gray-500">General AI</div>
            <div className="px-5 py-3 text-green-700">YourAiFood</div>
          </div>
          {ROWS.map((row, i) => (
            <div key={row.after} className={`grid grid-cols-2 text-sm ${i !== ROWS.length - 1 ? 'border-b border-gray-100' : ''}`}>
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
