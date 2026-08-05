import { createElement as h } from 'react';
import PlannerPreview from './PlannerPreview';

export default function Hero({ onCta }) {
    return h('section', { className: 'px-6 pb-6 pt-16' },
                 h('div', { className: 'mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]' },
                         h('div', { className: 'text-center lg:text-left' },
                                   h('span', { className: 'mb-4 inline-block rounded-full bg-green-50 px-3.5 py-1.5 text-[13px] font-bold text-green-700' }, 'Your Personalised AI Meal Planner'),
                                   h('h1', { className: 'mx-auto mb-4 max-w-xl text-4xl font-extrabold leading-tight text-green-900 sm:text-5xl lg:mx-0' },
                                               'Your entire week of eating, planned in ',
                                               h('span', { className: 'text-green-600' }, '60 seconds'),
                                               '.'
                                             ),
                                   h('p', { className: 'mx-auto mb-6 max-w-xl text-lg text-ink-soft lg:mx-0' },
                                               'A personalised weekly meal plan with calorie and protein targets, matched recipes, and one combined grocery list.'
                                             ),
                                   h('div', { className: 'flex flex-col items-center gap-2 lg:items-start' },
                                               h('button', {
                                                             type: 'button',
                                                             onClick: onCta,
                                                             className: 'rounded-full bg-green-600 px-8 py-4 text-base font-extrabold text-white shadow-md transition duration-200 hover:-translate-y-px hover:bg-green-700 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 active:translate-y-0',
                                               }, 'Generate My Plan →'),
                                               h('p', { className: 'max-w-sm text-center text-xs font-semibold text-ink-soft lg:text-left' },
                                                             'Next: customise calories, protein, cooking time and household size. No payment details required.'
                                                           )
                                             )
                                 ),
                         h('div', { className: 'flex justify-center' }, h(PlannerPreview))
                       )
               );
}
