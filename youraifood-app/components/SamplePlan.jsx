'use client';

import { useState } from 'react';
import { findRecipe, DAYS } from '../lib/recipes';

// A realistic 7-day plan built entirely from real recipes — the nutrition,
// cost and grocery list below are computed live from the actual recipe
// data, the same way a real generated plan works. This is a sample so
// visitors can see exactly what they'll get before signing up.
//
// A single serving of each of the 3 meal slots (breakfast, one combined
// lunch/dinner dish, snack) doesn't always add up to a realistic calorie
// target on its own — so, like a real generated plan, some days here scale
// a recipe to 1.5x/2x servings, and one day adds a second snack, to reach a
// more typical daily calorie target.
const SAMPLE_DAYS = [
  { day: 'Monday', breakfast: 'nb50', main: 'nr1', mainServings: 1.5, snack: 'ps1' },
  { day: 'Tuesday', breakfast: 'nb46', breakfastServings: 1.5, main: 'nr19', snack: 'ps2' },
  { day: 'Wednesday', breakfast: 'nb16', main: 'nr16', mainServings: 1.5, snack: 's4', snackServings: 1.5 },
  { day: 'Thursday', breakfast: 'nb42', breakfastServings: 1.5, main: 'nr36', mainServings: 1.5, snack: 's1' },
  { day: 'Friday', breakfast: 'nb26', main: 'nr56', mainServings: 2, snack: 's3' },
  { day: 'Saturday', breakfast: 'nb1', breakfastServings: 1.5, main: 'nr30', snack: 's2', extraSnack: 'ps1' },
  { day: 'Sunday', breakfast: 'nb24', breakfastServings: 1.5, main: 'nr33', mainServings: 1.5, snack: 'ps4' },
];
const MEAL_SLOTS = ['breakfast', 'main', 'snack'];
const MEAL_LABELS = { breakfast: 'Breakfast', main: 'Lunch & Dinner', snack: 'Snack' };
const FAMILY_SIZE = 1;

function buildGroceryList() {
  const groceries = {};
  const addIngredients = (recipe, multiplier) => {
    if (!recipe) return;
    recipe.ingredients.forEach((ing) => {
      if (!groceries[ing.n]) groceries[ing.n] = { qty: 0, unit: ing.u, cat: ing.cat };
      groceries[ing.n].qty += ing.q * FAMILY_SIZE * multiplier;
    });
  };
  SAMPLE_DAYS.forEach((row) => {
    MEAL_SLOTS.forEach((slot) => {
      addIngredients(findRecipe(row[slot]), row[`${slot}Servings`] || 1);
    });
    if (row.extraSnack) addIngredients(findRecipe(row.extraSnack), 1);
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
      addRecipe(findRecipe(row[slot]), row[`${slot}Servings`] || 1);
    });
    if (row.extraSnack) addRecipe(findRecipe(row.extraSnack), 1);
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
          A sample week built from our real recipe library — not a mockup, the numbers below are computed live.
        </p>
        <p className="mb-8 text-center text-xs font-semibold uppercase tracking-wide text-amber-600">
          Example plan for illustration — your real plan is personalized to your goals
        </p>

        <div className="mb-7 grid grid-cols-2 gap-3.5 md:grid-cols-4">
          <div className="rounded-2xl bg-green-900 px-4 py-4 text-white">
            <div className="text-2xl font-extrabold">€{stats.totalCost.toFixed(0)}</div>
            <div className="text-xs font-semibold opacity-75">Est. weekly cost</div>
          </div>
          <div className="rounded-2xl bg-green-900 px-4 py-4 text-white">
            <div className="text-2xl font-extrabold">{stats.avgProtein}g</div>
            <div className="text-xs font-semibold opacity-75">Avg daily protein</div>
          </div>
          <div className="rounded-2xl bg-green-900 px-4 py-4 text-white">
            <div className="text-2xl font-extrabold">{stats.avgCal}</div>
            <div className="text-xs font-semibold opacity-75">Avg daily calories</div>
          </div>
          <div className="rounded-2xl bg-green-900 px-4 py-4 text-white">
            <div className="text-2xl font-extrabold">{stats.distinctRecipes}</div>
            <div className="text-xs font-semibold opacity-75">Distinct recipes used</div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full border-collapse bg-white text-sm">
            <thead>
              <tr className="bg-green-50 text-left text-[11px] uppercase tracking-wide text-green-700">
                <th className="px-3 py-2.5">Day</th>
                {MEAL_SLOTS.map((slot) => (
                  <th key={slot} className="px-3 py-2.5">{MEAL_LABELS[slot]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SAMPLE_DAYS.map((row) => (
                <tr key={row.day} className="border-t border-gray-100 align-top">
                  <td className="px-3 py-2.5 font-extrabold text-green-900">{row.day}</td>
                  {MEAL_SLOTS.map((slot) => {
                    const recipe = findRecipe(row[slot]);
                    const servings = row[`${slot}Servings`] > 1 ? row[`${slot}Servings`] : null;
                    const extra = slot === 'snack' ? findRecipe(row.extraSnack) : null;
                    return (
                      <td key={slot} className="px-3 py-2.5">
                        {recipe ? (
                          <div className={extra ? 'mb-2.5' : ''}>
                            <div className="font-semibold">
                              {recipe.name}
                              {servings && (
                                <span className="ml-1.5 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-extrabold text-green-700">
                                  ×{servings}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-ink-soft">
                              {Math.round(recipe.protein * (servings || 1))}g protein · {recipe.time}min · €{(recipe.cost * (servings || 1)).toFixed(2)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-ink-soft">—</span>
                        )}
                        {extra && (
                          <div className="border-t border-dashed border-gray-100 pt-2">
                            <div className="text-sm font-semibold">+ {extra.name}</div>
                            <div className="text-xs text-ink-soft">
                              {extra.protein}g protein · {extra.time}min · €{extra.cost.toFixed(2)}
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="mb-3 mt-9 text-lg font-extrabold text-green-900">Optimized grocery list for this week</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
              className="rounded-full border border-gray-200 px-5 py-2 text-sm font-bold text-green-700 hover:bg-green-50"
            >
              Show full grocery list ({totalItems} items) ↓
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
