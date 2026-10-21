'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/AuthContext';
import AddToPlanModal from './AddToPlanModal';
import PantryPicker from './PantryPicker';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Any'];
const TIME_OPTIONS = [
  { v: 15, l: 'Under 15 min' },
  { v: 30, l: 'Under 30 min' },
  { v: 45, l: 'Under 45 min' },
  { v: 60, l: 'Under 60 min' },
  { v: 0, l: 'No preference' },
];
const DIETS = ['Vegetarian', 'Vegan', 'Dairy-free', 'Gluten-free', 'Low-carb', 'High-protein', 'Mediterranean'];
const QUICK_EXCLUDE = ['Mushrooms', 'Chicken', 'Peanuts', 'Seafood', 'Dairy', 'Eggs'];
const PREFS_KEY = 'yaf_ai_recipe_prefs_v1';
const LOADING_STEPS = ['Checking your preferences...', 'Creating your recipe...', 'Calculating your macros...'];

const DEFAULTS = { description: '', calories: '', protein: '', mealType: 'Any', maxTime: 0, diets: [], excluded: '', servings: 1, mode: 'describe', available: [], strictPantry: true, staples: true };

function newKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`.padEnd(16, 'x');
}

function fmtQty(q) {
  const n = Math.round(q * 4) / 4;
  return Number.isInteger(n) ? String(n) : String(n);
}

const chip = (active) =>
  `rounded-full border px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 ${
    active ? 'border-green-600 bg-green-600 text-white' : 'border-gray-200 bg-white text-ink hover:bg-green-50'
  }`;

export default function RecipeGenerator() {
  const { user, session, authReady, requestSignIn } = useAuth();
  const [form, setForm] = useState(DEFAULTS);
  const [phase, setPhase] = useState('form'); // form | loading | result
  const [stepIdx, setStepIdx] = useState(0);
  const [error, setError] = useState(null);
  const [limitHit, setLimitHit] = useState(false);
  const [result, setResult] = useState(null);
  const [usage, setUsage] = useState(null);
  const [saved, setSaved] = useState([]);
  const [openSaved, setOpenSaved] = useState(null);
  const [toast, setToast] = useState('');
  const [planModal, setPlanModal] = useState(null); // { data, savedId }
  const [savedId, setSavedId] = useState(null); // id of the currently shown result once saved
  const busy = useRef(false);

  // restore preferences (never anything sensitive)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) setForm((f) => ({ ...f, ...JSON.parse(raw), description: '' }));
    } catch { /* ignore */ }
  }, []);

  const authHeaders = useCallback(
    () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` }),
    [session]
  );

  const refresh = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch('/api/ai-recipe', { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUsage(data.usage);
        setSaved(data.saved || []);
      }
    } catch { /* ignore */ }
  }, [session, authHeaders]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (phase !== 'loading') return undefined;
    setStepIdx(0);
    const t = setInterval(() => setStepIdx((i) => Math.min(i + 1, LOADING_STEPS.length - 1)), 3500);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const toggleDiet = (d) => set({ diets: form.diets.includes(d) ? form.diets.filter((x) => x !== d) : [...form.diets, d] });
  const toggleExclude = (term) => {
    const list = form.excluded.split(',').map((s) => s.trim()).filter(Boolean);
    const has = list.some((s) => s.toLowerCase() === term.toLowerCase());
    set({ excluded: (has ? list.filter((s) => s.toLowerCase() !== term.toLowerCase()) : [...list, term]).join(', ') });
  };

  async function generate(regenerate = false, improve = null) {
    if (busy.current) return;
    if (!user || !session) { requestSignIn(); setError('Sign in (left menu) to generate a recipe.'); return; }
    if (!improve && form.mode === 'pantry' && form.available.length < 2) { setError('Pick at least 2 ingredients you have.'); return; }
    busy.current = true;
    setError(null);
    setLimitHit(false);
    setPhase('loading');
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ ...form, description: '' }));
    } catch { /* ignore */ }
    try {
      const res = await fetch('/api/ai-recipe', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(
          improve
            ? {
                healthier: improve,
                description: '',
                excluded: form.excluded,
                servings: result.recipe.servings,
                base: {
                  title: result.recipe.title,
                  servings: result.recipe.servings,
                  ingredients: result.recipe.ingredients.map((i) => ({ key: i.key, grams: i.grams })),
                },
                idempotencyKey: newKey(),
                regenerate: true,
              }
            : { ...form, available: form.mode === 'pantry' ? form.available : [], idempotencyKey: newKey(), regenerate }
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.usage) setUsage(data.usage);
        if (data.limitReached) setLimitHit(true);
        setError(data.error || 'Something went wrong. Please try again.');
        setPhase('form');
        return;
      }
      setResult(data);
      setSavedId(null);
      if (data.usage) setUsage(data.usage);
      setPhase('result');
    } catch {
      setError('Network problem. Please try again — you have not been charged a generation.');
      setPhase('form');
    } finally {
      busy.current = false;
    }
  }

  // Saves the current result (idempotent). Returns the saved recipe id or null.
  async function save(quiet = false) {
    if (!result) return null;
    if (savedId) return savedId;
    try {
      const res = await fetch('/api/ai-recipe/save', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ requestKey: result.requestKey }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || 'Could not save the recipe.'); return null; }
      setSavedId(data.id);
      if (!quiet) setToast('Recipe saved to My Recipes.');
      refresh();
      return data.id;
    } catch {
      setError('Could not save the recipe. Please try again.');
      return null;
    }
  }

  // Add to Meal Plan needs a saved recipe (the plan keeps its own snapshot).
  async function openPlanModalForResult() {
    setError(null);
    const id = await save(true);
    if (id) setPlanModal({ data: result, savedId: id });
  }

  async function remove(id) {
    if (!window.confirm('Delete this saved recipe?')) return;
    const res = await fetch(`/api/ai-recipe?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: authHeaders() });
    if (res.ok) { setOpenSaved(null); setToast('Recipe deleted.'); refresh(); } else setError('Could not delete the recipe.');
  }

  const remaining = usage ? usage.remaining : null;

  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-12">
      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-green-800 px-5 py-2.5 text-sm font-bold text-white shadow-lg">
          {toast}
        </div>
      )}

      {phase !== 'result' && (
        <>
          <header className="mb-8 text-center">
            <span className="mb-3 inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-green-700">AI Recipe Generator</span>
            <h1 className="mb-2 text-3xl font-extrabold leading-tight text-green-900 sm:text-4xl">What are you craving today?</h1>
            <p className="text-ink-soft">Tell us what you&apos;d like to eat, and we&apos;ll create a recipe tailored to your goals.</p>
          </header>

          {usage && (
            <p className="mb-5 text-center text-sm font-semibold text-ink-soft" aria-live="polite">
              {usage.remaining} of {usage.limit} AI recipes remaining this month.
            </p>
          )}

          {error && (
            <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
              {limitHit && usage && !usage.isPremium && (
                <div className="mt-3">
                  <Link href="/#pricing" className="inline-block rounded-full bg-green-600 px-5 py-2 text-sm font-bold text-white hover:bg-green-700">Unlock More Recipes</Link>
                </div>
              )}
            </div>
          )}

          {phase === 'loading' ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm" role="status" aria-live="polite">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-green-100 border-t-green-600" />
              <p className="font-bold text-green-900">{LOADING_STEPS[stepIdx]}</p>
              <p className="mt-1 text-sm text-ink-soft">This usually takes 5–15 seconds.</p>
            </div>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); generate(false); }}
              className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <div role="tablist" aria-label="How do you want to start?" className="flex flex-wrap gap-2">
                <button type="button" role="tab" aria-selected={form.mode === 'describe'} onClick={() => set({ mode: 'describe' })} className={chip(form.mode === 'describe')}>Describe a recipe</button>
                <button type="button" role="tab" aria-selected={form.mode === 'pantry'} onClick={() => set({ mode: 'pantry' })} className={chip(form.mode === 'pantry')}>🥕 Cook with what I have</button>
              </div>

              {form.mode === 'pantry' ? (
                <>
                  <PantryPicker
                    value={form.available} onChange={(v) => set({ available: v })}
                    strict={form.strictPantry} onStrict={(v) => set({ strictPantry: v })}
                    staples={form.staples} onStaples={(v) => set({ staples: v })}
                  />
                  <div>
                    <label htmlFor="rg-desc" className="mb-1.5 block text-sm font-bold text-green-900">Any style or mood? <span className="font-normal text-ink-soft">(optional)</span></label>
                    <input
                      id="rg-desc" type="text" maxLength={300} value={form.description}
                      onChange={(e) => set({ description: e.target.value })}
                      placeholder="e.g. a quick stir-fry, something creamy"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-200"
                    />
                  </div>
                </>
              ) : (
              <div>
                <label htmlFor="rg-desc" className="mb-1.5 block text-sm font-bold text-green-900">Recipe description</label>
                <textarea
                  id="rg-desc" required minLength={3} maxLength={300} rows={3} value={form.description}
                  onChange={(e) => set({ description: e.target.value })}
                  placeholder="e.g. High-protein creamy chicken pasta, under 600 calories."
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="rg-cal" className="mb-1.5 block text-sm font-bold text-green-900">Calories per serving <span className="font-normal text-ink-soft">(optional)</span></label>
                  <input id="rg-cal" type="number" inputMode="numeric" min={100} max={2000} value={form.calories} onChange={(e) => set({ calories: e.target.value })} placeholder="e.g. 600" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-200" />
                </div>
                <div>
                  <label htmlFor="rg-pro" className="mb-1.5 block text-sm font-bold text-green-900">Protein per serving, g <span className="font-normal text-ink-soft">(optional)</span></label>
                  <input id="rg-pro" type="number" inputMode="numeric" min={0} max={200} value={form.protein} onChange={(e) => set({ protein: e.target.value })} placeholder="e.g. 40" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-200" />
                </div>
              </div>

              <div>
                <label htmlFor="rg-ex" className="mb-1.5 block text-sm font-bold text-green-900">Excluded ingredients / allergies</label>
                <input id="rg-ex" type="text" maxLength={200} value={form.excluded} onChange={(e) => set({ excluded: e.target.value })} placeholder="e.g. mushrooms, peanuts (comma separated)" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-200" />
                <div className="mt-2 flex flex-wrap gap-2">
                  {QUICK_EXCLUDE.map((q) => {
                    const on = form.excluded.toLowerCase().split(',').map((s) => s.trim()).includes(q.toLowerCase());
                    return <button type="button" key={q} aria-pressed={on} onClick={() => toggleExclude(q)} className={chip(on)}>{q}</button>;
                  })}
                </div>
                <p className="mt-2 text-xs text-ink-soft">We exclude these from the recipe, but we can&apos;t guarantee a recipe is allergen-free or free of cross-contact. Always check labels if you have an allergy.</p>
              </div>

              <div>
                <label htmlFor="rg-serv" className="mb-1.5 block text-sm font-bold text-green-900">Servings</label>
                <select id="rg-serv" value={form.servings} onChange={(e) => set({ servings: Number(e.target.value) })} className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-200">
                  {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <button
                type="submit" disabled={!authReady}
                className="w-full rounded-full bg-green-600 px-6 py-3.5 text-base font-extrabold text-white shadow-sm transition hover:-translate-y-px hover:bg-green-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:opacity-60"
              >
                Generate My Recipe
              </button>
              {!user && authReady && <p className="text-center text-xs text-ink-soft">You&apos;ll need a free account (left menu) to generate recipes.</p>}
            </form>
          )}

          {phase === 'form' && !saved.length && user && (
            <div className="mt-10 rounded-2xl border border-dashed border-green-200 bg-green-50/50 p-8 text-center">
              <p className="font-extrabold text-green-900">Your next favorite meal starts here.</p>
              <p className="mt-1 text-sm text-ink-soft">Describe what you want to cook — a dish, a cuisine or just a craving.</p>
            </div>
          )}
        </>
      )}

      {phase === 'result' && result && (
        <>
          <RecipeView
            data={result}
            footerNote={remaining !== null ? `${usage.remaining} of ${usage.limit} AI recipes remaining this month.` : null}
            actions={
              <ResultActions
                onSave={() => save()}
                onAddToPlan={openPlanModalForResult}
                alreadySaved={!!savedId}
                onRegenerate={() => generate(true)}
                onImprove={(goal) => generate(true, goal)}
                onEdit={() => setPhase('form')}
                canRegenerate={usage ? usage.remaining > 0 : true}
              />
            }
          />
          {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
        </>
      )}

      {planModal && (
        <AddToPlanModal
          data={planModal.data}
          savedRecipeId={planModal.savedId}
          authHeaders={authHeaders}
          onClose={() => setPlanModal(null)}
        />
      )}

      {phase !== 'loading' && user && saved.length > 0 && (
        <section className="mt-12" aria-labelledby="my-recipes">
          <h2 id="my-recipes" className="mb-3 text-xl font-extrabold text-green-900">My Recipes</h2>
          <ul className="space-y-2">
            {saved.map((s) => (
              <li key={s.id} className="rounded-xl border border-gray-100 bg-white">
                <button type="button" onClick={() => { setOpenSaved(openSaved === s.id ? null : s.id); }} aria-expanded={openSaved === s.id} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
                  <span>
                    <span className="block font-bold text-green-900">{s.title}</span>
                    <span className="text-xs text-ink-soft">{s.nutrition_per_serving?.kcal} kcal · {s.nutrition_per_serving?.protein}g protein per serving · AI-generated</span>
                  </span>
                  <span aria-hidden="true">{openSaved === s.id ? '−' : '+'}</span>
                </button>
                {openSaved === s.id && (
                  <div className="border-t border-gray-100 p-4">
                    <RecipeView
                      data={s.recipe_json}
                      compact
                      actions={
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => setPlanModal({ data: s.recipe_json, savedId: s.id })} className="rounded-full bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700">Add to Meal Plan</button>
                          <button type="button" onClick={() => remove(s.id)} className="rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50">Delete recipe</button>
                        </div>
                      }
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ResultActions({ onSave, onAddToPlan, alreadySaved, onRegenerate, onImprove, onEdit, canRegenerate }) {
  const [saving, setSaving] = useState(false);
  const [planBusy, setPlanBusy] = useState(false);
  const done = alreadySaved;
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={saving || done} onClick={async () => { setSaving(true); await onSave(); setSaving(false); }} className="rounded-full bg-green-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-60">
        {done ? 'Saved ✓' : saving ? 'Saving...' : 'Save to My Recipes'}
      </button>
      <button type="button" disabled={planBusy} onClick={async () => { setPlanBusy(true); await onAddToPlan(); setPlanBusy(false); }} className="rounded-full border border-green-600 px-5 py-2.5 text-sm font-bold text-green-700 hover:bg-green-50 disabled:opacity-60">Add to Meal Plan</button>
      <button type="button" disabled={!canRegenerate} onClick={onRegenerate} className="rounded-full border border-green-600 px-5 py-2.5 text-sm font-bold text-green-700 hover:bg-green-50 disabled:opacity-50">Regenerate</button>
      <button type="button" onClick={onEdit} className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-bold text-ink hover:bg-gray-50">Edit Preferences</button>
      <div className="flex w-full flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
        <span className="text-sm font-bold text-green-900">Make it healthier:</span>
        <button type="button" disabled={!canRegenerate} onClick={() => onImprove('lighter')} className="rounded-full border border-violet-300 px-4 py-2 text-sm font-bold text-violet-700 hover:bg-violet-50 disabled:opacity-50">Lighter (~20% fewer calories)</button>
        <button type="button" disabled={!canRegenerate} onClick={() => onImprove('protein')} className="rounded-full border border-violet-300 px-4 py-2 text-sm font-bold text-violet-700 hover:bg-violet-50 disabled:opacity-50">Higher protein (+30%)</button>
        <span className="text-xs text-ink-soft">Uses 1 AI recipe.</span>
      </div>
    </div>
  );
}

function RecipeView({ data, actions, footerNote, compact = false }) {
  const recipe = data.recipe || data; // saved rows store recipe fields at top level
  const nutrition = data.nutrition || { perServing: {}, total: {} };
  const validation = data.validation;
  const base = recipe.servings || 1;
  const [view, setView] = useState(base);
  const factor = view / base;
  const ps = nutrition.perServing || {};
  const total = nutrition.total || {};

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-extrabold text-violet-700">✨ AI-generated</span>
        {(recipe.dietaryTags || []).map((t) => (
          <span key={t} className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">{t}</span>
        ))}
      </div>
      <h2 className={`${compact ? 'text-xl' : 'text-2xl'} font-extrabold text-green-900`}>{recipe.title}</h2>
      {data.improved && (
        <p className="mt-2 rounded-xl bg-violet-50 px-3 py-2 text-sm text-violet-900">
          {data.improved.goal === 'lighter' ? 'Lighter' : 'Higher-protein'} version of <b>{data.improved.fromTitle || 'your recipe'}</b>: was {data.improved.baseKcal} kcal and {data.improved.baseProtein} g protein per serving, now {ps.kcal} kcal and {ps.protein} g.
        </p>
      )}
      {recipe.description && <p className="mt-1 text-ink-soft">{recipe.description}</p>}
      {data.pantry && (
        <div className="mt-3 rounded-xl border border-green-100 bg-green-50 p-3 text-sm">
          <p><b className="text-green-900">Uses from your kitchen:</b> {data.pantry.used.join(', ') || '—'}</p>
          {data.pantry.missing.length > 0 && (
            <p className="mt-1"><b className="text-amber-800">You&apos;ll need to pick up:</b> {data.pantry.missing.join(', ')}</p>
          )}
          {data.pantry.unused.length > 0 && (
            <p className="mt-1 text-ink-soft">Not used this time: {data.pantry.unused.join(', ')}</p>
          )}
          {data.pantry.dropped && data.pantry.dropped.length > 0 && (
            <p className="mt-1 text-ink-soft">Skipped because of your exclusions: {data.pantry.dropped.join(', ')}</p>
          )}
        </div>
      )}
      <p className="mt-2 text-sm text-ink-soft">
        Prep {recipe.prepMinutes} min · Cook {recipe.cookMinutes} min · Total {recipe.totalMinutes} min · {recipe.difficulty} · Makes {base} {base === 1 ? 'serving' : 'servings'}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Nutrition per serving">
        {[['Calories', ps.kcal, 'kcal'], ['Protein', ps.protein, 'g'], ['Carbs', ps.carbs, 'g'], ['Fat', ps.fat, 'g']].map(([l, v, u]) => (
          <div key={l} className="rounded-xl bg-green-50 px-3 py-3 text-center">
            <div className="text-xl font-extrabold text-green-900">{v}<span className="text-sm font-bold"> {u}</span></div>
            <div className="text-xs font-semibold text-ink-soft">{l} / serving</div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-soft">
        {base > 1 && <>Whole recipe: {total.kcal} kcal · {total.protein}g protein · {total.carbs}g carbs · {total.fat}g fat. </>}
        Estimates calculated from ingredient data; real values vary with brands, preparation and cooking losses.
      </p>

      {validation && validation.status === 'closest_alternative' && (
        <div role="note" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Heads up:</strong> we couldn&apos;t hit your exact targets with a practical recipe. {validation.notes.join(' ')} These are the real calculated values.
        </div>
      )}
      {validation && validation.status === 'targets_met' && (validation.targets.calories || validation.targets.protein) && (
        <p className="mt-3 text-sm font-semibold text-green-700">✓ Calculated nutrition is within your target range.</p>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <h3 className="text-lg font-extrabold text-green-900">Ingredients</h3>
        <label className="flex items-center gap-2 text-sm font-semibold text-ink">
          Servings
          <select value={view} onChange={(e) => setView(Number(e.target.value))} className="rounded-lg border border-gray-200 px-2 py-1 text-sm">
            {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>
      <ul className="mt-2 divide-y divide-gray-100 text-sm">
        {(recipe.ingredients || []).map((i) => (
          <li key={i.key} className="flex justify-between gap-3 py-2">
            <span>{i.name}{i.note ? <span className="text-ink-soft">, {i.note}</span> : null}</span>
            <span className="whitespace-nowrap font-semibold text-ink">
              {fmtQty(i.quantity * factor)} {i.unit}
              {i.unit !== 'g' && i.unit !== 'ml' && <span className="font-normal text-ink-soft"> ({Math.round(i.grams * factor)} g)</span>}
            </span>
          </li>
        ))}
      </ul>

      <h3 className="mt-6 text-lg font-extrabold text-green-900">Method</h3>
      <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-ink">
        {(recipe.instructions || []).map((s, idx) => <li key={idx}>{s}</li>)}
      </ol>

      {recipe.storage && (
        <>
          <h3 className="mt-6 text-lg font-extrabold text-green-900">Storage</h3>
          <p className="mt-1 text-sm text-ink">{recipe.storage}</p>
        </>
      )}
      {recipe.substitutions && recipe.substitutions.length > 0 && (
        <>
          <h3 className="mt-6 text-lg font-extrabold text-green-900">Substitutions</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-ink">
            {recipe.substitutions.map((s, idx) => <li key={idx}>{s}</li>)}
          </ul>
        </>
      )}

      <p className="mt-6 text-xs text-ink-soft">This recipe was generated by AI and is not part of the YourAiFood curated recipe library. If you have allergies, check every ingredient label yourself.</p>

      {actions && <div className="mt-5">{actions}</div>}
      {footerNote && <p className="mt-3 text-sm font-semibold text-ink-soft">{footerNote}</p>}
    </article>
  );
}
