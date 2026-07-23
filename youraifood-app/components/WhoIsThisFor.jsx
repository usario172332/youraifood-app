const GROUPS = [
  {
    icon: '🔥',
    title: 'Lose Weight',
    points: ['Automatic calorie targets', 'Shopping list included'],
  },
  {
    icon: '💪',
    title: 'Build Muscle',
    points: ['High-protein plans', 'Macro-focused recipes'],
  },
  {
    icon: '👨‍👩‍👧',
    title: 'Busy Families',
    points: ['Portions scaled to your household', 'Faster weekly planning'],
  },
];

export default function WhoIsThisFor() {
  return (
    <section className="px-6 py-14">
      <div className="mx-auto max-w-[1120px]">
        <h2 className="text-center text-2xl font-extrabold text-green-900">Who is this for?</h2>
        <p className="mx-auto mb-8 mt-2 max-w-xl text-center text-ink-soft">
          Whatever brought you here, the planner adapts to your goal.
        </p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {GROUPS.map((g) => (
            <div key={g.title} className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
              <div className="mb-2 text-3xl">{g.icon}</div>
              <h3 className="mb-2 text-sm font-extrabold text-green-900">{g.title}</h3>
              <ul className="space-y-1 text-sm text-ink-soft">
                {g.points.map((p) => (
                  <li key={p} className="flex items-center justify-center gap-1.5">
                    <span className="text-green-600">✓</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
