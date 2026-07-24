import { createElement as h } from 'react';

const STEPS = [
  { n: '1', title: 'Tell us your goal', text: 'Pick a goal and dietary needs - calorie and protein targets are matched automatically.' },
  { n: '2', title: 'Get your week', text: 'A full 7-day plan with matched recipes and one combined grocery list, ready in under a minute.' },
  { n: '3', title: 'Shop, cook, adjust', text: 'Swap out any single meal or day without rebuilding the rest of your week.' },
];
export default function KeyBenefits() {
  return h('section', { id: 'how-it-works', className: 'px-6 py-14' },
    h('div', { className: 'mx-auto max-w-[1120px]' },
      h('h2', { className: 'text-center text-2xl font-extrabold text-green-900' }, 'How it works'),
      h('div', { className: 'mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3' },
        STEPS.map((step) => h('div', { key: step.n, className: 'rounded-2xl border border-gray-200 bg-white p-6 text-center' },
          h('span', { className: 'mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-sm font-extrabold text-white' }, step.n),
          h('h3', { className: 'mb-1 text-sm font-extrabold text-green-900' }, step.title),
          h('p', { className: 'text-sm text-ink-soft' }, step.text)
        ))
      ),
      h('div', { className: 'mt-8 grid grid-cols-1 gap-2.5 sm:grid-cols-3' },
        [
          'No manual calorie or macro counting',
          'One combined shopping list every week',
          'Swap any meal without rebuilding your week',
        ].map((item) => h('div', { key: item, className: 'flex items-start gap-2 rounded-xl bg-green-50 px-4 py-2.5 text-sm font-semibold text-ink' },
          h('span', { className: 'mt-0.5 text-green-600' }, String.fromCodePoint(0x2714)),
          h('span', null, item)
        ))
      ),
      h('div', { className: 'mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 text-xs font-bold text-ink-soft' },
        h('span', null, '235 macro-tracked recipes'),
        h('span', { className: 'text-gray-300' }, '\u00b7'),
        h('span', null, '3 free plans every month, no card required')
      )
    )
  );
}
