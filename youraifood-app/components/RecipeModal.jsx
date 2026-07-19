'use client';

import { useState } from 'react';
import {
  getDifficulty,
  DIFFICULTY_ICON,
  isHighProtein,
  isMealPrepFriendly,
  isFreezerFriendly,
  getHero,
  getSubstitute,
} from '../lib/recipeMeta';

const DIET_ICON = {
  vegan: '🌱',
  vegetarian: '🥗',
  'dairy-free': '🥛',
  'gluten-free': '🌾',
};

export default function RecipeModal({ recipe, onClose, isFavorite, onToggleFavorite }) {
  const [copied, setCopied] = useState(false);
  if (!recipe) return null;

  const hero = getHero(recipe);
  const difficulty = getDifficulty(recipe);
  const highProtein = isHighProtein(recipe);
  const mealPrep = isMealPrepFriendly(recipe);
  const freezer = isFreezerFriendly(recipe);

  function copyShoppingList() {
    const text = recipe.ingredients.map((i) => `- ${i.n} (${i.q}${i.u})`).join('\n');
    navigator.clipboard?.writeText(`${recipe.name} — shopping list\n${text}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-5"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white">
        {/* Hero banner — stand-in "photography" until real images are wired up */}
        <div className={`relative flex h-36 items-center justify-center rounded-t-2xl bg-gradient-to-br ${hero.gradient}`}>
          <span className="text-6xl drop-shadow-sm">{hero.emoji}</span>

          <div className="absolute right-4 top-4 flex items-center gap-2">
            {onToggleFavorite && (
              <button
                onClick={onToggleFavorite}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm shadow"
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                {isFavorite ? '❤️' : '🤍'}
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm font-bold text-green-700 shadow"
            >
              ✕
            </button>
          </div>

          <div className="absolute bottom-3 left-4 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-extrabold text-ink shadow">
              {DIFFICULTY_ICON[difficulty]} {difficulty}
            </span>
            {mealPrep && (
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-extrabold text-ink shadow">📦 Meal prep</span>
            )}
            {freezer && (
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-extrabold text-ink shadow">❄️ Freezer-friendly</span>
            )}
          </div>
        </div>

        <div className="p-7">
          <div className="text-xs font-extrabold uppercase tracking-wide text-green-600">{recipe.meal}</div>
          <h3 className="mt-1 text-xl font-extrabold text-green-900">{recipe.name}</h3>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {highProtein && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">💪 High Protein</span>
            )}
            {recipe.diets.map((d) => (
              <span key={d} className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-700">
                {DIET_ICON[d] || ''} {d}
              </span>
            ))}
          </div>

          <div className="mt-4 mb-5 grid grid-cols-4 gap-2 border-b border-gray-100 pb-4 text-center text-sm text-ink-soft">
            <div className="rounded-xl bg-gray-50 py-2">
              <div className="text-base">🔥</div>
              <b className="block text-sm text-green-900">{recipe.cal}</b>kcal
            </div>
            <div className="rounded-xl bg-gray-50 py-2">
              <div className="text-base">🥩</div>
              <b className="block text-sm text-green-900">{recipe.protein}g</b>protein
            </div>
            <div className="rounded-xl bg-gray-50 py-2">
              <div className="text-base">🍞</div>
              <b className="block text-sm text-green-900">{recipe.carbs}g</b>carbs
            </div>
            <div className="rounded-xl bg-gray-50 py-2">
              <div className="text-base">🥑</div>
              <b className="block text-sm text-green-900">{recipe.fat}g</b>fat
            </div>
          </div>

          <div className="mb-5 flex gap-5 text-sm text-ink-soft">
            <div><b className="block text-base text-green-900">{recipe.time} min</b>cook time</div>
            <div><b className="block text-base text-green-900">€{recipe.cost.toFixed(2)}</b>per serving</div>
          </div>

          <div className="mb-2 flex items-center justify-between">
            <h5 className="text-xs font-bold uppercase tracking-wide text-green-700">Ingredients (1 serving)</h5>
            <button
              onClick={copyShoppingList}
              className="text-[11px] font-bold text-green-600 hover:text-green-800"
            >
              {copied ? '✓ Copied' : '📋 Copy shopping list'}
            </button>
          </div>
          <ul className="mb-5">
            {recipe.ingredients.map((i) => {
              const sub = getSubstitute(i.n);
              return (
                <li key={i.n} className="border-b border-dashed border-gray-100 py-1.5 text-sm">
                  <div className="flex justify-between">
                    <span>{i.n}</span>
                    <span>{i.q}{i.u}</span>
                  </div>
                  {sub && <div className="mt-0.5 text-[11px] text-ink-soft">🔄 Swap for: {sub}</div>}
                </li>
              );
            })}
          </ul>

          <h5 className="mb-2 text-xs font-bold uppercase tracking-wide text-green-700">Instructions</h5>
          <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed">
            {recipe.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
