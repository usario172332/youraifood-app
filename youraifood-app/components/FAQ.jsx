'use client';

import { useState } from 'react';

const FAQS = [
  {
    q: 'Is it free?',
    a: 'Yes. The free plan includes 5 AI meal plans a month, the full recipe library, and the shopping list generator. Premium (€7.77/month) adds unlimited plans and extra tools.',
  },
  {
    q: 'Can I change meals I don’t like?',
    a: 'Yes. Swap out any single meal, or regenerate a whole day, without touching the rest of your week.',
  },
  {
    q: 'Can I regenerate a whole week?',
    a: 'Yes — generate a new plan anytime, or regenerate just one day if only part of the week needs changing.',
  },
  {
    q: 'Can vegetarians use it?',
    a: 'Yes. Set your dietary needs to vegetarian, vegan, dairy-free, or gluten-free and every plan respects it.',
  },
  {
    q: 'Can I build muscle with this?',
    a: 'Yes. Set your goal to “build muscle” and your protein target is calculated and built into every meal.',
  },
  {
    q: 'Can I lose weight with this?',
    a: 'Yes. Set your goal to “lose weight” and your calorie target is calculated from your stats using the Mifflin-St Jeor formula.',
  },
  {
    q: 'Can I customise my calorie target?',
    a: 'Yes. Use the auto-calculated target, or enter your own custom calorie and protein goals directly.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-[760px]">
        <h2 className="mb-10 text-center text-2xl font-extrabold text-green-900">Frequently asked questions</h2>
        <div className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {FAQS.map((item, i) => (
            <div key={item.q}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-bold text-ink"
              >
                {item.q}
                <span className="shrink-0 text-lg text-gray-400">{open === i ? '−' : '+'}</span>
              </button>
              {open === i && (
                <div className="px-5 pb-4 text-sm text-ink-soft">{item.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
