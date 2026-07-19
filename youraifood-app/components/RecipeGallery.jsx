'use client';

import { useState } from 'react';
import { RECIPES } from '../lib/recipes';
import RecipeModal from './RecipeModal';
import { getDifficulty, DIFFICULTY_ICON, isHighProtein, getHero } from '../lib/recipeMeta';

const MEALS = ['all', 'Breakfast', 'Lunch & Dinner', 'Snack'];
const FILTERS = ['all', 'vegan', 'vegetarian', 'dairy-free', 'gluten-free', 'premium', 'favorites'];

export default function RecipeGallery({ isPremium, user, favorites, onToggleFavorite }) {
  const [meal, setMeal] = useState('all');
  const [filter, setFilter] = useState('all');
  const [active, setActive] = useState(null);

  const byMeal = meal === 'all' ? RECIPES : RECIPES.filter((r) => r.meal === meal);
  const list =
    filter === 'all'
      ? byMeal
      : filter === 'premium'
        ? byMeal.filter((r) => r.premium)
        : filter === 'favorites'
          ? byMeal.filter((r) => favorites?.has(r.id))
          : byMeal.filter((r) => r.diets.includes(filter));

  function handleCardClick(r) {
    if (r.premium && !isPremium) {
      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    setActive(r);
  }

  function handleHeartClick(e, r) {
    e.stopPropagation();
    if (!user) {
      document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    onToggleFavorite?.(r.id);
  }

  return (
    <section id="recipes" className="bg-green-900 px-6 py-16">
      <div className="mx-auto max-w-[1120px]">
        <h2 className="text-center text-2xl font-extrabold text-white">Browse the recipe library</h2>
        <p className="mb-8 text-center text-white/70">A taste of what YourAiFood pulls from when building your plan</p>
        <div className="mb-3 flex flex-wrap justify-center gap-2">
          {MEALS.map((m) => (
            <button
              key={m}
              onClick={() => setMeal(m)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                meal === m
                  ? 'border-green-500 bg-green-500 text-white'
                  : 'border-white/25 bg-white/10 text-white'
              }`}
            >
              {m === 'all' ? 'All meals' : m}
            </button>
          ))}
        </div>
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
              {f === 'all' ? 'All' : f === 'premium' ? '⭐ Premium' : f === 'favorites' ? '❤️ Favorites' : f}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {list.map((r) => {
            const locked = r.premium && !isPremium;
            const isFav = favorites?.has(r.id);
            const hero = getHero(r);
            const difficulty = getDifficulty(r);
            const highProtein = isHighProtein(r);
            return (
              <div
                key={r.id}
                onClick={() => handleCardClick(r)}
                className="relative cursor-pointer overflow-hidden rounded-2xl bg-white transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className="absolute right-2 top-2 z-10 flex flex-col items-end gap-1.5">
                  <button
                    onClick={(e) => handleHeartClick(e, r)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-sm shadow"
                    aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {isFav ? '❤️' : '🤍'}
                  </button>
                  {r.premium && (
                    <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold text-amber-950">
                      PREMIUM
                    </span>
                  )}
                </div>
                <div className={locked ? 'blur-[3px] select-none' : ''}>
                  <div className={`flex h-20 items-center justify-center bg-gradient-to-br ${hero.gradient} text-3xl`}>
                    {hero.emoji}
                  </div>
                  <div className="p-4">
                    <div className="text-[11px] font-extrabold uppercase tracking-wide text-green-600">{r.meal}</div>
                    <h4 className="my-1.5 text-sm font-extrabold text-green-900">{r.name}</h4>
                    <div className="mb-2 flex flex-wrap gap-1">
                      {highProtein && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">💪 High Protein</span>
                      )}
                      {r.diets.map((d) => (
                        <span key={d} className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">
                          {d}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-between border-t border-dashed border-gray-100 pt-2 text-xs text-ink-soft">
                      <span>{DIFFICULTY_ICON[difficulty]} {difficulty}</span>
                      <span>{r.time} min</span>
                      <span>€{r.cost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-3">
                  {locked ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
                      🔒 Unlock with Premium
                    </span>
                  ) : (
                    <span className="block text-xs font-bold text-green-600">View recipe →</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <RecipeModal
        recipe={active}
        onClose={() => setActive(null)}
        isFavorite={active ? favorites?.has(active.id) : false}
        onToggleFavorite={active ? (e) => handleHeartClick(e, active) : undefined}
      />
    </section>
  );
}
