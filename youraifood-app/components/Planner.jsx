'use client';

import { useState } from 'react';
import { findRecipe } from '../lib/recipes';
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

export default function Planner({ user, session }) {
  const [form, setForm] = useState({ goal: 'lose', protein: 120, budget: 60, time: 25, family: 1, diets: [] });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeRecipe, setActiveRecipe] = useState(null);

  function applyPreset(key) {
    const p = PRESETS[key];
    setForm({ goal: p.goal, protein: p.protein, budget: p.budget, time: p.time, family: p.family, diets: [] });
  }

  function toggleDiet(key) {
    setForm((f) => ({
      ...f,
      diets: f.diets.includes(key) ? f.diets.filter((d) => d !== key) : [...f.diets, key],
    }));
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
          proteinTarget: form.protein,
          budget: form.budget,
          maxTime: form.time,
          family: form.family,
          diets: form.diets,
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
        <Field label="Protein target" hint="(g/day)">
          <input type="number" min={40} max={250} step={5} value={form.protein}
            onChange={(e) => setForm({ ...form, protein: Number(e.target.value) })}
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

      {result && <PlanResults result={result} family={form.family} budget={form.budget} proteinTarget={form.protein} onOpenRecipe={setActiveRecipe} />}

      <RecipeModal recipe={activeRecipe} onClose={() => setActiveRecipe(null)} />
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

function PlanResults({ result, family, budget, proteinTarget, onOpenRecipe }) {
  const { days, coachNote, groceries, stats, usage } = result;
  const overBudget = stats.totalCost > budget;

  const byCat = {};
  Object.entries(groceries).forEach(([name, info]) => {
    if (!byCat[info.cat]) byCat[info.cat] = [];
    byCat[info.cat].push({ name, ...info });
  });
  const catOrder = ['Protein', 'Produce', 'Pantry', 'Dairy/Alt', 'Spices'].filter((c) => byCat[c]);

  return (
    <div className="mt-9 text-left">
      <div className="mb-7 grid grid-cols-2 gap-3.5 md:grid-cols-4">
        <Stat label={`Est. weekly cost (target €${budget})`} value={`€${stats.totalCost.toFixed(0)}`} tone={overBudget ? 'warn' : 'ok'} />
        <Stat label={`Avg daily protein (target ${proteinTarget}g)`} value={`${stats.avgProtein}g`} />
        <Stat label="Avg daily calories" value={stats.avgCal} />
        <Stat label={usage.isPremium ? 'Plans this month' : `Plans used (of ${usage.limit})`} value={usage.used} />
      </div>

      {coachNote && (
        <div className="mb-7 rounded-xl bg-green-50 p-4 text-sm text-green-900">
          <b className="mb-1 block">🤖 Coach note</b>
          {coachNote}
        </div>
      )}

      <h3 className="mb-3 mt-7 text-lg font-extrabold text-green-900">Your 7-day menu</h3>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full border-collapse bg-white text-sm">
          <thead>
            <tr className="bg-green-50 text-left text-[11px] uppercase tracking-wide text-green-700">
              {['Day', 'Breakfast', 'Lunch', 'Dinner', 'Snack'].map((h) => (
                <th key={h} className="px-3 py-2.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((row) => (
              <tr key={row.day} className="border-t border-gray-100 align-top">
                <td className="px-3 py-2.5 font-extrabold text-green-900">{row.day}</td>
                {['breakfast', 'lunch', 'dinner', 'snack'].map((slot) => {
                  const recipe = findRecipe(row[slot]);
                  return (
                    <td key={slot} className="px-3 py-2.5">
                      {recipe ? (
                        <>
                          <div
                            onClick={() => onOpenRecipe(recipe)}
                            className="cursor-pointer font-semibold underline decoration-dotted underline-offset-2 hover:text-green-700"
                          >
                            {recipe.name}
                          </div>
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

      <h3 className="mb-3 mt-7 text-lg font-extrabold text-green-900">Nutritional breakdown</h3>
      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
        <NutriBar label="Calories" val={stats.avgCal} unit="kcal" max={2600} />
        <NutriBar label="Protein" val={stats.avgProtein} unit="g" max={200} />
        <NutriBar label="Carbs" val={stats.avgCarbs} unit="g" max={260} />
        <NutriBar label="Fat" val={stats.avgFat} unit="g" max={100} />
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
