import { createElement as h } from 'react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function PlannerPreview() {
    return h('div', { className: 'mx-auto w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-4 shadow-xl' },
                 h('div', { className: 'mb-3 flex items-center justify-between' },
                         h('span', { className: 'text-xs font-extrabold uppercase tracking-wide text-green-700' }, "Today's plan"),
                         h('span', { className: 'rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700' }, 'Wednesday')
                       ),
                 h('div', { className: 'mb-3 grid grid-cols-7 gap-1' },
                         DAYS.map((d, i) => h('div', {
                                   key: d,
                                   className: `rounded-md py-1.5 text-center text-[10px] font-bold ${i === 2 ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700'}`,
                         }, d))
                       ),
                 h('div', { className: 'mb-2 space-y-2' },
                         h('div', { className: 'flex items-center justify-between rounded-lg bg-gray-50 p-2.5' },
                                   h('div', null,
                                               h('div', { className: 'text-xs font-bold text-ink' }, 'Lunch & Dinner'),
                                               h('div', { className: 'text-[11px] text-ink-soft' }, 'Chicken & Rice Bowl')
                                             ),
                                   h('button', { type: 'button', className: 'rounded-full border border-gray-200 px-2 py-1 text-[10px] font-bold text-green-700' }, '🔄 Replace')
                                 ),
                         h('div', { className: 'flex items-center justify-between rounded-lg bg-amber-50 p-2.5' },
                                   h('div', { className: 'text-[11px] font-semibold text-amber-800' }, "♻️ Tonight's dinner reuses today's batch-cooked lunch")
                                 )
                       ),
                 h('div', { className: 'mt-3 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3' },
                         h('div', { className: 'rounded-lg bg-green-900 px-3 py-2 text-center' },
                                   h('div', { className: 'text-lg font-extrabold text-white' }, '2,180'),
                                   h('div', { className: 'text-[10px] font-semibold text-green-100' }, 'kcal today')
                                 ),
                         h('div', { className: 'rounded-lg bg-green-900 px-3 py-2 text-center' },
                                   h('div', { className: 'text-lg font-extrabold text-white' }, '168g'),
                                   h('div', { className: 'text-[10px] font-semibold text-green-100' }, 'protein today')
                                 )
                       ),
                 h('div', { className: 'mt-3 flex items-center justify-between rounded-lg border border-dashed border-gray-200 px-2.5 py-2 text-[11px] font-semibold text-ink-soft' },
                         h('span', null, '🛒 Grocery list'),
                         h('span', { className: 'text-green-700' }, '18 items ready')
                       )
               );
}
