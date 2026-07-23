'use client';

import { useEffect, useMemo, useState } from 'react';
import { findRecipe } from '../lib/recipes';
import { useAuth } from '../lib/AuthContext';
import { calculateTargets, ACTIVITY_OPTIONS } from '../lib/nutrition';
import RecipeModal from './RecipeModal';

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

const GOAL_LABELS = { lose: 'Lose Weight', muscle: 'Build Muscle', maintain: 'Eat Healthier' };

const GOAL_CARDS = [
  { value: 'lose', icon: '🔥', label: 'Lose Weight', benefit: 'High-protein meals within your calorie target.' },
  { value: 'muscle', icon: '💪', label: 'Build Muscle', benefit: 'Protein-focused meals to support muscle growth.' },
  { value: 'maintain', icon: '🥗', label: 'Eat Healthier', benefit: 'Balanced meals without the planning.' },
];

// Note: internal `value`s stay 'budget' / 'balanced' / 'premium' to match the
// backend API contract (/api/generate-plan, /api/regenerate-day) — only the
// displayed labels/icons change. This is an ingredient-preference choice, not
// a price estimate: we don't know local grocery prices, so we never promise one.
const BUDGET_LEVELS = [
  { value: 'budget', icon: '🥕', label: 'Economical', desc: 'Everyday staples' },
  { value: 'balanced', icon: '⚖️', label: 'Balanced', desc: 'A mix of both' },
  { value: 'premium', icon: '🍽️', label: 'Varied', desc: 'Greater recipe variety' },
];

const LOADING_STEPS = [
  'Understanding your goals…',
  'Selecting suitable recipes…',
  'Balancing calories and macros…',
  'Creating your shopping list…',
  'Finalising your personalised week…',
];

// Maps the more granular LOADING_STEPS onto the 3 stages shown in the
// lightweight progress tracker, so the wait feels concrete without a wall
// of shifting text.
const PROGRESS_STAGES = ['Goal', 'Preferences', 'Your plan'];
function progressStageIndex(step) {
  if (step <= 0) return 0;
  if (step <= 2) return 1;
  return 2;
}

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
  budgetLevel: 'balanced',
  time: 30,
  family: 1,
  diets: [],
  meals: ['breakfast', 'main', 'snack'],
  dishesPerDay: 4,
};

export default function Planner({ user, session, isPremium, favorites, onToggleFavorite }) {
  const { requestSignIn } = useAuth();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [showCustomize, setShowCustomize] = useState(false);
  const [showPersonalize, setShowPersonalize] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (!loading) return;
    setLoadingStep(0);
    const id = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, 1700);
    return () => clearInterval(id);
  }, [loading]);
  const [error, setError] = useState('');
  const [activeRecipe, setActiveRecipe] = useState(null);

  // Pre-fill calorie/protein targets when arriving from the free Macro
  // Calculator (?calories=2200&protein=160#planner) so visitors don't have
  // to re-enter numbers they already calculated.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const cal = Number(params.get('calories'));
    const pro = Number(params.get('protein'));
    if (!cal && !pro) return;
    setForm((f) => ({
      ...f,
      calorieTouched: cal ? true : f.calorieTouched,
      customCalorieTarget: cal || f.customCalorieTarget,
      protein: pro || f.protein,
      proteinTouched: pro ? true : f.proteinTouched,
    }));
    setShowCustomize(true);
    setPrefilled(true);
  }, []);

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
          budgetLevel: form.budgetLevel,
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
      requestSignIn();
      setError('Sign in to generate your personalised plan — use the panel that just opened.');
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
          budgetLevel: form.budgetLevel,
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
    <div id="planner" className="rounded-[20px] border border-gray-300 bg-white p-8 text-left shadow-2xl">
      <h2 className="mb-1 text-xl font-extrabold text-green-900">Start building your plan</h2>
      <p className="mb-5 text-sm text-ink-soft">Choose your goal and diet. We'll handle the rest.</p>

      {prefilled && (
        <div className="mb-4 rounded-lg bg-amber-50 px-3.5 py-2.5 text-xs font-semibold text-amber-800">
          ✓ Calorie & protein targets pre-filled from your macro calculator results.
        </div>
      )}

      <div className="mb-5">
        <label className="mb-2 block text-[13px] font-bold text-ink">Your goal</label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {GOAL_CARDS.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => setForm({ ...form, goal: g.value })}
              aria-pressed={form.goal === g.value}
              className={`rounded-2xl border-2 p-4 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 ${
                form.goal === g.value ? 'border-green-600 bg-green-50 shadow-sm' : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <div className="mb-1.5 text-2xl">{g.icon}</div>
              <div className="text-sm font-extrabold text-green-900">{g.label}</div>
              <div className="mt-0.5 text-xs text-ink-soft">{g.benefit}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <Field label="Dietary preference" hint="— select all that apply">
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
          <p className="mt-1.5 text-[11px] text-ink-soft">
            Combine any options — e.g. Vegetarian + Gluten-free, or Dairy-free + your protein target.
          </p>
        </Field>
      </div>

      {loading && (
        <div className="mb-3 flex items-center justify-center gap-2">
          {PROGRESS_STAGES.map((stage, i) => {
            const current = progressStageIndex(loadingStep);
            const state = i < current ? 'done' : i === current ? 'active' : 'pending';
            return (
              <div key={stage} className="flex items-center gap-2">
                <span
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                    state === 'pending' ? 'bg-gray-100 text-ink-soft' : 'bg-green-600 text-white'
                  }`}
                >
                  {state === 'done' ? '✓' : i + 1} {stage}
                </span>
                {i < PROGRESS_STAGES.length - 1 && <span className="text-gray-300">→</span>}
              </div>
            );
          })}
        </div>
      )}

      <div className="mb-2 flex justify-end">
        <button
          onClick={generate}
          disabled={loading}
          className="rounded-full bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-md transition duration-200 hover:-translate-y-px hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {loading ? LOADING_STEPS[loadingStep] : 'Create My Free Meal Plan →'}
        </button>
      </div>

      {error && <p className="mt-2 text-sm font-semibold text-amber-700">{error}</p>}

      <div className="mb-6 mt-6">
        <button
          type="button"
          onClick={() => setShowCustomize((v) => !v)}
          aria-expanded={showCustomize}
          className="flex w-full items-center justify-between rounded-xl border-[1.5px] border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm font-bold text-green-800 transition duration-200 hover:border-green-300 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
        >
          <span>⚙️ Customise My Plan (optional)</span>
          <span className="text-xs font-normal text-ink-soft">{showCustomize ? 'Hide ▲' : 'Show ▼'}</span>
        </button>
        <p className="mt-1.5 text-[11px] leading-tight text-ink-soft">
          We use sensible defaults if you skip this — 30 min cook time, 1 person, a balanced ingredient mix, and four meals per day: breakfast, lunch, dinner, and one snack.
        </p>

        {showCustomize && (
          <div className="mt-4">
            <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
              <Field label="Max cook time" hint="(min/meal)" id="timeInput">
                <input id="timeInput" type="number" min={5} max={90} step={5} value={form.time}
                  onChange={(e) => setForm({ ...form, time: Number(e.target.value) })}
                  className="w-full rounded-lg border-[1.5px] border-gray-200 px-3 py-2.5 text-sm" />
              </Field>
              <Field label="Household size" hint="(people)" id="familyInput">
                <input id="familyInput" type="number" min={1} max={8} step={1} value={form.family}
                  onChange={(e) => setForm({ ...form, family: Number(e.target.value) })}
                  className="w-full rounded-lg border-[1.5px] border-gray-200 px-3 py-2.5 text-sm" />
              </Field>
              <Field label="Ingredient preference" id="budgetLevelGroup">
                <div role="radiogroup" aria-label="Ingredient preference" className="grid grid-cols-3 gap-1.5">
                  {BUDGET_LEVELS.map((lvl) => (
                    <button
                      key={lvl.value}
                      type="button"
                      role="radio"
                      aria-checked={form.budgetLevel === lvl.value}
                      onClick={() => setForm({ ...form, budgetLevel: lvl.value })}
                      className={`flex flex-col items-center gap-0.5 rounded-lg border-[1.5px] px-1.5 py-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-1 ${
                        form.budgetLevel === lvl.value
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-sm leading-none">{lvl.icon}</span>
                      <span className={`text-xs font-semibold leading-tight ${form.budgetLevel === lvl.value ? 'text-green-800' : 'text-gray-700'}`}>{lvl.label}</span>
                      <span className="text-[10px] leading-tight text-ink-soft">{lvl.desc}</span>
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Dishes per day" hint="(across meals)">
                <div className="flex flex-wrap gap-1.5">
                  {DISH_PRESETS.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, dishesPerDay: d.value }))}
                      className={`rounded-lg border-[1.5px] px-2.5 py-2 text-xs font-semibold transition duration-200 ${
                        form.dishesPerDay === d.value ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-ink-soft'
                      }`}
                    >
                      {d.label} <span className="font-normal">({d.hint})</span>
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <div className="mb-5">
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
                <p className="mt-1.5 text-[11px] text-ink-soft">
                  ≈ {form.meals.map((s) => `${dishSplit[s] || 0} ${MEAL_LABELS[s]}`).join(' · ')}
                </p>
              </Field>
              <p className="mt-1.5 text-[11px] leading-tight text-ink-soft">Choose whether you prefer economical everyday ingredients, a balanced mix, or greater recipe variety. We don't estimate exact grocery prices, since these vary a lot by country and retailer.</p>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-4 md:max-w-md">
              <Field label="Daily calorie target" hint="(kcal)" id="calorieInput">
                <input id="calorieInput" type="number" min={800} max={6000} step={50} value={calorieValue}
                  onChange={(e) => setForm((f) => ({ ...f, calorieTouched: true, customCalorieTarget: Number(e.target.value) }))}
                  className="w-full rounded-lg border-[1.5px] border-gray-200 px-3 py-2.5 text-sm" />
              </Field>
              <Field label="Daily protein target" hint="(g)" id="proteinInput">
                <input id="proteinInput" type="number" min={40} max={300} step={5} value={proteinValue}
                  onChange={(e) => setForm({ ...form, protein: Number(e.target.value), proteinTouched: true })}
                  className="w-full rounded-lg border-[1.5px] border-gray-200 px-3 py-2.5 text-sm" />
              </Field>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowPersonalize((v) => !v)}
                aria-expanded={showPersonalize}
                className="flex w-full items-center justify-between rounded-xl border-[1.5px] border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm font-bold text-green-800 transition duration-200 hover:border-green-300 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
              >
                <span>🔒 Personalise using my stats (optional)</span>
                <span className="text-xs font-normal text-ink-soft">{showPersonalize ? 'Hide ▲' : 'Show ▼'}</span>
              </button>
              <p className="mt-1.5 text-[11px] leading-tight text-ink-soft">
                Add your weight, height, age &amp; activity level for calorie and protein targets calculated just for you.
              </p>

              {showPersonalize && (
                <div className="mt-4">
                  <div className="mb-4 flex items-start gap-2 rounded-lg bg-gray-50 px-3.5 py-2.5 text-xs text-ink-soft">
                    <span>🔒</span>
                    <span>
                      Your weight, height, age, and sex are used only in your browser to calculate the targets below — the raw
                      numbers are never sent to our servers or to the AI that builds your plan.{' '}
                      <a href="/privacy" className="font-semibold text-green-700 underline">Read our privacy policy</a>.
                    </span>
                  </div>
                  <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-5">
                    <Field label="Current weight" hint="(kg)" id="weightInput">
                      <input id="weightInput" type="number" min={30} max={250} step={1} value={form.weight}
                        onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
                        className="w-full rounded-lg border-[1.5px] border-gray-200 px-3 py-2.5 text-sm" />
                    </Field>
                    <Field label="Height" hint="(cm)" id="heightInput">
                      <input id="heightInput" type="number" min={120} max={230} step={1} value={form.height}
                        onChange={(e) => setForm({ ...form, height: Number(e.target.value) })}
                        className="w-full rounded-lg border-[1.5px] border-gray-200 px-3 py-2.5 text-sm" />
                    </Field>
                    <Field label="Age" id="ageInput">
                      <input id="ageInput" type="number" min={14} max={100} step={1} value={form.age}
                        onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                        className="w-full rounded-lg border-[1.5px] border-gray-200 px-3 py-2.5 text-sm" />
                    </Field>
                    <Field label="Sex" id="sexSelect">
                      <select
                        id="sexSelect"
                        value={form.sex}
                        onChange={(e) => setForm({ ...form, sex: e.target.value })}
                        className="w-full rounded-lg border-[1.5px] border-gray-200 px-3 py-2.5 text-sm"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </Field>
                    <Field label="Activity level" id="activityLevelSelect">
                      <select
                        id="activityLevelSelect"
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

                  <div className="rounded-xl bg-green-50 p-4 text-sm text-green-900">
                    <b className="mb-1 block">🔢 Your calculated daily targets</b>
                    <span className="text-lg font-extrabold">{targets.calorieTarget} kcal</span>
                    <span className="mx-2 text-green-700/50">·</span>
                    <span className="text-lg font-extrabold">{targets.proteinTarget}g protein</span>
                    <div className="mt-1 text-xs text-green-700">
                      BMR {targets.bmr} kcal · maintenance (TDEE) {targets.tdee} kcal, based on the Mifflin-St Jeor formula.
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-green-700">
                      {form.calorieTouched && (
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, calorieTouched: false, customCalorieTarget: null }))}
                          className="font-bold underline"
                        >
                          Use calculated calorie target ({targets.calorieTarget} kcal)
                        </button>
                      )}
                      {form.proteinTouched && form.protein !== targets.proteinTarget && (
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, protein: targets.proteinTarget, proteinTouched: false }))}
                          className="font-bold underline"
                        >
                          Use calculated protein target ({targets.proteinTarget}g)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {result && (
        <PlanResults
          result={result}
          family={form.family}
          budgetLevel={form.budgetLevel}
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
        isPremium={isPremium}
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

function Field({ label, hint, id, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-bold text-ink">
        {label} {hint && <span className="font-normal text-ink-soft">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function PlanResults({ result, family, budgetLevel, proteinTarget, calorieTarget, goal, onOpenRecipe, onRegenerateDay }) {
  const { days, coachNote, groceries, stats, usage, meals } = result;
  const mealSlots = Array.isArray(meals) && meals.length ? meals : ['breakfast', 'main', 'snack'];
  const calorieOnTarget = Math.abs(stats.avgCal - calorieTarget) <= calorieTarget * 0.1;
  const proteinOnTarget = stats.avgProtein >= proteinTarget * 0.9;
  const [downloading, setDownloading] = useState(false);
  const [regeneratingDay, setRegeneratingDay] = useState(null);

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
  const consolidatedCount = Object.keys(groceries).length;
  let rawIngredientCount = 0;
  days.forEach((row) => {
    mealSlots.forEach((slot) => {
      (row[`${slot}Dishes`] || []).forEach((d) => {
        const r = findRecipe(d.id);
        if (r && Array.isArray(r.ingredients)) rawIngredientCount += r.ingredients.length;
      });
    });
  });

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
      await downloadPlanPdf({ days, mealSlots, groceries, stats, coachNote, goal, proteinTarget, calorieTarget, budgetLevel });
    } catch (err) {
      console.error('PDF export failed', err);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="mt-9 rounded-2xl border-2 border-green-200 bg-green-50/30 p-6 text-left">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-3.5 py-1.5 text-xs font-extrabold text-white">
            ✨ Your plan is ready
          </span>
          <p className="mt-2 text-sm font-semibold text-green-800">
            {mealSlots.map((s) => `7 ${MEAL_LABELS[s]}`).join(' · ')} · shopping list included
            {calorieOnTarget ? ' · calories on target' : ''}
            {proteinOnTarget ? ' · protein target hit' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleDownloadCsv} disabled={downloading} className="rounded-full border-[1.5px] border-green-600 bg-white px-4 py-2 text-xs font-bold text-green-700 shadow-sm transition duration-200 hover:bg-green-50 disabled:opacity-60">📄 Download grocery list (CSV)</button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="rounded-full border-[1.5px] border-green-600 bg-white px-4 py-2 text-xs font-bold text-green-700 shadow-sm transition duration-200 hover:bg-green-50 disabled:opacity-60"
          >
            {downloading ? 'Preparing PDF…' : '⬇️ Download plan & grocery list (PDF)'}
          </button>
        </div>
      </div>
      <div className="mb-7 grid grid-cols-2 gap-3.5 md:grid-cols-4">
        <Stat label={`Avg daily protein (target ${proteinTarget}g)`} value={`${stats.avgProtein}g`} />
        <Stat label={`Avg daily calories (target ${calorieTarget})`} value={stats.avgCal} />
        <Stat label={usage.isPremium ? 'Plans this month' : `Plans used (of ${usage.limit})`} value={usage.used} />
      </div>

      {coachNote && (
        <div className="mb-7 rounded-xl bg-green-50 p-4 text-sm text-green-900">
          <b className="mb-1 block">📝 Plan notes</b>
          {coachNote}
        </div>
      )}

      <h3 className="mb-3 mt-7 text-xl font-extrabold text-green-900">🗓️ Your 7-day menu</h3>
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

      <h3 className="mb-3 mt-7 text-lg font-extrabold text-green-900">Optimised grocery list</h3>
      <p className="mb-3 text-xs text-ink-soft">
        {rawIngredientCount} ingredient entries across the week consolidated into {consolidatedCount} grocery items to buy.
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {groceryBuckets.map((b) => (
          <div key={b.key} className="rounded-xl border border-gray-200 bg-white p-4">
            <h4 className="mb-2.5 text-sm font-bold text-green-700">{b.label}</h4>
            <ul>
              {b.items.sort((a, c) => a.name.localeCompare(c.name)).map((i) => (
                <li key={i.name} className="flex justify-between border-b border-dashed border-gray-100 py-1.5 text-sm">
                  <span>{i.name}</span>
                  <span className="text-ink-soft">{Math.round(i.qty)}{i.unit}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="rounded-xl border border-green-100 bg-green-50 p-4">
          <p className="text-sm font-extrabold text-green-900">🔁 Smart repetition, not random repetition</p>
          <p className="mt-1 text-xs text-ink-soft">
            Just {stats.distinctRecipes} distinct recipes across the week, repeated by design.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px] font-semibold text-green-700">
            <span className="rounded-full bg-white px-2.5 py-1">♻️ Less food waste</span>
            <span className="rounded-full bg-white px-2.5 py-1">🛒 Simpler shopping</span>
            <span className="rounded-full bg-white px-2.5 py-1">⏱️ Easier meal prep</span>
            <span className="rounded-full bg-white px-2.5 py-1">💰 Saves money</span>
          </div>
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
