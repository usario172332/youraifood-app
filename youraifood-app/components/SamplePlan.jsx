'use client';

import { useState } from 'react';
import { findRecipe, DAYS } from '../lib/recipes';

// A realistic 7-day plan built entirely from real recipes — the nutrition,
// cost and grocery list below are computed live from the actual recipe
// data, the same way a real generated plan works. This is a sample so
// visitors can see exactly what they'll get before signing up.
//
// Picked from the higher-calorie end of each meal category on purpose: with
// only 3 recipe slots a day (breakfast, one combined lunch/dinner dish,
// snack), this is close to the realistic ceiling the current catalog can
// hit. A user with a higher calorie target than this should expect their
// real generated plan to land in a similar range.
const SAMPLE_DAYS = [
  { day: 'Monday', breakfast: 'nb50', main: 'nr1', snack: 'ps1' },
  { day: 'Tuesday', breakfast: 'nb46', main: 'nr19', snack: 'ps2' },
  { day: 'Wednesday', breakfast: 'nb16', main: 'nr16', snack: 's4' },
  { day: 'Thursday', breakfast: 'nb42', main: 'nr36', snack: 's1' },
  { day: 'Friday', breakfast: 'nb26', main: 'nr56', snack: 's3' },
  { day: 'Saturday', breakfast: 'nb1', main: 'nr30', snack: 's2' },
  { day: 'Sunday', breakfast: 'nb24', main: 'nr33', snack: 'ps4' },
];
const MEAL_SLOTS = ['breakfast', 'main', 'snack'];
const MEAL_LABELS = { breakfast: 'Breakfast', main: 'Lunch & Dinner', snack: 'Snack' };
const FAMILY_SIZE = 1;

function buildGroceryList() {
  const groceries = {};
  SAMPLE_DAYS.forEach((row) => {
    MEAL_SLOTS.forEach((slot) => {
      const recipe = findRecipe(row[slot]);
      if (!recipe) return;
      recipe.ingredients.forEach((ing) => {
        if (!groceries[ing.n]) groceries[ing.n] = { qty: 0, unit: ing.u, cat: ing.cat };
        groceries[ing.n].qty += ing.q * FAMILY_SIZE;
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
  SAMPLE_DAYS.forEach((row) => {
    MEAL_SLOTS.forEach((slot) => {
      const recipe = findRecipe(row[slot]);
      if (!recipe) return;
      totalCost += recipe.cost * FAMILY_SIZE;
      totalProtein += recipe.protein;
      totalCal += recipe.cal;
      usedRecipeIds.add(recipe.id);
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
                    return (
                      <td key={slot} className="px-3 py-2.5">
                        {recipe ? (
                          <>
                            <div className="font-semibold">{recipe.name}</div>
                            <div className="text-xs text-ink-soft">
                              {recipe.protein}g protein · {recipe.time}min · €{recipe.cost.toFixed(2)}
                            </div>
                          </>
                        ) : (
                          <span className="text-ink-soft">—</span>
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
