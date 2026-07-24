import { createElement as h } from 'react';

export default function FounderNote() {
  return h('section', { className: 'px-6 py-10' },
    h('div', { className: 'mx-auto flex max-w-[760px] flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-6 text-center sm:flex-row sm:text-left' },
      h('div', { className: 'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-lg font-extrabold text-green-700' }, 'A'),
      h('div', null,
        h('p', { className: 'text-sm text-ink' },
          h('span', { className: 'font-extrabold text-green-900' }, 'Built by one person, '),
          'tired of spending Sunday evenings planning meals and writing shopping lists by hand.'
        ),
        h('a', { href: '/about', className: 'mt-1 inline-block text-sm font-bold text-green-700 underline' }, 'Why I built YourAiFood ' + arrow)
      )
    )
  );
}
