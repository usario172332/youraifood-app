import { createElement as h } from 'react';

const ESSENTIAL_TOOLS = [
  { icon: '🔪', name: "Chef's knife", why: 'One good sharp knife handles almost every cutting task in these recipes.' },
  { icon: '🪵', name: 'Cutting board', why: 'A large stable board makes prep faster and safer.' },
  { icon: '🍳', name: 'Non-stick or stainless pan', why: 'For stir-fries, searing protein, and sauces.' },
  { icon: '🍲', name: 'Saucepan with lid', why: 'For rice, grains, sauces, and simmering.' },
  { icon: '🥘', name: 'Baking sheet', why: 'For roasting vegetables and oven-baked proteins.' },
  { icon: '📏', name: 'Measuring cups & spoons', why: 'Accurate ratios matter most for grains like rice and quinoa.' },
  { icon: '🥣', name: 'Mixing bowls', why: 'For marinating, tossing salads, and combining ingredients.' },
  { icon: '🕳️', name: 'Colander or strainer', why: 'For draining pasta, rinsing grains and beans.' },
  { icon: '🥄', name: 'Wooden spoon & spatula', why: 'Everyday stirring and flipping.' },
  { icon: '🥫', name: 'Can opener', why: 'For canned beans, chickpeas, and tomatoes.' },
  ];

const NICE_TO_HAVE_TOOLS = [
  { icon: '⚖️', name: 'Digital kitchen scale', why: 'Makes portioning and macro tracking far more accurate.' },
  { icon: '🌡️', name: 'Instant-read thermometer', why: 'Removes the guesswork from cooking chicken, beef, and pork safely.' },
  { icon: '🍚', name: 'Rice cooker', why: 'Hands-off, consistent rice and grains every time.' },
  { icon: '🌪️', name: 'Blender', why: 'For smoothies, sauces, and dressings.' },
  { icon: '💨', name: 'Air fryer', why: 'Crispy results with less oil — great for reheating too.' },
  { icon: '🍜', name: 'Slow cooker / Instant Pot', why: 'Great for beans, stews, and batch-cooked proteins.' },
  { icon: '🧀', name: 'Box grater', why: 'For cheese, vegetables, and citrus zest.' },
  { icon: '🥢', name: 'Tongs', why: 'The easiest way to flip and serve without piercing meat.' },
  { icon: '📦', name: 'Meal-prep containers', why: 'Keeps batch-cooked meals organised for the week.' },
  { icon: '🧄', name: 'Garlic press', why: 'Speeds up one of the most common prep steps.' },
  ];

const COOKING_METHODS = [
  { icon: '🍚', name: 'White rice', ratio: '1 part rice : 2 parts water', steps: 'Rinse until the water runs clear. Bring to a boil, then cover and simmer on low for 15-18 minutes. Rest for 5 minutes off the heat, then fluff with a fork.' },
  { icon: '🌾', name: 'Brown rice', ratio: '1 part rice : 2.25 parts water', steps: 'Rinse, then simmer covered for 40-45 minutes. Rest for 10 minutes before fluffing — it needs more time and liquid than white rice.' },
  { icon: '🌱', name: 'Quinoa', ratio: '1 part quinoa : 2 parts water', steps: 'Rinse well to remove the bitter coating. Simmer covered for 12-15 minutes until the liquid is absorbed and the grains look translucent with a little white ring. Fluff with a fork.' },
  { icon: '🍝', name: 'Pasta', ratio: 'Generously salted water', steps: 'Use a large pot so the pasta has room to move. Cook to package time minus 1 minute for al dente, and save a splash of pasta water before draining to loosen sauces.' },
  { icon: '🫘', name: 'Dried beans & lentils', ratio: 'Varies by type', steps: 'Most beans benefit from soaking overnight, then simmering 45-90 minutes until tender. Lentils do not need soaking — red lentils cook in about 15-20 minutes, green/brown in 25-30.' },
  { icon: '🍗', name: 'Chicken breast', ratio: 'Cook to 74°C / 165°F internal', steps: 'Pound to an even thickness first so it cooks uniformly. Sear 4-6 minutes per side over medium-high heat, then check the internal temperature at the thickest part.' },
  { icon: '🥩', name: 'Beef & steak', ratio: '52°C rare - 71°C well done', steps: 'Let the meat come to room temperature before cooking, sear hot for a crust, then rest for 5 minutes after cooking so the juices redistribute.' },
  { icon: '🥚', name: 'Eggs', ratio: '6 min soft - 10 min hard', steps: 'Lower eggs gently into simmering water. 6 minutes gives a jammy yolk, 8 minutes a firm-but-soft centre, 10-12 minutes fully hard-boiled. Transfer to ice water right after to stop cooking and make peeling easier.' },
  { icon: '🥦', name: 'Roasted vegetables', ratio: '200-220°C / 400-425°F', steps: 'Toss in a little oil, spread in a single layer so they roast rather than steam, and roast 20-30 minutes depending on size, flipping halfway.' },
  { icon: '♨️', name: 'Steamed vegetables', ratio: '3-8 minutes depending on vegetable', steps: 'Keep the vegetables above the waterline in a steamer basket. This keeps more nutrients and texture than boiling — check for bright colour and a slight bite.' },
  ];

function ToolCard(t, border) {
    return h('div', { key: t.name, className: `rounded-2xl border ${border} p-5` },
                 h('div', { className: 'mb-2 text-2xl' }, t.icon),
                 h('h3', { className: 'mb-1 text-sm font-extrabold text-green-900' }, t.name),
                 h('p', { className: 'text-sm text-ink-soft' }, t.why)
               );
}

function MethodCard(m) {
    return h('div', { key: m.name, className: 'rounded-2xl border border-gray-200 bg-white p-5' },
                 h('div', { className: 'mb-1 flex flex-wrap items-center gap-2' },
                         h('span', { className: 'text-xl' }, m.icon),
                         h('h3', { className: 'text-sm font-extrabold text-green-900' }, m.name),
                         h('span', { className: 'rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-bold text-green-700' }, m.ratio)
                       ),
                 h('p', { className: 'text-sm text-ink-soft' }, m.steps)
               );
}
export default function TipsContent() {
    return h('div', { className: 'mx-auto max-w-4xl px-6 py-16 text-ink' },
                 h('a', { href: '/', className: 'text-sm font-semibold text-green-700' }, '← Back to YourAiFood'),
                 h('span', { className: 'mb-3 mt-4 inline-block rounded-full bg-green-50 px-3.5 py-1.5 text-[13px] font-bold text-green-700' }, '🧰 Guides'),
                 h('h1', { className: 'mb-2 text-3xl font-extrabold text-green-900' }, 'Kitchen tools & cooking basics'),
                 h('p', { className: 'mb-10 max-w-2xl text-ink-soft' }, "A quick reference for the equipment and cooking methods that come up most often across YourAiFood recipes — handy if you're stocking a kitchen or just want a refresher on timings and ratios."),
                 h('section', { className: 'mb-12' },
                         h('h2', { className: 'mb-1 text-xl font-extrabold text-green-900' }, 'Essential kitchen tools'),
                         h('p', { className: 'mb-5 text-sm text-ink-soft' }, 'The core equipment most recipes assume you have.'),
                         h('div', { className: 'grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3' },
                                   ESSENTIAL_TOOLS.map((t) => ToolCard(t, 'border-gray-200 bg-white'))
                                 )
                       ),
                 h('section', { className: 'mb-12' },
                         h('h2', { className: 'mb-1 text-xl font-extrabold text-green-900' }, 'Nice-to-have tools'),
                         h('p', { className: 'mb-5 text-sm text-ink-soft' }, 'Not required, but they make weekly cooking noticeably easier.'),
                         h('div', { className: 'grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3' },
                                   NICE_TO_HAVE_TOOLS.map((t) => ToolCard(t, 'border-gray-100 bg-gray-50'))
                                 )
                       ),
                 h('section', null,
                         h('h2', { className: 'mb-1 text-xl font-extrabold text-green-900' }, 'Useful cooking methods'),
                         h('p', { className: 'mb-5 text-sm text-ink-soft' }, 'Quick ratios and timings for the staples that show up across our recipe library.'),
                         h('div', { className: 'space-y-4' },
                                   COOKING_METHODS.map((m) => MethodCard(m))
                                 )
                       ),
                 h('p', { className: 'mt-12 rounded-xl bg-green-50 p-4 text-xs text-green-900' }, 'Times and temperatures are general guidelines — always check food is cooked through, and adjust to your own stove, altitude, and equipment.')
               );
}
