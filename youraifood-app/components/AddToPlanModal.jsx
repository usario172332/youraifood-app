'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

const SLOT_LABELS = { breakfast: 'Breakfast', main: 'Lunch & Dinner', snack: 'Snack' };
const SLOTS = ['breakfast', 'main', 'snack'];
const PORTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];

function defaultSlot(mealType) {
  if (mealType === 'Breakfast') return 'breakfast';
  if (mealType === 'Snack' || mealType === 'Dessert') return 'snack';
  return 'main';
}

export default function AddToPlanModal({ data, savedRecipeId, authHeaders, onClose }) {
  const recipe = data.recipe || data;
  const per = (data.nutrition && data.nutrition.perServing) || {};
  const [plans, setPlans] = useState(null);
  const [planId, setPlanId] = useState(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [slot, setSlot] = useState(defaultSlot(recipe.mealType));
  const [replaceId, setReplaceId] = useState(''); // '' = add as extra dish
  const [portion, setPortion] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/ai-recipe/plan', { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : { plans: [] }))
      .then((d) => {
        if (cancelled) return;
        setPlans(d.plans || []);
        if (d.plans && d.plans[0]) setPlanId(d.plans[0].id);
      })
      .catch(() => !cancelled && setPlans([]));
    return () => { cancelled = true; };
  }, [authHeaders]);

  const plan = useMemo(() => (plans || []).find((p) => p.id === planId) || null, [plans, planId]);
  const day = plan ? plan.days[dayIndex] : null;
  const occupants = day ? day.slots[slot] || [] : [];

  useEffect(() => { setReplaceId(''); }, [dayIndex, slot, planId]);

  // live preview of the chosen day's totals
  const preview = useMemo(() => {
    if (!day) return null;
    const replaced = occupants.find((o) => o.id === replaceId);
    const addCal = Math.round((per.kcal || 0) * portion);
    const addPro = Math.round((per.protein || 0) * portion);
    return {
      cal: day.totals.cal + addCal - (replaced ? replaced.cal : 0),
      protein: day.totals.protein + addPro - (replaced ? replaced.protein : 0),
    };
  }, [day, occupants, replaceId, per.kcal, per.protein, portion]);

  async function confirm() {
    setError('');
    if (replaceId) {
      const target = occupants.find((o) => o.id === replaceId);
      if (!window.confirm(`Replace "${target ? target.name : 'this meal'}" with "${recipe.title}" on ${day.day}?`)) return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/ai-recipe/plan', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          planId, savedRecipeId, dayIndex, slot, servings: portion,
          replaceDishId: replaceId || null, confirmReplace: !!replaceId,
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) { setError(out.error || 'Could not update your plan.'); return; }
      setDone(out);
    } catch {
      setError('Network problem. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function downloadCsv() {
    const { downloadGroceryCsv } = await import('../lib/pdfExport');
    downloadGroceryCsv({ groceries: done.plan.groceries });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="atp-title" className="relative my-4 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 rounded-full p-1.5 text-lg leading-none text-ink-soft hover:bg-gray-100">✕</button>
        <h3 id="atp-title" className="mb-1 text-lg font-extrabold text-green-900">Add to Meal Plan</h3>
        <p className="mb-4 text-sm text-ink-soft">{recipe.title} · {per.kcal} kcal · {per.protein}g protein per serving</p>

        {plans === null && <p className="text-sm text-ink-soft">Loading your plans…</p>}

        {plans && plans.length === 0 && (
          <p className="text-sm text-ink-soft">
            You don&apos;t have a meal plan yet.{' '}
            <Link href="/#planner" className="font-semibold text-green-700 underline">Generate your first plan →</Link>
          </p>
        )}

        {plan && !done && (
          <>
            {plans.length > 1 && (
              <label className="mb-3 block text-sm font-semibold text-ink">
                Plan{' '}
                <select value={planId} onChange={(e) => { setPlanId(e.target.value); setDayIndex(0); }} className="ml-1 rounded-lg border border-gray-200 px-2 py-1 text-sm">
                  {plans.map((p) => <option key={p.id} value={p.id}>{new Date(p.createdAt).toLocaleDateString()} · {p.goal || 'plan'} · {p.days.length} days</option>)}
                </select>
              </label>
            )}

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-green-50 text-[11px] uppercase tracking-wide text-green-700">
                    <th className="px-2 py-2">Day</th>
                    {SLOTS.map((s) => <th key={s} className="px-2 py-2">{SLOT_LABELS[s]}</th>)}
                    <th className="px-2 py-2">Day total</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.days.map((d, i) => (
                    <tr key={d.day + i} className="border-t border-gray-100 align-top">
                      <td className="px-2 py-2 font-extrabold text-green-900">{d.day}</td>
                      {SLOTS.map((s) => {
                        const selected = i === dayIndex && s === slot;
                        const dishes = d.slots[s] || [];
                        return (
                          <td key={s} className="p-1">
                            <button
                              type="button"
                              onClick={() => { setDayIndex(i); setSlot(s); }}
                              aria-pressed={selected}
                              className={`w-full rounded-lg border px-2 py-1.5 text-left transition ${selected ? 'border-green-600 bg-green-50 ring-1 ring-green-600' : 'border-gray-100 hover:border-green-300'}`}
                            >
                              {dishes.length === 0 ? <span className="text-ink-soft">Empty</span> : dishes.map((x) => (
                                <span key={x.id} className="block truncate">{x.ai ? '✨ ' : ''}{x.name}</span>
                              ))}
                            </button>
                          </td>
                        );
                      })}
                      <td className="whitespace-nowrap px-2 py-2 text-ink-soft">{d.totals.cal} kcal<br />{d.totals.protein}g protein</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm">
              <div className="mb-2 font-bold text-green-900">{day.day} · {SLOT_LABELS[slot]}</div>
              <label className="mb-1.5 flex items-start gap-2">
                <input type="radio" name="atp-mode" checked={replaceId === ''} onChange={() => setReplaceId('')} className="mt-1" />
                <span>{occupants.length ? 'Add as an extra dish (keep what is already there)' : 'Add to this empty slot'}</span>
              </label>
              {occupants.map((o) => (
                <label key={o.id} className="mb-1.5 flex items-start gap-2">
                  <input type="radio" name="atp-mode" checked={replaceId === o.id} onChange={() => setReplaceId(o.id)} className="mt-1" />
                  <span>Replace <b>{o.name}</b> <span className="text-ink-soft">({o.cal} kcal · {o.protein}g protein)</span></span>
                </label>
              ))}
              <label className="mt-3 flex items-center gap-2 font-semibold text-ink">
                Portion
                <select value={portion} onChange={(e) => setPortion(Number(e.target.value))} className="rounded-lg border border-gray-200 px-2 py-1 text-sm">
                  {PORTIONS.map((p) => <option key={p} value={p}>{p}× serving</option>)}
                </select>
              </label>
              {preview && (
                <p className="mt-3 text-xs text-ink-soft">
                  {day.day} total: <b className="text-ink">{day.totals.cal} → {preview.cal} kcal</b>, <b className="text-ink">{day.totals.protein} → {preview.protein}g protein</b>
                  {plan.calorieTarget ? ` (daily target ${plan.calorieTarget} kcal${plan.proteinTarget ? ` · ${plan.proteinTarget}g protein` : ''})` : ''}
                </p>
              )}
            </div>

            {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{error}</p>}
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={onClose} className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-bold text-ink hover:bg-gray-50">Cancel</button>
              <button type="button" disabled={busy} onClick={confirm} className="rounded-full bg-green-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-60">
                {busy ? 'Updating…' : replaceId ? 'Replace meal' : 'Add to plan'}
              </button>
            </div>
          </>
        )}

        {done && (
          <div role="status">
            <p className="mb-3 font-bold text-green-700">{done.message}</p>
            <div className="mb-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-green-50 p-3">
                <div className="text-xs font-semibold text-ink-soft">{plan.days[done.changedDay.index].day}</div>
                <div className="font-extrabold text-green-900">{done.changedDay.after.cal} kcal · {done.changedDay.after.protein}g protein</div>
                <div className="text-xs text-ink-soft">was {done.changedDay.before.cal} kcal · {done.changedDay.before.protein}g</div>
              </div>
              <div className="rounded-xl bg-green-50 p-3">
                <div className="text-xs font-semibold text-ink-soft">Weekly average</div>
                <div className="font-extrabold text-green-900">{done.plan.stats.avgCal} kcal · {done.plan.stats.avgProtein}g protein</div>
                <div className="text-xs text-ink-soft">{Object.keys(done.plan.groceries).length} grocery items</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={downloadCsv} className="rounded-full border border-green-600 px-4 py-2 text-sm font-bold text-green-700 hover:bg-green-50">Download updated grocery list (CSV)</button>
              <button type="button" onClick={onClose} className="rounded-full bg-green-600 px-5 py-2 text-sm font-bold text-white hover:bg-green-700">Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
