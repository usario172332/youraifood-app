const NODES = [
  {
    day: 'Monday',
    title: 'A full day planned',
    desc: 'Breakfast, lunch, dinner, and a snack — generated together, not one at a time.',
    badge: null,
  },
  {
    day: 'Tuesday',
    title: "Lunch uses Monday's leftovers",
    desc: "No extra cooking — yesterday's batch covers today's lunch.",
    badge: '♻️ Leftovers',
  },
  {
    day: 'Wednesday',
    title: 'Shopping complete',
    desc: 'One combined grocery list already covered everything for the week.',
    badge: '🛒 Shopping',
  },
  {
    day: 'Friday',
    title: 'Only 15 minutes cooking',
    desc: 'A quick dinner to close out the week without extra effort.',
    badge: '⚡ Quick Dinner',
  },
];

export default function TypicalWeek() {
  return (
    <section className="bg-green-50 px-6 py-16">
      <div className="mx-auto max-w-[1120px]">
        <h2 className="text-center text-2xl font-extrabold text-green-900">A typical week, planned for you</h2>
        <p className="mx-auto mb-10 mt-2 max-w-xl text-center text-ink-soft">
          YourAiFood optimises the whole week at once — not just individual recipes.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {NODES.map((n, i) => (
            <div key={n.day} className="relative">
              <div className="flex h-full flex-col rounded-2xl border border-green-100 bg-white p-5">
                <div className="mb-1 text-xs font-extrabold uppercase tracking-wide text-green-600">{n.day}</div>
                <h3 className="mb-1 text-sm font-extrabold text-green-900">{n.title}</h3>
                <p className="flex-1 text-xs text-ink-soft">{n.desc}</p>
                {n.badge && (
                  <span className="mt-2 inline-block w-fit rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    {n.badge}
                  </span>
                )}
              </div>
              {i < NODES.length - 1 && (
                <span className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-lg font-bold text-green-400 sm:block">
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
