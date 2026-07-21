'use client';

import { useMemo, useState } from 'react';
import { findRecipe } from '../lib/recipes';
import { calculateTargets, ACTIVITY_OPTIONS } from '../lib/nutrition';
import RecipeModal from './RecipeModal';

const PRESETS = {
  lose: { goal: 'lose', protein: 140, budget: 60, time: 25, family: 1, diet: [] },
  muscle: { goal: 'muscle', protein: 170, budget: 70, time: 25, family: 1, diet: [] },
  protein: { goal: 'muscle', protein: 180, budget: 75, time: 25, family: 1, diet: [] },
  budget: { goal: 'maintain', protein: 110, budget: 55, time: 25, family: 1, diet: [] },
  quick: { goal: 'maintain', protein: 120, budget: 60, time: 20, family: 1, diet: [] },
  family: { goal: 'maintain', protein: 120, budget: 100, time: 25, family: 4, diet: [] },
  all: { goal: 'lose', protein: 180, budget: 60, time: 20, family: 4, diet: [] },
};

const DIET_OPTIONS = [
  { key: 'vegan', label: 'Vegan' },
  { key: 'vegetarian', label: 'Vegetarian' },
  { key: 'dairy-free', label: 'Dairy-free' },
  { key: 'gluten-free', label: 'Gluten-free' },
];

const MEAL_OPTIONS = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'main', label: 'Lunch & Dinner' },
  { key: 'snack', label: 'Snack' },
];

const MEAL_LABELS = { breakfast: 'Breakfast', main: 'Lunch & Dinner', snack: 'Snack' };

const DISH_PRESETS = [
  { value: 3, label: '3', hint: '1 per meal' },
  { value: 4, label: '4', hint: 'standard' },
  { value: 5, label: '5', hint: 'hearty' },
  { value: 6, label: '6', hint: 'max variety' },
];

// Mirrors the server-side split in lib/anthropic.js — used here only to show
// a live preview of how the chosen dish count breaks down per meal type.
const SPLIT_PRIORITY = ['main', 'breakfast', 'snack'];
function splitDishes(total, slots) {
  const active = SPLIT_PRIORITY.filter((s) => slots.includes(s));
  const n = active.length;
  const counts = {};
  if (!n) return counts;
  const base = Math.floor(total / n);
  let remainder = total % n;
  active.forEach((s) => {
    counts[s] = base;
  });
  active.forEach((s) => {
    if (remainder > 0) {
      counts[s] += 1;
      remainder -= 1;
    }
  });
  return counts;
}

const DEFAULT_FORM = {
  goal: 'lose',
  weight: 75,
  height: 175,
  age: 30,
  sex: 'male',
  activityLevel: 'moderate',
  protein: 120,
  proteinTouched: false,
  calorieTouched: false,
  customCalorieTarget: null,
  budget: 60,
  time: 25,
  family: 1,
  diets: [],
  meals: ['breakfast', 'main', 'snack'],
  dishesPerDay: 3,
};

export default function Planner({ user, session, favorites, onToggleFavorite }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeRecipe, setActiveRecipe] = useState(null);

  const targets = useMemo(
    () =>
      calculateTargets({
        weight: form.weight,
        height: form.height,
        age: form.age,
        sex: form.sex,
        activityLevel: form.activityLevel,
        goal: form.goal,
      }),
    [form.weight, form.height, form.age, form.sex, form.activityLevel, form.goal]
  );

  // Keep the protein field in sync with the calculated suggestion until the
  // user manually edits it themselves — after that, we leave their number alone.
  const proteinValue = form.proteinTouched ? form.protein : targets.proteinTarget;
  const calorieValue = form.calorieTouched && form.customCalorieTarget ? form.customCalorieTarget : targets.calorieTarget;
  const dishSplit = useMemo(() => splitDishes(form.dishesPerDay, form.meals), [form.dishesPerDay, form.meals]);

  function applyPreset(key) {
    const p = PRESETS[key];
    setForm((f) => ({ ...f, goal: p.goal, protein: p.protein, proteinTouched: true, budget: p.budget, time: p.time, family: p.family, diets: [] }));
  }

  function toggleDiet(key) {
    setForm((f) => ({
      ...f,
      diets: f.diets.includes(key) ? f.diets.filter((d) => d !== key) : [...f.diets, key],
    }));
  }

  function toggleMeal(key) {
    setForm((f) => {
      const has = f.meals.includes(key);
      if (has && f.meals.length === 1) return f; // keep at least one meal selected
      return { ...f, meals: has ? f.meals.filter((m) => m !== key) : [...f.meals, key] };
    });
  }

  // Re-rolls a single day of an already-generated plan (instead of the whole
  // week) by calling the lighter-weight regenerate-day endpoint and merging
  // the returned day + refreshed week-wide groceries/stats back into result.
  async function regenerateDay(dayIndex) {
    if (!result) return;
    try {
      const res = await fetch('/api/regenerate-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          dayIndex,
          days: result.days,
          goal: form.goal,
          proteinTarget: proteinValue,
          calorieTarget: calorieValue,
          budget: form.budget,
          maxTime: form.time,
          family: form.family,
          diets: form.diets,
          meals: form.meals,
          dishesPerDay: form.dishesPerDay,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not regenerate that day.');
        return;
      }
      setResult((r) => ({ ...r, days: data.days, groceries: data.groceries, stats: data.stats, usage: data.usage }));
    } catch (err) {
      setError('Network error — please try again.');
    }
  }

  async function generate() {
    setError('');
    if (!user) {
      setError('Sign in above to generate a real AI plan.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          goal: form.goal,
          proteinTarget: proteinValue,
          calorieTarget: calorieValue,
          budget: form.budget,
          maxTime: form.time,
          family: form.family,
          diets: form.diets,
          meals: form.meals,
          dishesPerDay: form.dishesPerDay,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        return;
      }
      setResult(data);
    } catch (err) {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="planner" className="rounded-[20px] border border-gray-200 bg-white p-8 text-left shadow-xl">
      <h2 className="mb-1 text-xl font-extrabold text-green-900">Build your weekly plan</h2>
      <p className="mb-5 text-sm text-ink-soft">Try a preset or set your own targets. Real AI, generated on request.</p>

      <div className="mb-6 flex flex-wrap gap-2">
        <PresetChip label="🎯 Lose 6 kg" onClick={() => applyPreset('lose')} />
        <PresetChip label="💪 Build muscle" onClick={() => applyPreset('muscle')} />
        <PresetChip label="🥩 Eat 180g protein/day" onClick={() => applyPreset('protein')} />
        <PresetChip label="💶 Spend <€60/week" onClick={() => applyPreset('budget')} />
        <PresetChip label="⏱️ Cook in under 20 min" onClick={() => applyPreset('quick')} />
        <PresetChip label="👨‍👩‍👧‍👦 Feed a family of four" onClick={() => applyPreset('family')} />
        <PresetChip label="✨ All of the above" full onClick={() => applyPreset('all')} />
      </div>

      <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-green-700">About you</h3>
      <div className="mb-4 flex items-start gap-2 rounded-lg bg-gray-50 px-3.5 py-2.5 text-xs text-ink-soft">
        <span>🔒</span>
        <span>
          Your weight, height, age, and sex are used only in your browser to calculate the targets below — the raw
          numbers are never sent to our servers or to the AI that builds your plan.{' '}
          <a href="/privacy" className="font-semibold text-green-700 underline">Read our privacy policy</a>.
        </span>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <Field label="Current weight" hint="(kg)">
          <input type="number" min={30} max={250} step={1} value={form.weight}
            onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
            className="w-full rounded-lg border-[1.5px] border-gray-200 px-3 py-2.5 text-sm" />
        </Field>
        <Field label="Height" hint="(cm)">
          <input type="number" min={120} max={230} step={1} value={form.height}
            onChange={(e) => setForm({ ...form, height: Number(e.target.value) })}
            className="w-full rounded-lg border-[1.5px] border-gray-200 px-3 py-2.5 text-sm" />
        </Field>
        <Field label="Age">
          <input type="number" min={14} max={100} step={1} value={form.age}
            onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
            className="w-full rounded-lg border-[1.5px] border-gray-200 px-3 py-2.5 text-sm" />
        </Field>
        <Field label="Sex">
          <select
            value={form.sex}
            onChange={(e) => setForm({ ...form, sex: e.target.value })}
            className="w-full rounded-lg border-[1.5px] border-gray-200 px-3 py-2.5 text-sm"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </Field>
        <Field label="Activity level">
          <select
            value={form.activityLevel}
            onChange={(e) => setForm({ ...form, activityLevel: e.target.value })}
            className="w-full rounded-lg border-[1.5px] border-gray-200 px-3 py-2.5 text-sm"
          >
            {ACTIVITY_OPTIONS.map((a) => (
              <option key={a.key} value={a.key}>{a.label}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mb-6 rounded-xl bg-green-50 p-4 text-sm text-green-900">
        <b className="mb-1 block">🔢 Your calculated daily targets</b>
        <span className="text-lg font-extrabold">{calorieValue} kcal</span>
        {form.calorieTouched && <span className="ml-1.5 rounded-full bg-green-200 px-1.5 py-0.5 text-[10px] font-extrabold text-green-800">custom</span>}
        <span className="mx-2 text-green-700/50">·</span>
        <span className="text-lg font-extrabold">{targets.proteinTarget}g protein</span>
        <div className="mt-1 text-xs text-green-700">
          BMR {targets.bmr} kcal · maintenance (TDEE) {targets.tdee} kcal, based on the Mifflin-St Jeor formula.
          {form.proteinTouched && form.protein !== targets.proteinTarget && (
            <>
              {' '}
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, protein: targets.proteinTarget, proteinTouched: false }))}
                className="font-bold underline"
              >
                Reset protein to suggested {targets.proteinTarget}g
              </button>
            </>
          )}
        </div>
        <div className="mt-3 text-xs text-green-700">
          {!form.calorieTouched ? (
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, calorieTouched: true, customCalorieTarget: targets.calorieTarget }))}
              className="rounded-full border-[1.5px] border-green-600 bg-white px-3.5 py-1.5 text-xs font-bold text-green-700 shadow-sm hover:bg-green-100"
            >
              ✏️ Add your own calorie target
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border-[1.5px] border-green-300 bg-white/60 p-2.5">
              <label className="font-bold" htmlFor="customCalorieInput">Your calorie target:</label>
              <input
                id="customCalorieInput"
                type="number"
                min={800}
                max={6000}
                step={50}
                value={form.customCalorieTarget ?? targets.calorieTarget}
                onChange={(e) => setForm((f) => ({ ...f, customCalorieTarget: Number(e.target.value) }))}
                className="w-24 rounded-lg border-[1.5px] border-green-400 bg-white px-2 py-1.5 text-sm font-bold text-ink"
              />
              <span>kcal</span>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, calorieTouched: false, customCalorieTarget: null }))}
                className="font-bold underline"
              >
                Reset to calculated {targets.calorieTarget}
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-green-700">Your plan</h3>
      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-3">
        <Field label="Fitness goal">
          <select
            value={form.goal}
            onChange={(e) => setForm({ ...form, goal: e.target.value })}
            className="w-full rounded-lg border-[1.5px] border-gray-200 px-3 py-2.5 text-sm"
          >
            <option value="lose">Lose weight</option>
            <option value="muscle">Build muscle</option>
            <option value="maintain">Maintain / general health</option>
          </select>
        </Field>
        <Field label="Protein target" hint="(g/day, auto-suggested)">
          <input type="number" min={40} max={300} step={5} value={proteinValue}
            onChange={(e) => setForm({ ...form, protein: Number(e.target.value), proteinTouched: true })}
            className="w-full rounded-lg border-[1.5px] border-gray-200 px-3 py-2.5 text-sm" />
        </Field>
        <Field label="Weekly budget" hint="(€)">
          <input type="number" min={20} max={300} step={5} value={form.budget}
            onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
            className="w-full rounded-lg border-[1.5px] border-gray-200 px-3 py-2.5 text-sm" />
        </Field>
        <Field label="Max cook time" hint="(min/meal)">
          <input type="number" min={5} max={90} step={5} value={form.time}
            onChange={(e) => setForm({ ...form, time: Number(e.target.value) })}
            className="w-full rounded-lg border-[1.5px] border-gray-200 px-3 py-2.5 text-sm" />
        </Field>
        <Field label="Family size" hint="(people)">
          <input type="number" min={1} max={8} step={1} value={form.family}
            onChange={(e) => setForm({ ...form, family: Number(e.target.value) })}
            className="w-full rounded-lg border-[1.5px] border-gray-200 px-3 py-2.5 text-sm" />
        </Field>
        <Field label="Dietary needs">
          <div className="flex flex-wrap gap-1.5">
            {DIET_OPTIONS.map((d) => (
              <label
                key={d.key}
                className={`cursor-pointer rounded-lg border-[1.5px] px-2.5 py-2 text-xs font-semibold ${
                  form.diets.includes(d.key) ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-ink-soft'
                }`}
              >
                <input type="checkbox" className="mr-1" checked={form.diets.includes(d.key)} onChange={() => toggleDiet(d.key)} />
                {d.label}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Meals to include">
          <div className="flex flex-wrap gap-1.5">
            {MEAL_OPTIONS.map((m) => (
              <label
                key={m.key}
                className={`cursor-pointer rounded-lg border-[1.5px] px-2.5 py-2 text-xs font-semibold ${
                  form.meals.includes(m.key) ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-ink-soft'
                }`}
              >
                <input type="checkbox" className="mr-1" checked={form.meals.includes(m.key)} onChange={() => toggleMeal(m.key)} />
                {m.label}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Dishes per day" hint="(across your selected meals)">
          <div className="flex flex-wrap gap-1.5">
            {DISH_PRESETS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, dishesPerDay: d.value }))}
                className={`rounded-lg border-[1.5px] px-2.5 py-2 text-xs font-semibold ${
                  form.dishesPerDay === d.value ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-ink-soft'
                }`}
              >
                {d.label} <span className="font-normal">({d.hint})</span>
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-ink-soft">
            ≈ {form.meals.map((s) => `${dishSplit[s] || 0} ${MEAL_LABELS[s]}`).join(' · ')}
          </p>
        </Field>
      </div>

      <div className="mb-2 flex justify-end">
        <button
          onClick={generate}
          disabled={loading}
          className="rounded-full bg-green-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {loading ? 'Generating…' : 'Generate my weekly plan →'}
        </button>
      </div>

      {error && <p className="mt-2 text-sm font-semibold text-amber-700">{error}</p>}

      {result && (
        <PlanResults
          result={result}
          family={form.family}
          budget={form.budget}
          proteinTarget={proteinValue}
          calorieTarget={calorieValue}
          goal={form.goal}
          onOpenRecipe={setActiveRecipe}
          onRegenerateDay={regenerateDay}
        />
      )}

      <RecipeModal
        recipe={activeRecipe}
        onClose={() => setActiveRecipe(null)}
        isFavorite={activeRecipe ? favorites?.has(activeRecipe.id) : false}
        onToggleFavorite={
          activeRecipe
            ? () => {
                if (!user) return;
                onToggleFavorite?.(activeRecipe.id);
              }
            : undefined
        }
      />
    </div>
  );
}

function PresetChip({ label, onClick, full }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${
        full ? 'bg-green-900 text-white' : 'bg-green-50 text-green-700 hover:border hover:border-green-500'
      }`}
    >
      {label}
    </button>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-bold text-ink">
        {label} {hint && <span className="font-normal text-ink-soft">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function PlanResults({ result, family, budget, proteinTarget, calorieTarget, goal, onOpenRecipe, onRegenerateDay }) {
  const { days, coachNote, groceries, stats, usage, meals } = result;
  const mealSlots = Array.isArray(meals) && meals.length ? meals : ['breakfast', 'main', 'snack'];
  const overBudget = stats.totalCost > budget;
  const [downloading, setDownloading] = useState(false);
  const [regeneratingDay, setRegeneratingDay] = useState(null);

  const byCat = {};
  Object.entries(groceries).forEach(([name, info]) => {
    if (!byCat[info.cat]) byCat[info.cat] = [];
    byCat[info.cat].push({ name, ...info });
  });
  const catOrder = ['Protein', 'Produce', 'Pantry', 'Dairy/Alt', 'Spices'].filter((c) => byCat[c]);

  async function handleRegenerate(dayIndex) {
    setRegeneratingDay(dayIndex);
    await onRegenerateDay(dayIndex);
    setRegeneratingDay(null);
  }

  async function handleDownloadCsv() {
    const { downloadGroceryCsv } = await import('../lib/pdfExport');
    downloadGroceryCsv({ groceries });
  }

  async function handleDownloadPdf() {
    setDownloading(true);
    try {
      const { downloadPlanPdf } = await import('../lib/pdfExport');
      await downloadPlanPdf({ days, mealSlots, groceries, stats, coachNote, goal, proteinTarget, calorieTarget, budget });
    } catch (err) {
      console.error('PDF export failed', err);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="mt-9 text-left">
      <div className="mb-4 flex justify-end gap-2"><button type="button" onClick={handleDownloadCsv} disabled={downloading} className="rounded-full border-[1.5px] border-green-600 bg-white px-4 py-2 text-xs font-bold text-green-700 shadow-sm hover:bg-green-50 disabled:opacity-60">📄 Download grocery list (CSV)</button>
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="rounded-full border-[1.5px] border-green-600 bg-white px-4 py-2 text-xs font-bold text-green-700 shadow-sm hover:bg-green-50 disabled:opacity-60"
        >
          {downloading ? 'Preparing PDF…' : '⬇️ Download plan & grocery list (PDF)'}
        </button>
      </div>
      <div className="mb-7 grid grid-cols-2 gap-3.5 md:grid-cols-5">
        <Stat label={`Est. weekly cost (target €${budget})`} value={`€${stats.totalCost.toFixed(0)}`} tone={overBudget ? 'warn' : 'ok'} />
        <Stat label={`Avg daily protein (target ${proteinTarget}g)`} value={`${stats.avgProtein}g`} />
        <Stat label={`Avg daily calories (target ${calorieTarget})`} value={stats.avgCal} />
        <Stat label={usage.isPremium ? 'Plans this month' : `Plans used (of ${usage.limit})`} value={usage.used} />
      </div>

      {coachNote && (
        <div className="mb-7 rounded-xl bg-green-50 p-4 text-sm text-green-900">
          <b className="mb-1 block">🤖 Coach note</b>
          {coachNote}
        </div>
      )}

      <h3 className="mb-3 mt-7 text-lg font-extrabold text-green-900">Your 7-day menu</h3>
      <p className="mb-3 text-xs text-ink-soft">
        Some meals include more than one dish, and portions are sometimes scaled up, so each day reaches your calorie target.
        Not happy with a day? Use the 🔄 next to it to regenerate just that day.
      </p>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full border-collapse bg-white text-sm">
          <thead>
            <tr className="bg-green-50 text-left text-[11px] uppercase tracking-wide text-green-700">
              <th className="px-3 py-2.5">Day</th>
              {mealSlots.map((slot) => (
                <th key={slot} className="px-3 py-2.5">{MEAL_LABELS[slot]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((row, dayIndex) => (
              <tr key={row.day} className="border-t border-gray-100 align-top">
                <td className="px-3 py-2.5 font-extrabold text-green-900">
                  {row.day}
                  <button
                    type="button"
                    onClick={() => handleRegenerate(dayIndex)}
                    disabled={regeneratingDay !== null}
                    title="Regenerate this day"
                    className="ml-1.5 align-middle text-xs font-normal text-green-600 underline disabled:opacity-50"
                  >
                    {regeneratingDay === dayIndex ? '⏳' : '🔄'}
                  </button>
                </td>
                {mealSlots.map((slot) => {
                  const dishes = (row[`${slot}Dishes`] || [])
                    .map((d) => ({ ...d, recipe: findRecipe(d.id) }))
                    .filter((d) => d.recipe);
                  return (
                    <td key={slot} className="px-3 py-2.5">
                      {dishes.length === 0 && <span className="text-ink-soft">—</span>}
                      {dishes.map((d, idx) => (
                        <div
                          key={`${slot}-${d.id}`}
                          className={idx > 0 ? 'mt-2.5 border-t border-dashed border-gray-100 pt-2' : ''}
                        >
                          <div
                            onClick={() => onOpenRecipe(d.recipe)}
                            className="cursor-pointer font-semibold underline decoration-dotted underline-offset-2 hover:text-green-700"
                          >
                            {idx > 0 && '+ '}
                            {d.recipe.name}
                          </div>
                          <div className="text-xs text-ink-soft">
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

      <h3 className="mb-3 mt-7 text-lg font-extrabold text-green-900">Nutritional breakdown</h3>
      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
        <NutriBar label="Calories" val={stats.avgCal} unit="kcal" max={3600} />
        <NutriBar label="Protein" val={stats.avgProtein} unit="g" max={280} />
        <NutriBar label="Carbs" val={stats.avgCarbs} unit="g" max={320} />
        <NutriBar label="Fat" val={stats.avgFat} unit="g" max={120} />
      </div>

      <h3 className="mb-3 mt-7 text-lg font-extrabold text-green-900">Optimized grocery list</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {catOrder.map((cat) => (
          <div key={cat} className="rounded-xl border border-gray-200 bg-white p-4">
            <h4 className="mb-2.5 text-sm font-bold text-green-700">{cat}</h4>
            <ul>
              {byCat[cat].sort((a, b) => a.name.localeCompare(b.name)).map((i) => (
                <li key={i.name} className="flex justify-between border-b border-dashed border-gray-100 py-1.5 text-sm">
                  <span>{i.name}</span>
                  <span className="text-ink-soft">{Math.round(i.qty)}{i.unit}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-green-50 p-4 text-sm text-green-900">
          <b className="mb-1 block">♻️ Minimal food waste & ingredient reuse</b>
          Your plan uses just <b>{stats.distinctRecipes} distinct recipes</b> across the week — core ingredients repeat by
          design, so nothing bought goes unused.
        </div>
        <div className="rounded-xl bg-green-50 p-4 text-sm text-green-900">
          <b className="mb-1 block">💶 Budget check</b>
          {overBudget
            ? `This plan comes in about €${(stats.totalCost - budget).toFixed(0)} over your €${budget} target.`
            : `This plan is about €${(budget - stats.totalCost).toFixed(0)} under your €${budget} weekly budget.`}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }) {
  const bg = tone === 'warn' ? 'bg-orange-700' : tone === 'ok' ? 'bg-green-600' : 'bg-green-900';
  return (
    <div className={`rounded-2xl ${bg} px-4 py-4 text-white`}>
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-xs font-semibold opacity-75">{label}</div>
    </div>
  );
}

function NutriBar({ label, val, unit, max }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3.5">
      <div className="text-xl font-extrabold text-green-900">
        {val} <span className="text-xs font-normal text-ink-soft">{unit}</span>
      </div>
      <div className="text-xs font-semibold text-ink-soft">{label} / day</div>
      <div className="mt-2 h-1.5 overflow-hidden rounded bg-green-50">
        <div className="h-full bg-green-500" style={{ width: `${Math.min(100, (val / max) * 100)}%` }} />
      </div>
    </div>
  );
}
