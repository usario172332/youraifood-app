'use client';

import { createElement as h, useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { findRecipe } from '../lib/recipes';

const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Static fallback shown to signed-out visitors, or signed-in users who
// haven't generated a plan yet — always labelled as an example so it's
// never mistaken for the user's real data.
const EXAMPLE = {
  mainDish: 'Chicken & Rice Bowl',
  kcal: '2,180',
  protein: '168g',
  ingredientsLabel: '~9 ingredients',
};

// Sums calories/protein for one already-generated day (plan_days row) using
// the same recipe catalog the rest of the app uses, and picks a headline
// dish to show — real numbers from the user's actual latest plan, not a mockup.
function dayStats(row) {
  let kcal = 0;
  let protein = 0;
  let ingredientCount = 0;
  let mainDishName = null;
  Object.entries(row || {}).forEach(([slot, dishes]) => {
    if (slot === 'day' || !Array.isArray(dishes)) return;
    dishes.forEach((dish) => {
      const recipe = findRecipe(dish?.id);
      if (!recipe) return;
      const servings = dish.servings || 1;
      kcal += recipe.cal * servings;
      protein += recipe.protein * servings;
      if (Array.isArray(recipe.ingredients)) ingredientCount += recipe.ingredients.length;
      if (!mainDishName && slot === 'mainDishes') mainDishName = recipe.name;
    });
  });
  if (!mainDishName) {
    Object.entries(row || {}).forEach(([slot, dishes]) => {
      if (mainDishName || slot === 'day' || !Array.isArray(dishes) || !dishes.length) return;
      const recipe = findRecipe(dishes[0]?.id);
      if (recipe) mainDishName = recipe.name;
    });
  }
  return { kcal: Math.round(kcal), protein: Math.round(protein), ingredientCount, mainDishName };
}

export default function PlannerPreview() {
  const { session } = useAuth();
  const [latestPlan, setLatestPlan] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    function handlePlanGenerated() {
      setRefreshKey((k) => k + 1);
    }
    window.addEventListener('plan-generated', handlePlanGenerated);
    return () => window.removeEventListener('plan-generated', handlePlanGenerated);
  }, []);

  useEffect(() => {
    if (!session) {
      setLatestPlan(null);
      return;
    }
    let cancelled = false;
    fetch('/api/saved-plans', { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((res) => (res.ok ? res.json() : { plans: [] }))
      .then((data) => {
        if (!cancelled) setLatestPlan((data.plans || [])[0] || null);
      })
      .catch(() => {
        if (!cancelled) setLatestPlan(null);
      });
    return () => {
      cancelled = true;
    };
  }, [session, refreshKey]);

  const todayIdx = (new Date().getDay() + 6) % 7; // Mon=0 ... Sun=6, matches real "today"
  const todayFull = DAYS_FULL[todayIdx];
  const todayShort = DAYS_SHORT[todayIdx];

  const planDays = Array.isArray(latestPlan?.plan_days) ? latestPlan.plan_days : [];
  // Match today's real weekday against the plan; if this plan is shorter
  // than 7 days and doesn't include today, fall back to its first day
  // rather than showing nothing.
  const todayRow = planDays.find((r) => r?.day === todayFull) || planDays[0] || null;
  const isReal = Boolean(todayRow);
  const stats = isReal ? dayStats(todayRow) : null;

  const mainDishName = isReal ? stats.mainDishName || 'A meal from your plan' : EXAMPLE.mainDish;
  const kcalLabel = isReal ? String(stats.kcal) : EXAMPLE.kcal;
  const proteinLabel = isReal ? `${stats.protein}g` : EXAMPLE.protein;
  const ingredientsLabel = isReal ? `${stats.ingredientCount} ingredients` : EXAMPLE.ingredientsLabel;
  const noteText = isReal
    ? (todayRow.day === todayFull
        ? "This is today's line-up from your latest plan"
        : `Showing ${todayRow.day} — your latest plan doesn't cover ${todayFull}`)
    : 'Sign in and generate a plan to see your real week here';

  return h('div', { className: 'mx-auto w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-4 shadow-xl' },
    h('div', { className: 'mb-3 flex items-center justify-between' },
      h('span', { className: 'text-xs font-extrabold uppercase tracking-wide text-green-700' }, isReal ? "Today's plan" : 'Example day'),
      h('span', { className: 'rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700' }, todayShort)
    ),
    h('div', { className: 'mb-3 grid grid-cols-7 gap-1' },
      DAYS_SHORT.map((d, i) => h('div', {
        key: d,
        className: `rounded-md py-1.5 text-center text-[10px] font-bold ${i === todayIdx ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700'}`,
      }, d))
    ),
    h('div', { className: 'mb-2 space-y-2' },
      h('div', { className: 'flex items-center justify-between rounded-lg bg-gray-50 p-2.5' },
        h('div', null,
          h('div', { className: 'text-xs font-bold text-ink' }, 'Lunch & Dinner'),
          h('div', { className: 'text-[11px] text-ink-soft' }, mainDishName)
        ),
        h('button', { type: 'button', className: 'rounded-full border border-gray-200 px-2 py-1 text-[10px] font-bold text-green-700' }, '🔄 Replace')
      ),
      h('div', { className: 'flex items-center justify-between rounded-lg bg-amber-50 p-2.5' },
        h('div', { className: 'text-[11px] font-semibold text-amber-800' }, `${isReal ? '📅' : '♻️'} ${noteText}`)
      )
    ),
    h('div', { className: 'mt-3 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3' },
      h('div', { className: 'rounded-lg bg-green-900 px-3 py-2 text-center' },
        h('div', { className: 'text-lg font-extrabold text-white' }, kcalLabel),
        h('div', { className: 'text-[10px] font-semibold text-green-100' }, 'kcal today')
      ),
      h('div', { className: 'rounded-lg bg-green-900 px-3 py-2 text-center' },
        h('div', { className: 'text-lg font-extrabold text-white' }, proteinLabel),
        h('div', { className: 'text-[10px] font-semibold text-green-100' }, 'protein today')
      )
    ),
    h('div', { className: 'mt-3 flex items-center justify-between rounded-lg border border-dashed border-gray-200 px-2.5 py-2 text-[11px] font-semibold text-ink-soft' },
      h('span', null, '🛒 Grocery list'),
      h('span', { className: 'text-green-700' }, ingredientsLabel)
    )
  );
}
