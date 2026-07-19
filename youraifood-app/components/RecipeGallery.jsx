'use client';

import { useState } from 'react';
import { RECIPES } from '../lib/recipes';
import RecipeModal from './RecipeModal';

const FILTERS = ['all', 'vegan', 'vegetarian', 'dairy-free', 'gluten-free', 'premium'];

export default function RecipeGallery({ isPremium }) {
  const [filter, setFilter] = useState('all');
  const [active, setActive] = useState(null);

  const list =
    filter === 'all'
      ? RECIPES
      : filter === 'premium'
        ? RECIPES.filter((r) => r.premium)
        : RECIPES.filter((r) => r.diets.includes(filter));

  function handleCardClick(r) {
    if (r.premium && !isPremium) {
      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    setActive(r);
  }

  return (
    <section id="recipes" className="bg-green-900 px-6 py-16">
      <div className="mx-auto max-w-[1120px]">
        <h2 className="text-center text-2xl font-extrabold text-white">Browse the recipe library</h2>
        <p className="mb-8 text-center text-white/70">A taste of what YourAiFood pulls from when building your plan</p>
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                filter === f
                  ? 'border-green-500 bg-green-500 text-white'
                  : 'border-white/25 bg-white/10 text-white'
              }`}
            >
              {f === 'all' ? 'All' : f === 'premium' ? '⭐ Premium' : f}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {list.map((r) => {
            const locked = r.premium && !isPremium;
            return (
              <div
                key={r.id}
                onClick={() => handleCardClick(r)}
                className={`relative cursor-pointer rounded-2xl bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-xl ${
                  locked ? 'overflow-hidden' : ''
                }`}
              >
                {r.premium && (
                  <span className="absolute right-3 top-3 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold text-amber-950">
                    PREMIUM
                  </span>
                )}
                <div className={locked ? 'blur-[3px] select-none' : ''}>
                  <div className="text-[11px] font-extrabold uppercase tracking-wide text-green-600">{r.meal}</div>
                  <h4 className="my-1.5 text-sm font-extrabold text-green-900">{r.name}</h4>
                  <div className="mb-2 flex flex-wrap gap-1">
                    {r.diets.map((d) => (
                      <span key={d} className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">
                        {d}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-between border-t border-dashed border-gray-100 pt-2 text-xs text-ink-soft">
                    <span>{r.time} min</span>
                    <span>{r.protein}g protein</span>
                    <span>€{r.cost.toFixed(2)}</span>
                  </div>
                </div>
                {locked ? (
                  <span className="mt-2 flex items-center gap-1 text-xs font-bold text-amber-600">
                    🔒 Unlock with Premium
                  </span>
                ) : (
                  <span className="mt-2 block text-xs font-bold text-green-600">View recipe →</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <RecipeModal recipe={active} onClose={() => setActive(null)} />
    </section>
  );
}
