const CASES = [
  { icon: '🏋️', label: 'I want to build muscle.' },
  { icon: '🥗', label: 'I want to lose weight without counting calories.' },
  { icon: '👨‍👩‍👧', label: 'I cook for my family.' },
  { icon: '⏱️', label: "I don't know what to cook after work." },
  { icon: '🍳', label: 'I want high-protein meals.' },
  { icon: '💰', label: "I'm watching my food budget." },
  { icon: '🌱', label: "I'm vegetarian or vegan." },
];

export default function UseCases() {
  return (
    <section className="px-6 py-14">
      <div className="mx-auto max-w-[1120px] text-center">
        <h2 className="mb-8 text-2xl font-extrabold text-green-900">Sound familiar?</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {CASES.map((c) => (
            <div
              key={c.label}
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink"
            >
              <span className="text-lg">{c.icon}</span>
              {c.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
