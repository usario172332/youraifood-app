const STEPS = [
  {
    icon: '🎯',
    title: 'Tell us your goal',
    text: 'Fitness goal, weight, activity level, dietary needs, weekly budget, and how much time you have to cook.',
  },
  {
    icon: '🤖',
    title: 'AI builds your week',
    text: 'Real AI picks 7 days of meals from our recipe library that hit your calorie and protein targets — nothing hallucinated, every number is computed from the actual recipe.',
  },
  {
    icon: '🛒',
    title: 'Get your grocery list',
    text: 'Ingredients are combined and organized by aisle, with quantities scaled to your family size and minimal waste built in.',
  },
  {
    icon: '👨‍🍳',
    title: 'Cook, track, and rate',
    text: 'Follow the recipes, log your weight, save favorites, and rate what you tried — your feedback shapes what shows up next time.',
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-[1120px]">
        <h2 className="text-center text-2xl font-extrabold text-green-900">How it works</h2>
        <p className="mb-10 text-center text-ink-soft">From goal to grocery list in four steps</p>
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
