'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RECIPES } from '../lib/recipes';
import RecipeModal from './RecipeModal';
import { getDifficulty, DIFFICULTY_ICON, isHighProtein, getHero } from '../lib/recipeMeta';

const MEALS = ['all', 'Breakfast', 'Lunch & Dinner', 'Snack'];
const FILTERS = ['all', 'vegan', 'vegetarian', 'dairy-free', 'gluten-free', 'premium', 'favorites'];

// Hand-picked homepage teaser — a couple of free recipes to prove quality,
// plus several premium ones (shown locked/blurred) to create FOMO toward
// upgrading. Mixes across meal types and diets on purpose.
const TEASER_IDS = ['nr1', 'b2', 'nr14', 'b12', 'nr71', 'b19', 'nr108', 'b6'];

export default function RecipeGallery({ isPremium, user, favorites, onToggleFavorite, compact = false }) {
  const [meal, setMeal] = useState('all');
  const [filter, setFilter] = useState('all');
  const [active, setActive] = useState(null);
  const [reviewSummaries, setReviewSummaries] = useState({});

  useEffect(() => {
    fetch('/api/reviews?summary=1')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setReviewSummaries(data.summaries || {}))
      .catch(() => {});
  }, []);

  const byMeal = meal === 'all' ? RECIPES : RECIPES.filter((r) => r.meal === meal);
  const filtered =
    filter === 'all'
      ? byMeal
      : filter === 'premium'
        ? byMeal.filter((r) => r.premium)
        : filter === 'favorites'
          ? byMeal.filter((r) => favorites?.has(r.id))
          : byMeal.filter((r) => r.diets.includes(filter));

  const list = compact
    ? TEASER_IDS.map((id) => RECIPES.find((r) => r.id === id)).filter(Boolean)
    : filtered;

  const premiumCount = RECIPES.filter((r) => r.premium).length;

  function goTo(hash) {
    const el = document.getElementById(hash);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = `/#${hash}`;
    }
  }

  function handleCardClick(r) {
    if (r.premium && !isPremium) {
      goTo('pricing');
      return;
    }
    setActive(r);
  }

  function handleHeartClick(e, r) {
    e.stopPropagation();
    if (!user) {
      goTo('planner');
      return;
    }
    onToggleFavorite?.(r.id);
  }

  return (
    <section id="recipes" className="bg-green-900 px-6 py-16">
      <div className="mx-auto max-w-[1120px]">
        <h2 className="text-center text-2xl font-extrabold text-white">
          {compact ? 'A taste of the recipe library' : 'Browse the recipe library'}
        </h2>
        <p className="mb-8 text-center text-white/70">
          {compact
            ? `${RECIPES.length} fitness recipes with real photos, full macros and AI meal planning behind them`
            : 'A taste of what YourAiFood pulls from when building your plan'}
        </p>

        {!compact && (
          <>
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
          </>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {list.map((r) => {
            const locked = r.premium && !isPremium;
            const isFav = favorites?.has(r.id);
            const hero = getHero(r);
            const difficulty = getDifficulty(r);
            const highProtein = isHighProtein(r);
            const summary = reviewSummaries[r.id];
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
                  {r.image ? (
                    <img src={r.image} alt={r.name} className="h-20 w-full object-cover" />
                  ) : (
                    <div className={`flex h-20 items-center justify-center bg-gradient-to-br ${hero.gradient} text-3xl`}>
                      {hero.emoji}
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-extrabold uppercase tracking-wide text-green-600">{r.meal}</div>
                      {summary && summary.count > 0 && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600">
                          <span>⭐ {summary.average}</span>
                          <span className="text-ink-soft">({summary.count})</span>
                        </div>
                      )}
                    </div>
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

        {compact && (
          <div className="mt-10 rounded-2xl border border-white/15 bg-white/5 p-8 text-center">
            <p className="mb-1 text-lg font-extrabold text-white">🔒 {premiumCount}+ premium recipes are waiting</p>
            <p className="mx-auto mb-5 max-w-lg text-sm text-white/70">
              Unlock the full library — every macro-tracked recipe, meal-prep and freezer tags, ingredient swaps, and
              AI photography, plus unlimited AI-generated meal plans for €7.77/mo.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/recipes"
                className="rounded-full bg-white px-6 py-3 text-sm font-bold text-green-900 transition hover:bg-gray-100"
              >
                Browse all {RECIPES.length} recipes →
              </Link>
              <button
                onClick={() => goTo('pricing')}
                className="rounded-full bg-green-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-green-400"
              >
                Go Premium — €7.77/mo
              </button>
            </div>
          </div>
        )}
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
