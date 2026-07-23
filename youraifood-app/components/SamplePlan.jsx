'use client';

import { useState } from 'react';
import { findRecipe } from '../lib/recipes';

// A realistic 7-day plan built entirely from real recipes — nutrition
// and the grocery list below are computed live from real recipe data,
// the same way a generated plan works.
const SAMPLE_DAYS = [
  { day: 'Monday', breakfastDishes: [{ id: 'nb50', servings: 1 }], mainDishes: [{ id: 'nr1', servings: 1 }, { id: 'nr19', servings: 1 }], snackDishes: [{ id: 'ps1', servings: 1 }] },
  { day: 'Tuesday', breakfastDishes: [{ id: 'nb46', servings: 1.5 }], mainDishes: [{ id: 'nr16', servings: 1 }, { id: 'nr36', servings: 1 }], snackDishes: [{ id: 'ps2', servings: 1 }] },
  { day: 'Wednesday', breakfastDishes: [{ id: 'nb16', servings: 1 }], mainDishes: [{ id: 'nr56', servings: 1 }, { id: 'nr30', servings: 1 }], snackDishes: [{ id: 's4', servings: 1.5 }] },
  { day: 'Thursday', breakfastDishes: [{ id: 'nb42', servings: 1 }], mainDishes: [{ id: 'nr33', servings: 1.5 }, { id: 'nr1', servings: 1 }], snackDishes: [{ id: 's1', servings: 1 }] },
  { day: 'Friday', breakfastDishes: [{ id: 'nb26', servings: 1 }], mainDishes: [{ id: 'nr19', servings: 1 }, { id: 'nr16', servings: 1 }], snackDishes: [{ id: 's3', servings: 1 }] },
  { day: 'Saturday', breakfastDishes: [{ id: 'nb1', servings: 1.5 }], mainDishes: [{ id: 'nr36', servings: 1 }, { id: 'nr56', servings: 1 }], snackDishes: [{ id: 's2', servings: 1 }] },
  { day: 'Sunday', breakfastDishes: [{ id: 'nb24', servings: 1 }], mainDishes: [{ id: 'nr30', servings: 1 }, { id: 'nr33', servings: 1 }], snackDishes: [{ id: 'ps4', servings: 1.5 }] },
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

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-[1120px]">
        <h2 className="text-center text-2xl font-extrabold text-green-900">See exactly what you'll get</h2>
        <p className="mb-3 text-center text-ink-soft">Computed live from real recipes — not mocked up.</p>
        <p className="mb-8 text-center text-xs font-semibold uppercase tracking-wide text-amber-600">
          Example plan for illustration — your real plan is personalized to your goals
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

        <p className="mb-3 text-xs text-ink-soft">
          Shown with 4 dishes/day — choose 3–6, portions auto-scale to your calorie target.
          Core ingredients repeat by design ({stats.distinctRecipes} distinct recipes across {stats.totalMeals} meals) —
          fewer unique items to buy, less food waste, and easier meal prep.
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full border-collapse bg-white text-sm">
            <thead>
              <tr className="bg-green-50 text-left text-xs font-bold uppercase tracking-wide text-green-700">
                <th className="px-4 py-3.5">Day</th>
                <th className="px-4 py-3.5">Breakfast</th>
                <th className="px-4 py-3.5">Lunch</th>
                <th className="px-4 py-3.5">Dinner</th>
                <th className="px-4 py-3.5">Daily Calories</th>
                <th className="px-4 py-3.5">Daily Protein</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_DAYS.map((row) => {
                const breakfast = row.breakfastDishes?.[0] ? findRecipe(row.breakfastDishes[0].id) : null;
                const lunch = row.mainDishes?.[0] ? findRecipe(row.mainDishes[0].id) : null;
                const dinner = row.mainDishes?.[1] ? findRecipe(row.mainDishes[1].id) : null;
                const totals = dayTotals(row);
                const isMonday = row.day === 'Monday';
                return (
                  <tr key={row.day} className={`border-t border-gray-100 ${isMonday ? 'bg-green-50/70' : ''}`}>
                    <td className={`px-4 py-3.5 font-extrabold text-green-900 ${isMonday ? 'border-l-4 border-l-green-500' : ''}`}>{row.day}</td>
                    <td className="px-4 py-3.5 text-ink">{breakfast?.name || '—'}</td>
                    <td className="px-4 py-3.5 text-ink">{lunch?.name || '—'}</td>
                    <td className="px-4 py-3.5 text-ink">{dinner?.name || '—'}</td>
                    <td className="px-4 py-3.5 font-bold text-green-700">{totals.cal} kcal</td>
                    <td className="px-4 py-3.5 font-bold text-green-700">{totals.protein}g</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
