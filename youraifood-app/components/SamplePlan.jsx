'use client';

import { useState } from 'react';
import { findRecipe } from '../lib/recipes';

// A realistic 7-day plan built entirely from real recipes — nutrition
// and the grocery list below are computed live from real recipe data,
// the same way a generated plan works. Deliberately meal-prep style: 3
// dishes/day with a small rotating set of recipes reused across the week,
// so the ingredient list stays realistic rather than maximally varied.
const SAMPLE_DAYS = [
  { day: 'Monday', breakfastDishes: [{ id: 'b1', servings: 1 }], mainDishes: [{ id: 'nr1', servings: 2 }], snackDishes: [{ id: 'ps1', servings: 1 }] },
  { day: 'Tuesday', breakfastDishes: [{ id: 'nb24', servings: 1 }], mainDishes: [{ id: 'nr2', servings: 2 }], snackDishes: [{ id: 's1', servings: 1 }] },
  { day: 'Wednesday', breakfastDishes: [{ id: 'b2', servings: 1 }], mainDishes: [{ id: 'nr4', servings: 2 }], snackDishes: [{ id: 'ps1', servings: 1 }] },
  { day: 'Thursday', breakfastDishes: [{ id: 'b1', servings: 1 }], mainDishes: [{ id: 'nr1', servings: 2 }], snackDishes: [{ id: 's1', servings: 1 }] },
  { day: 'Friday', breakfastDishes: [{ id: 'nb24', servings: 1 }], mainDishes: [{ id: 'nr2', servings: 2 }], snackDishes: [{ id: 'ps1', servings: 1 }] },
  { day: 'Saturday', breakfastDishes: [{ id: 'b2', servings: 1 }], mainDishes: [{ id: 'nr4', servings: 2 }], snackDishes: [{ id: 's1', servings: 1 }] },
  { day: 'Sunday', breakfastDishes: [{ id: 'b1', servings: 1 }], mainDishes: [{ id: 'nr1', servings: 2 }], snackDishes: [{ id: 'ps1', servings: 1 }] },
];
const MEAL_SLOTS = ['breakfast', 'main', 'snack'];
const FAMILY_SIZE = 1;

function groceryKey(name) {
  const cleaned = name
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/^\s*(cooked|grilled|roasted|baked|sliced|diced|chopped|shredded|steamed|boiled|minced|grated)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  const titled = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  if (titled === 'Eggs') return 'Egg';
  return titled;
}

function buildGroceryList() {
  const groceries = {};
  const addIngredients = (recipe, multiplier) => {
    if (!recipe) return;
    recipe.ingredients.forEach((ing) => {
      const key = groceryKey(ing.n);
      if (!groceries[key]) groceries[key] = { qty: 0, unit: ing.u, cat: ing.cat };
      groceries[key].qty += ing.q * FAMILY_SIZE * multiplier;
    });
  };
  SAMPLE_DAYS.forEach((row) => {
    MEAL_SLOTS.forEach((slot) => {
      (row[`${slot}Dishes`] || []).forEach((dish) => {
        addIngredients(findRecipe(dish.id), dish.servings || 1);
      });
    });
  });
  return groceries;
}

function buildStats() {
  let totalProtein = 0;
  let totalCal = 0;
  let totalMeals = 0;
  const usedRecipeIds = new Set();
  const addRecipe = (recipe, multiplier) => {
    if (!recipe) return;
    totalProtein += recipe.protein * multiplier;
    totalCal += recipe.cal * multiplier;
    usedRecipeIds.add(recipe.id);
    totalMeals += 1;
  };
  SAMPLE_DAYS.forEach((row) => {
    MEAL_SLOTS.forEach((slot) => {
      (row[`${slot}Dishes`] || []).forEach((dish) => {
        addRecipe(findRecipe(dish.id), dish.servings || 1);
      });
    });
  });
  return {
    avgProtein: Math.round(totalProtein / 7),
    avgCal: Math.round(totalCal / 7),
    distinctRecipes: usedRecipeIds.size,
    totalMeals,
  };
}

function dayTotals(row) {
  let cal = 0;
  let protein = 0;
  MEAL_SLOTS.forEach((slot) => {
    (row[`${slot}Dishes`] || []).forEach((dish) => {
      const recipe = findRecipe(dish.id);
      if (!recipe) return;
      const mult = dish.servings || 1;
      cal += recipe.cal * mult;
      protein += recipe.protein * mult;
    });
  });
  return { cal: Math.round(cal), protein: Math.round(protein) };
}

const PREVIEW_ITEMS_PER_CATEGORY = 4;

export default function SamplePlan() {
  const [groceriesExpanded, setGroceriesExpanded] = useState(false);
  const groceries = buildGroceryList();
  const stats = buildStats();

  const byCat = {};
  Object.entries(groceries).forEach(([name, info]) => {
    if (!byCat[info.cat]) byCat[info.cat] = [];
    byCat[info.cat].push({ name, ...info });
  });
  const GROCERY_BUCKETS = [
    { key: 'main', label: 'Main groceries', cats: ['Protein', 'Produce', 'Dairy/Alt'] },
    { key: 'pantry', label: 'Pantry staples', cats: ['Pantry'] },
    { key: 'optional', label: 'Optional ingredients', cats: ['Spices'] },
  ];
  const groceryBuckets = GROCERY_BUCKETS.map((b) => ({
    ...b,
    items: b.cats.flatMap((c) => byCat[c] || []),
  })).filter((b) => b.items.length);
  const totalItems = Object.values(byCat).reduce((sum, items) => sum + items.length, 0);
  let rawIngredientCount = 0;
  SAMPLE_DAYS.forEach((row) => {
    MEAL_SLOTS.forEach((slot) => {
      (row[`${slot}Dishes`] || []).forEach((dish) => {
        const r = findRecipe(dish.id);
        if (r && Array.isArray(r.ingredients)) rawIngredientCount += r.ingredients.length;
      });
    });
  });

  // How many times each main dish's recipe id appears across the week —
  // real, computed from the actual sample data — so we can flag genuinely
  // reused recipes (and therefore reused ingredients) instead of a made-up label.
  const mainDishCounts = {};
  SAMPLE_DAYS.forEach((row) => {
    const id = row.mainDishes?.[0]?.id;
    if (id) mainDishCounts[id] = (mainDishCounts[id] || 0) + 1;
  });

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-[1120px]">
        <span className="mb-2 block text-center text-xs font-bold uppercase tracking-wide text-green-600">
          Example Weekly Meal Plan
        </span>
        <h2 className="text-center text-2xl font-extrabold text-green-900">See exactly what you'll get</h2>
        <p className="mb-3 text-center text-ink-soft">Computed live from real recipes — not mocked up.</p>
        <p className="mb-8 text-center text-xs font-semibold uppercase tracking-wide text-amber-600">
          Example plan for illustration — your real plan is personalised to your goals
        </p>

        <div className="mb-4 grid grid-cols-2 gap-3.5 md:grid-cols-4">
          <div className="rounded-2xl bg-green-900 px-4 py-5">
            <div className="text-3xl font-extrabold text-white">{SAMPLE_DAYS.length}</div>
            <div className="text-sm font-semibold text-green-100">Days planned</div>
          </div>
          <div className="rounded-2xl bg-green-900 px-4 py-5">
            <div className="text-3xl font-extrabold text-white">{stats.avgCal}</div>
            <div className="text-sm font-semibold text-green-100">Avg daily calories</div>
          </div>
          <div className="rounded-2xl bg-green-900 px-4 py-5">
            <div className="text-3xl font-extrabold text-white">{stats.avgProtein}g</div>
            <div className="text-sm font-semibold text-green-100">Avg daily protein</div>
          </div>
          <div className="rounded-2xl bg-green-900 px-4 py-5">
            <div className="text-3xl font-extrabold text-white">{stats.totalMeals}</div>
            <div className="text-sm font-semibold text-green-100">Meals planned</div>
          </div>
        </div>

        <p className="mb-3 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
          <span>Shown with 3 dishes/day — choose 3–6, portions auto-scale to your calorie target.</span>
          <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700">📦 Meal-prep friendly</span>
        </p>
        <div className="mb-5 rounded-xl border border-green-100 bg-green-50 px-4 py-3">
          <p className="text-xs font-extrabold text-green-900">🍳 Cook once, eat twice</p>
          <p className="mt-1 text-xs text-ink-soft">
            Main dishes are made in 2-serving batches — e.g. <span className="font-semibold text-green-800">Monday dinner → Tuesday lunch:</span> cook
            two servings and save one for tomorrow. Lunches and dinners are also intentionally reused during the
            week so you cook fewer times, buy fewer ingredients, and waste less food.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold text-green-700">
            <span className="rounded-full bg-white px-2.5 py-1">♻️ Less food waste</span>
            <span className="rounded-full bg-white px-2.5 py-1">🛒 Simpler shopping</span>
            <span className="rounded-full bg-white px-2.5 py-1">⏱️ Easier meal prep</span>
            <span className="rounded-full bg-white px-2.5 py-1">💰 Saves money</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-dashed border-green-200 pt-3 text-xs font-bold">
            <span className="rounded-full bg-green-600 px-2.5 py-1 text-white">🍳 Cook Once</span>
            <span className="text-ink-soft">Monday Dinner</span>
            <span className="text-gray-300">→</span>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">♻️ Leftovers</span>
            <span className="text-ink-soft">Tuesday Lunch</span>
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full border-collapse bg-white text-sm">
            <thead>
              <tr className="bg-green-50 text-left text-xs font-bold uppercase tracking-wide text-green-700">
                <th className="px-4 py-3.5">Day</th>
                <th className="px-4 py-3.5">Breakfast</th>
                <th className="px-4 py-3.5">Lunch & Dinner</th>
                <th className="px-4 py-3.5">Snack</th>
                <th className="px-4 py-3.5">Daily Total</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_DAYS.map((row) => {
                const breakfast = row.breakfastDishes?.[0] ? findRecipe(row.breakfastDishes[0].id) : null;
                const mainDish = row.mainDishes?.[0];
                const main = mainDish ? findRecipe(mainDish.id) : null;
                const snack = row.snackDishes?.[0] ? findRecipe(row.snackDishes[0].id) : null;
                const totals = dayTotals(row);
                const isMonday = row.day === 'Monday';
                const isPrepDay = row.day === 'Sunday';
                const makesLeftovers = mainDish && (mainDish.servings || 1) > 1;
                return (
                  <tr key={row.day} className={`border-t border-gray-100 ${isMonday ? 'bg-green-50/70' : ''}`}>
                    <td className={`px-4 py-3.5 font-extrabold text-green-900 ${isMonday ? 'border-l-4 border-l-green-500' : ''}`}>
                      {row.day}
                      {isPrepDay && (
                        <span className="ml-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">📦 Prep day</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-ink">{breakfast?.name || '—'}</td>
                    <td className="px-4 py-3.5 text-ink">
                      {main?.name || '—'}
                      {main && (
                        <div className="mt-1 flex flex-wrap gap-1 text-[10px] font-semibold text-ink-soft">
                          <span>🕒 {main.time}min active</span>
                          {makesLeftovers && <span className="text-green-700">♻️ Leftovers</span>}
                          {mainDishCounts[main.id] > 1 && (
                            <span className="text-amber-700">🔁 Ingredient Reused</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-ink">{snack?.name || '—'}</td>
                    <td className="px-4 py-3.5 font-bold text-green-700">{totals.cal} kcal · {totals.protein}g protein</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5">
          <span className="text-xl">🔄</span>
          <p className="text-sm font-semibold text-ink">
            Don't like Tuesday's meals?{' '}
            <span className="font-extrabold text-green-700">Replace only Tuesday</span> without rebuilding your
            entire week.
          </p>
        </div>

        <div className="mt-9 rounded-[28px] border-2 border-green-300 bg-green-50 p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="text-6xl">🛒</span>
            <div>
              <h3 className="text-xl font-extrabold text-green-900">Your shopping list is created automatically.</h3>
              <p className="mt-1 text-sm font-semibold text-ink-soft">
                {rawIngredientCount} ingredient entries consolidated into {totalItems} grocery items — buy exactly what you need.
              </p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {groceryBuckets.map((b) => {
              const items = b.items.sort((a, c) => a.name.localeCompare(c.name));
              const visible = groceriesExpanded ? items : items.slice(0, PREVIEW_ITEMS_PER_CATEGORY);
              const hidden = items.length - visible.length;
              return (
                <div key={b.key} className="rounded-xl border border-gray-200 bg-white p-4">
                  <h4 className="mb-2.5 text-sm font-bold text-green-700">{b.label}</h4>
                  <ul>
                    {visible.map((i) => (
                      <li key={i.name} className="flex justify-between border-b border-dashed border-gray-100 py-1.5 text-sm">
                        <span>{i.name}</span>
                        <span className="font-semibold text-ink-soft">{Math.round(i.qty)}{i.unit}</span>
                      </li>
                    ))}
                  </ul>
                  {!groceriesExpanded && hidden > 0 && (
                    <p className="pt-1.5 text-xs text-ink-soft">+{hidden} more</p>
                  )}
                </div>
              );
            })}
          </div>
          {!groceriesExpanded && totalItems > groceryBuckets.length * PREVIEW_ITEMS_PER_CATEGORY && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setGroceriesExpanded(true)}
                className="rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-bold text-green-700 hover:bg-green-50"
              >
                Show full grocery list ({totalItems} items) ↓
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
