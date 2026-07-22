const STEPS = [
  { icon: '🎯', label: 'Choose your goal', live: true },
  { icon: '🤖', label: 'AI meal planner', live: true },
  { icon: '🍳', label: 'Real recipes', live: true },
  { icon: '📊', label: 'Macros & calories', live: true },
  { icon: '🛒', label: 'Shopping list', live: true },
  { icon: '📍', label: 'Nearby supermarkets', live: false },
  { icon: '✅', label: 'One-click order', live: false },
];

export default function EcosystemDiagram() {
  return (
    <section className="bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-[1120px] text-center">
        <h2 className="mb-2 text-2xl font-extrabold text-green-900">Not just recipes — a full food platform</h2>
        <p className="mx-auto mb-10 max-w-2xl text-ink-soft">
          From "what should I eat" to "it's in my kitchen" — all in one place.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2">
              <div
                className={`flex w-[132px] flex-col items-center rounded-2xl border p-4 ${
                  s.live ? 'border-gray-200 bg-white' : 'border-dashed border-green-300 bg-white/60'
                }`}
              >
                <div className="mb-1.5 text-2xl">{s.icon}</div>
                <div className="text-xs font-bold leading-tight text-green-900">{s.label}</div>
                {!s.live && (
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-green-500">Coming soon</div>
                )}
              </div>
              {i < STEPS.length - 1 && <span className="text-lg text-gray-300">→</span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
