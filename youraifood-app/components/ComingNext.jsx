const ITEMS = [
  'Pantry-aware meal planning',
  'Grocery shopping integrations',
  'Family meal planning',
];

export default function ComingNext() {
  return (
    <section className="px-6 py-10">
      <div className="mx-auto max-w-[900px] rounded-2xl border border-green-100 bg-green-50 p-6 text-center sm:p-8">
        <span className="mb-2 inline-block rounded-full bg-white px-3 py-1 text-[12px] font-bold text-green-700">
          Coming next
        </span>
        <p className="mx-auto mb-5 max-w-xl text-sm text-ink-soft">
          We handle planning and shopping lists today — here's what's next.
        </p>
        <div className="mx-auto flex flex-wrap justify-center gap-2 text-xs font-semibold text-green-800">
          {ITEMS.map((item) => (
            <span key={item} className="rounded-full border border-green-200 bg-white px-3 py-1.5">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
