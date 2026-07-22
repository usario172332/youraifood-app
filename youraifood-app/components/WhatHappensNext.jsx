const STEPS = [
  { n: '1', label: 'Create your account' },
  { n: '2', label: 'Answer 8 quick questions' },
  { n: '3', label: 'Generate your week' },
  { n: '4', label: 'Download your shopping list' },
];

export default function WhatHappensNext() {
  return (
    <section className="px-6 pb-10">
      <div className="mx-auto max-w-[900px]">
        <h2 className="mb-8 text-center text-xl font-extrabold text-green-900">What happens next?</h2>
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-4">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-[11px] font-extrabold text-white">
                  {s.n}
                </span>
                <span className="text-sm font-semibold text-green-900">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <span className="hidden text-gray-300 sm:inline">→</span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
