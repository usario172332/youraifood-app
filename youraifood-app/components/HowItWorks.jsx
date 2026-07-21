const STEPS = [
  {
    icon: '🎯',
    title: 'Tell us your goal',
    text: 'Fat loss, muscle gain, or just eating better — plus your diet, budget, and time to cook. Takes about 30 seconds.',
  },
  {
    icon: '🤖',
    title: 'AI builds your week',
    text: 'No more "what\'s for dinner" panic. Real AI picks 7 days of meals that hit your calorie and protein targets — every number computed from the actual recipe, nothing hallucinated.',
  },
  {
    icon: '🛒',
    title: 'Get your grocery list',
    text: 'Skip the extra trip to the store. Ingredients are combined, organized by aisle, and scaled to your family size automatically.',
  },
  {
    icon: '👨‍🍳',
    title: 'Cook, track, and rate',
    text: 'Follow along, log your weight, and rate what you tried — so next week\'s plan gets even better.',
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-[1120px]">
        <h2 className="text-center text-2xl font-extrabold text-green-900">How it works</h2>
        <p className="mb-10 text-center text-ink-soft">From goal to grocery list — no spreadsheets, no guesswork.</p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
          {STEPS.map((s, i) => (
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
