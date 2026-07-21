const BENEFITS = [
  {
    icon: '🥩',
    title: 'Hit Your Protein Goals',
    text: 'Every meal is built to hit your calorie and protein targets — no more guessing, no more falling short by dinner.',
  },
  {
    icon: '⚡',
    title: 'Save Hours Every Week',
    text: 'Stop scrolling recipe sites and rewriting shopping lists by hand. Your whole week is planned in seconds, not hours.',
  },
  {
    icon: '🛒',
    title: 'Never Forget Ingredients',
    text: 'Every plan comes with a grocery list already combined and organized by aisle — one trip, nothing missed.',
  },
  {
    icon: '🥗',
    title: 'Eat Healthier Without Thinking',
    text: 'No more "what should I eat" decision fatigue. Open the app, follow the plan, and feel better by Friday.',
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-[1120px]">
        <h2 className="text-center text-2xl font-extrabold text-green-900">Why people choose YourAiFood</h2>
        <p className="mb-10 text-center text-ink-soft">Less deciding, less searching, more just... eating well.</p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
          {BENEFITS.map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border border-gray-200 bg-white p-6">
              <span className="absolute right-4 top-4 text-xs font-extrabold text-gray-300">0{i + 1}</span>
              <div className="mb-3 text-3xl">{s.icon}</div>
              <h3 className="mb-1.5 text-sm font-extrabold text-green-900">{s.title}</h3>
              <p className="text-sm text-ink-soft">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
