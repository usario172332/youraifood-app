'use client';

import { useState } from 'react';
import { findRecipe } from '../lib/recipes';

// A realistic 7-day plan built entirely from real recipes — the nutrition,
// cost and grocery list below are computed live from the actual recipe
// data, the same way a real generated plan works. This is a sample so
// visitors can see exactly what they'll get before signing up.
//
// This example uses 4 dishes/day (a "standard" choice in the real planner):
// 1 breakfast, 2 lunch/dinner dishes, 1 snack. Individual dishes are
// sometimes also scaled to 1.5x servings (shown as a badge) — like a real
// generated plan, both extra dishes and portion scaling are used to reach a
// realistic daily calorie target instead of being capped at one small
// recipe per meal slot.
const SAMPLE_DAYS = [
  {
    day: 'Monday',
    breakfastDishes: [{ id: 'nb50', servings: 1 }],
    mainDishes: [{ id: 'nr1', servings: 1 }, { id: 'nr19', servings: 1 }],
    snackDishes: [{ id: 'ps1', servings: 1 }],
  },
  {
    day: 'Tuesday',
    breakfastDishes: [{ id: 'nb46', servings: 1.5 }],
    mainDishes: [{ id: 'nr16', servings: 1 }, { id: 'nr36', servings: 1 }],
    snackDishes: [{ id: 'ps2', servings: 1 }],
  },
  {
    day: 'Wednesday',
    breakfastDishes: [{ id: 'nb16', servings: 1 }],
    mainDishes: [{ id: 'nr56', servings: 1 }, { id: 'nr30', servings: 1 }],
    snackDishes: [{ id: 's4', servings: 1.5 }],
  },
  {
    day: 'Thursday',
    breakfastDishes: [{ id: 'nb42', servings: 1 }],
    mainDishes: [{ id: 'nr33', servings: 1.5 }, { id: 'nr1', servings: 1 }],
    snackDishes: [{ id: 's1', servings: 1 }],
  },
  {
    day: 'Friday',
    breakfastDishes: [{ id: 'nb26', servings: 1 }],
    mainDishes: [{ id: 'nr19', servings: 1 }, { id: 'nr16', servings: 1 }],
    snackDishes: [{ id: 's3', servings: 1 }],
  },
  {
    day: 'Saturday',
    breakfastDishes: [{ id: 'nb1', servings: 1.5 }],
    mainDishes: [{ id: 'nr36', servings: 1 }, { id: 'nr56', servings: 1 }],
    snackDishes: [{ id: 's2', servings: 1 }],
  },
  {
    day: 'Sunday',
    breakfastDishes: [{ id: 'nb24', servings: 1 }],
    mainDishes: [{ id: 'nr30', servings: 1 }, { id: 'nr33', servings: 1 }],
    snackDishes: [{ id: 'ps4', servings: 1.5 }],
  },
];
const MEAL_SLOTS = ['breakfast', 'main', 'snack'];
const MEAL_LABELS = { breakfast: 'Breakfast', main: 'Lunch & Dinner', snack: 'Snack' };
const FAMILY_SIZE = 1;

// Some recipes reference what's really the same shopping-list item under
// slightly different names (e.g. "Cooked chicken breast" vs "Chicken
// breast", "Greek yogurt (0%)" vs "Greek yogurt"). Grouping by a normalized
// key — stripping parenthetical qualifiers and a leading "cooked " — merges
// those into one line, matching the same normalization used server-side.
function groceryKey(name) {
  const cleaned = name
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    // Strip common prep-method prefixes (e.g. "Grilled chicken breast",
    // "Chopped walnuts", "Roasted potatoes") — these describe how a recipe
    // uses the ingredient, not a different product to shop for, so they
    // shouldn't split one item across multiple grocery-list rows.
    .replace(/^\s*(cooked|grilled|roasted|baked|sliced|diced|chopped|shredded|steamed|boiled|minced|grated)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  // Also fold case differences (e.g. "chicken breast" vs "Chicken breast")
  // into the same row, so inconsistent capitalization in the recipe data
  // doesn't split one ingredient across two grocery-list lines.
  const titled = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  // A few ingredients are named in singular or plural form depending on how
  // many the recipe needs (e.g. "Egg" for a 1-egg recipe, "Eggs" for a
  // 2-egg recipe) — fold those onto one form so they merge correctly.
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
  let totalCost = 0;
  let totalProtein = 0;
  let totalCal = 0;
  const usedRecipeIds = new Set();
  const addRecipe = (recipe, multiplier) => {
    if (!recipe) return;
    totalCost += recipe.cost * FAMILY_SIZE * multiplier;
    totalProtein += recipe.protein * multiplier;
    totalCal += recipe.cal * multiplier;
    usedRecipeIds.add(recipe.id);
  };
  SAMPLE_DAYS.forEach((row) => {
    MEAL_SLOTS.forEach((slot) => {
      (row[`${slot}Dishes`] || []).forEach((dish) => {
        addRecipe(findRecipe(dish.id), dish.servings || 1);
      });
    });
  });
  return {
    totalCost,
    avgProtein: Math.round(totalProtein / 7),
    avgCal: Math.round(totalCal / 7),
    distinctRecipes: usedRecipeIds.size,
  };
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
  const catOrder = ['Protein', 'Produce', 'Pantry', 'Dairy/Alt', 'Spices'].filter((c) => byCat[c]);
  const totalItems = Object.values(byCat).reduce((sum, items) => sum + items.length, 0);

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-[1120px]">
        <h2 className="text-center text-2xl font-extrabold text-green-900">See exactly what you'll get</h2>
        <p className="mb-3 text-center text-ink-soft">
          A real sample week — the numbers below are computed live, not mocked up.
        </p>
        <p className="mb-8 text-center text-xs font-semibold uppercase tracking-wide text-amber-600">
          Example plan for illustration — your real plan is personalized to your goals
        </p>

        <div className="mb-7 grid grid-cols-2 gap-3.5 md:grid-cols-4">
          <div className="rounded-2xl bg-green-900 px-4 py-5">
            <div className="text-3xl font-extrabold text-white">€{stats.totalCost.toFixed(0)}</div>
            <div className="text-sm font-semibold text-green-100">Est. weekly cost</div>
          </div>
          <div className="rounded-2xl bg-green-900 px-4 py-5">
            <div className="text-3xl font-extrabold text-white">{stats.avgProtein}g</div>
            <div className="text-sm font-semibold text-green-100">Avg daily protein</div>
          </div>
          <div className="rounded-2xl bg-green-900 px-4 py-5">
            <div className="text-3xl font-extrabold text-white">{stats.avgCal}</div>
            <div className="text-sm font-semibold text-green-100">Avg daily calories</div>
          </div>
          <div className="rounded-2xl bg-green-900 px-4 py-5">
            <div className="text-3xl font-extrabold text-white">{stats.distinctRecipes}</div>
            <div className="text-sm font-semibold text-green-100">Distinct recipes used</div>
          </div>
        </div>

        <p className="mb-3 text-xs text-ink-soft">
          This example uses 4 dishes/day — choose 3 to 6 dishes, portions scale automatically to fit your calorie
          target.
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full border-collapse bg-white text-base">
            <thead>
              <tr className="bg-green-50 text-left text-sm font-bold uppercase tracking-wide text-green-700">
                <th className="px-4 py-3.5">Day</th>
                {MEAL_SLOTS.map((slot) => (
                  <th key={slot} className="px-4 py-3.5">{MEAL_LABELS[slot]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SAMPLE_DAYS.map((row) => (
                <tr key={row.day} className="border-t border-gray-100 align-top">
                  <td className="px-4 py-3.5 text-base font-extrabold text-green-900">{row.day}</td>
                  {MEAL_SLOTS.map((slot) => {
                    const dishes = (row[`${slot}Dishes`] || [])
                      .map((d) => ({ ...d, recipe: findRecipe(d.id) }))
                      .filter((d) => d.recipe);
                    return (
                      <td key={slot} className="px-4 py-3.5">
                        {dishes.length === 0 && <span className="text-ink-soft">—</span>}
                        {dishes.map((d, idx) => (
                          <div
                            key={`${slot}-${d.id}`}
                            className={idx > 0 ? 'mt-3 border-t border-dashed border-gray-100 pt-2.5' : ''}
                          >
                            <div className="font-bold text-ink">
                              {idx > 0 && '+ '}
                              {d.recipe.name}
                            </div>
                            <div className="mt-0.5 text-sm font-semibold text-green-700">
                              {Math.round(d.recipe.protein * d.servings)}g protein · {d.recipe.time}min · €{(d.recipe.cost * d.servings).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-9 rounded-2xl border border-green-200 bg-green-50 p-6">
          <div className="flex items-start gap-3">
            <span className="text-3xl">🛒</span>
            <div>
              <h3 className="text-lg font-extrabold text-green-900">Included with every plan: your shopping list</h3>
              <p className="mt-1 text-sm text-ink-soft">
                Automatically generates a shopping list with exact quantities — organized by aisle, ready to shop.
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            {catOrder.map((cat) => {
              const items = byCat[cat].sort((a, b) => a.name.localeCompare(b.name));
              const visible = groceriesExpanded ? items : items.slice(0, PREVIEW_ITEMS_PER_CATEGORY);
              const hidden = items.length - visible.length;
              return (
                <div key={cat} className="rounded-xl border border-gray-200 bg-white p-4">
                  <h4 className="mb-2.5 text-sm font-bold text-green-700">{cat}</h4>
                  <ul>
                    {visible.map((i) => (
                      <li key={i.name} className="flex justify-between border-b border-dashed border-gray-100 py-1.5 text-sm">
                        <span>{i.name}</span>
                        <span className="text-ink-soft">{Math.round(i.qty)}{i.unit}</span>
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
          {!groceriesExpanded && totalItems > catOrder.length * PREVIEW_ITEMS_PER_CATEGORY && (
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
