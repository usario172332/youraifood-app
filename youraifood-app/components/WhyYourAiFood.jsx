const BENEFITS = [
  { icon: '🥗', title: 'Personalised weekly meal plans', text: 'Every plan is built around your goal, not a generic recipe list.' },
  { icon: '⚡', title: 'Save hours every week', text: 'Your whole week is planned in seconds, not hours of scrolling.' },
  { icon: '🛒', title: 'Automatic shopping lists', text: 'Every plan comes with a grocery list, organized and ready to shop.' },
  { icon: '💪', title: 'Nutrition designed around your goals', text: 'Real calories, protein and macros — calculated for every meal.' },
];

export default function WhyYourAiFood() {
  return (
    <section className="bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-[1120px]">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold text-green-900">Why people choose YourAiFood</h2>
          <p className="mx-auto mt-3 text-ink-soft">
            A dedicated platform built for meal planning — not a chatbot you have to steer.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
          {BENEFITS.map((b, i) => (
            <div key={b.title} className="relative rounded-2xl border border-gray-200 bg-white p-6">
              <span className="absolute right-4 top-4 text-xs font-extrabold text-gray-300">0{i + 1}</span>
              <div className="mb-3 text-3xl">{b.icon}</div>
              <h3 className="mb-1.5 text-sm font-extrabold text-green-900">{b.title}</h3>
              <p className="text-sm text-ink-soft">{b.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
