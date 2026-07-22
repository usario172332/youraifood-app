const STEPS = [
  { icon: '🎯', label: 'Choose your goals' },
  { icon: '🤖', label: 'AI creates your week' },
  { icon: '📋', label: 'Receive recipes and shopping list' },
  { icon: '🍳', label: 'Start cooking' },
];

export default function WhatHappensNext() {
  return (
    <section className="px-6 pb-10">
      <div className="mx-auto max-w-[900px]">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3.5 py-1.5">
                <span className="text-sm">{s.icon}</span>
                <span className="text-xs font-semibold text-green-900">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <span className="hidden text-gray-300 sm:inline">→</span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
