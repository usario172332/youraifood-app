'use client';

import { useState } from 'react';
import { fitRecipesToTargets } from '../lib/portionFit';

// Lets someone who's hand-picked a few recipes from the library (via the +
// button on each card) scale their portions so the combined total lands
// close to a calorie and protein target — e.g. "these 4 recipes, but make
// them add up to 1800 kcal and 150g protein". Pure client-side math, no AI
// call and no server round-trip, so it's instant and free to use.
export default function FitMacrosModal({ recipes, onClose }) {
  const [calorieTarget, setCalorieTarget] = useState(1800);
  const [proteinTarget, setProteinTarget] = useState(150);
  const [result, setResult] = useState(null);

  function calculate() {
    setResult(fitRecipesToTargets(recipes, Number(calorieTarget) || 0, Number(proteinTarget) || 0));
  }

  if (!recipes || !recipes.length) return null;

  const calDiff = result ? result.totalCal - Number(calorieTarget) : 0;
  const proteinDiff = result ? result.totalProtein - Number(proteinTarget) : 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-green-900">🎯 Fit these recipes to your macros</h3>
            <p className="mt-1 text-sm text-ink-soft">
              Scaling portions on your {recipes.length} selected recipe{recipes.length !== 1 ? 's' : ''} to get as
              close as possible to your targets.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-2xl leading-none text-ink-soft hover:text-ink"
          >
            &times;
          </button>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {recipes.map((r) => (
            <span key={r.id} className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700">
              {r.name}
            </span>
          ))}
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="mb-1 block font-bold text-ink">Calorie target (kcal)</span>
            <input
              type="number"
              min="0"
              value={calorieTarget}
              onChange={(e) => setCalorieTarget(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-bold text-ink">Protein target (g)</span>
            <input
              type="number"
              min="0"
              value={proteinTarget}
              onChange={(e) => setProteinTarget(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={calculate}
          className="mb-4 w-full rounded-full bg-green-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-green-500"
        >
          Calculate portions →
        </button>

        {result && (
          <div>
            <div className="space-y-2">
              {result.items.map(({ recipe, servings, cal, protein }) => (
                <div
                  key={recipe.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm"
                >
                  <div>
                    <div className="font-bold text-ink">{recipe.name}</div>
                    <div className="text-xs text-ink-soft">{servings}× serving</div>
                  </div>
                  <div className="text-right text-xs text-ink-soft">
                    <div>{cal} kcal</div>
                    <div>{protein}g protein</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-lg bg-green-50 px-3 py-2.5 text-sm font-bold text-green-900">
              Total: {result.totalCal} kcal · {result.totalProtein}g protein
              <div className="mt-0.5 text-xs font-normal text-green-700">
                Target was {calorieTarget} kcal · {proteinTarget}g protein
                {' · '}
                {Math.abs(calDiff) <= 50 && Math.abs(proteinDiff) <= 10
                  ? 'right on target'
                  : `${calDiff >= 0 ? '+' : ''}${calDiff} kcal, ${proteinDiff >= 0 ? '+' : ''}${proteinDiff}g protein vs. target`}
              </div>
            </div>
            <p className="mt-2 text-xs text-ink-soft">
              Portions scale in fixed steps (1×, 1.25×, 1.5×…), so totals land close to — not always exactly on —
              your targets.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
