'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RECIPES } from '../lib/recipes';
import RecipeModal from './RecipeModal';
import { getDifficulty, DIFFICULTY_ICON, isHighProtein, getHero, isMealPrepFriendly, isFreezerFriendly, isOnePan, isBeginnerFriendly, isQuick } from '../lib/recipeMeta';

const MEALS = ['all', 'Breakfast', 'Lunch & Dinner', 'Snack'];
const FILTERS = ['all', 'vegan', 'vegetarian', 'dairy-free', 'gluten-free', 'premium', 'favorites'];

// Hand-picked homepage teaser — a compact mix of free recipes to prove
// quality, plus a couple of premium ones (shown locked/blurred) to create
// FOMO toward upgrading. Kept short on purpose so the homepage stays light;
// the full library is one click away via the "Browse Recipes" CTA below.
const TEASER_IDS = ['nr1', 'b2', 'nr14', 'b12', 'nr71', 'b19', 'nr108', 'b6'];

// Priority order for which single extra attribute badge to show alongside
// High Protein — cards stay compact, so only the two most useful badges
// per recipe are surfaced instead of every attribute that applies.
function extraBadge(r) {
  if (isQuick(r)) return { label: 'Under 20 Minutes', icon: '⏱️' };
  if (isOnePan(r)) return { label: 'One Pan', icon: '🍳' };
  if (isBeginnerFriendly(r)) return { label: 'Beginner Friendly', icon: '🌱' };
  if (isMealPrepFriendly(r)) return { label: 'Meal Prep Friendly', icon: '📦' };
  if (isFreezerFriendly(r)) return { label: 'Freezer Friendly', icon: '❄️' };
  return null;
}

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
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-green-900 ${
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
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-green-900 ${
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
            const highProtein = isHighProtein(r);
            const badge = extraBadge(r);
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
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-sm shadow transition duration-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                    aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {isFav ? '❤️' : '🤍'}
                  </button>
                  {r.premium && (
                    <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold text-amber-950">
                      PREMIUM
                    </span>
                  )}
                  {summary && summary.count > 0 && (
                    <span className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-extrabold text-amber-600 shadow">
                      ⭐ {summary.average}
                    </span>
                  )}
                </div>
                <div className={locked ? 'blur-[3px] select-none' : ''}>
                  {r.image ? (
                    <img src={r.image} alt={r.name} loading="lazy" decoding="async" className="h-20 w-full object-cover" />
                  ) : (
                    <div className={`flex h-20 items-center justify-center bg-gradient-to-br ${hero.gradient} text-3xl`}>
                      {hero.emoji}
                    </div>
                  )}
                  <div className="p-4">
                    <div className="text-[11px] font-extrabold uppercase tracking-wide text-green-600">{r.meal}</div>
                    <h4 className="my-1.5 text-sm font-extrabold text-green-900">{r.name}</h4>
                    <div className="mb-2 flex flex-wrap gap-1">
                      {highProtein && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">💪 High Protein</span>
                      )}
                      {badge && (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">{badge.icon} {badge.label}</span>
                      )}
                      {r.diets.map((d) => (
                        <span key={d} className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">
                          {d}
                        </span>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-1 border-t border-dashed border-gray-100 pt-2 text-center">
                      <div>
                        <div className="text-xs font-extrabold text-green-900">{r.protein}g</div>
                        <div className="text-[10px] text-ink-soft">Protein</div>
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-green-900">{r.cal}</div>
                        <div className="text-[10px] text-ink-soft">Calories</div>
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-green-900">{r.time}m</div>
                        <div className="text-[10px] text-ink-soft">Time</div>
                      </div>
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
          <div className="mt-8 text-center">
            <Link
              href="/recipes"
              className="inline-block rounded-full border border-white/25 bg-white/10 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-green-900"
            >
              Browse Recipes →
            </Link>
          </div>
        )}

        {compact && !isPremium && (
          <div className="mt-8 rounded-2xl border border-white/15 bg-white/5 p-8 text-center">
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
                Browse Recipes →
              </Link>
              <button
                onClick={() => goTo('pricing')}
                className="rounded-full bg-green-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-green-400"
              >
                See Premium plans →
              </button>
            </div>
            <p className="mt-3 text-center text-xs text-white/60">7 days free · Cancel anytime, no fees</p>
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
