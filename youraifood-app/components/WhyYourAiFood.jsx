const JOURNEY = [
  { icon: '🎯', label: 'Pick your goal' },
  { icon: '🍳', label: 'Personalized recipes' },
  { icon: '📅', label: 'Full weekly plan' },
  { icon: '📊', label: 'Calories & macros' },
  { icon: '🛒', label: 'Grocery list' },
  { icon: '🚚', label: 'Grocery ordering', soon: true },
];

const ROWS = [
  { generic: 'Suggests individual recipes, one at a time', us: 'Builds every recipe around your specific goal' },
  { generic: "Doesn't give you a structured weekly plan", us: 'Creates a complete 7-day meal plan, every time' },
  { generic: 'You write your own shopping list', us: 'Generates the shopping list for you, automatically' },
  { generic: 'Not built for nutrition tracking', us: 'Calculates real calories, protein and macros for every meal' },
  { generic: 'Stops at giving you ideas', us: 'Connects the full journey — from "what should I eat" to what to buy' },
];

export default function WhyYourAiFood() {
  return (
    <section className="bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-[1120px]">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold text-green-900">Why not just use ChatGPT?</h2>
          <p className="mt-2 text-lg font-bold text-green-700">Tell us your goal. We'll handle the rest.</p>
          <p className="mx-auto mt-3 text-ink-soft">
            ChatGPT can suggest a recipe. YourAiFood turns your goal into a full week of meals, real nutrition
            numbers, and a shopping list — automatically.
          </p>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-1 gap-y-4">
          {JOURNEY.map((step, i) => (
            <div key={step.label} className="flex items-center gap-1">
              <div className={`flex w-[108px] flex-col items-center gap-1 rounded-2xl border px-3 py-4 text-center ${step.soon ? 'border-dashed border-gray-300 bg-white' : 'border-green-200 bg-green-50'}`}>
                <span className="text-2xl">{step.icon}</span>
                <span className="text-xs font-bold text-green-900">{step.label}</span>
                {step.soon && <span className="text-[9px] font-extrabold text-amber-600">COMING SOON</span>}
              </div>
              {i < JOURNEY.length - 1 && <span className="hidden text-gray-300 sm:inline">→</span>}
            </div>
          ))}
        </div>
        <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="grid grid-cols-2 bg-gray-50 text-sm font-extrabold">
            <div className="border-r border-gray-200 px-5 py-3 text-gray-500">ChatGPT</div>
            <div className="px-5 py-3 text-green-700">YourAiFood</div>
          </div>
          {ROWS.map((row, i) => (
            <div key={row.us} className={`grid grid-cols-2 text-sm ${i !== ROWS.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <div className="border-r border-gray-100 px-5 py-4 text-ink-soft">{row.generic}</div>
              <div className="bg-green-50/40 px-5 py-4 font-semibold text-ink">{row.us}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
