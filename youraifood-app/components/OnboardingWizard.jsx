'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/AuthContext';
import { calculateTargets, ACTIVITY_OPTIONS } from '../lib/nutrition';
import { MEAT_CATEGORIES } from '../lib/meatType';
import { AVOID_INGREDIENT_OPTIONS } from '../lib/avoidIngredients';
import { GOAL_OPTIONS, isNewUser, isOnboarded, markOnboarded, saveProfile } from '../lib/onboarding';

const STEPS = ['Goal', 'Your stats', 'Foods to avoid', 'Quick tour'];

const field = 'w-full rounded-lg border-[1.5px] border-gray-200 px-3 py-2.5 text-sm';

export default function OnboardingWizard() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [p, setP] = useState({
    goal: 'lose', weight: 75, height: 175, age: 30, sex: 'male', activityLevel: 'moderate',
    avoidMeats: [], avoidIngredients: [],
  });

  useEffect(() => {
    if (user && isNewUser(user) && !isOnboarded(user.id)) setOpen(true);
  }, [user]);

  const targets = useMemo(() => {
    const ok = p.weight && p.height && p.age;
    return ok ? calculateTargets(p) : null;
  }, [p]);

  if (!open || !user) return null;

  const toggle = (key, value) =>
    setP((s) => ({ ...s, [key]: s[key].includes(value) ? s[key].filter((x) => x !== value) : [...s[key], value] }));

  function finish(save) {
    if (save) {
      saveProfile(p);
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('yaf-profile-updated'));
    }
    markOnboarded(user.id);
    setOpen(false);
  }

  const statsValid = p.weight >= 30 && p.weight <= 250 && p.height >= 120 && p.height <= 230 && p.age >= 14 && p.age <= 100;
  const numChange = (key) => (e) => setP((s) => ({ ...s, [key]: e.target.value === '' ? '' : Number(e.target.value) }));

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="onb-title">
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
            {STEPS.map((s, i) => (
              <span key={s} className={`h-1.5 w-8 rounded-full ${i <= step ? 'bg-green-600' : 'bg-gray-200'}`} />
            ))}
          </div>
          <button type="button" onClick={() => finish(false)} className="text-xs font-bold text-ink-soft underline hover:text-ink">
            Skip for now
          </button>
        </div>

        <h2 id="onb-title" className="text-xl font-extrabold text-green-900">
          {step === 0 && 'Welcome! What is your goal?'}
          {step === 1 && 'Your stats'}
          {step === 2 && 'Anything you avoid?'}
          {step === 3 && "You're all set"}
        </h2>

        {step === 0 && (
          <div className="mt-4 grid gap-3">
            {GOAL_OPTIONS.map((g) => (
              <button
                key={g.value}
                type="button"
                aria-pressed={p.goal === g.value}
                onClick={() => setP({ ...p, goal: g.value })}
                className={`rounded-2xl border-2 p-4 text-left transition ${p.goal === g.value ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}
              >
                <span className="mr-2 text-xl">{g.icon}</span>
                <span className="text-sm font-extrabold text-green-900">{g.label}</span>
                <span className="mt-0.5 block text-xs text-ink-soft">{g.desc}</span>
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="mt-3">
            <p className="mb-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-ink-soft">
              🔒 Used only in your browser to calculate your targets. These numbers are never sent to our servers or the AI.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-[13px] font-bold text-ink">Weight (kg)
                <input type="number" min={30} max={250} value={p.weight} onChange={numChange('weight')} className={`${field} mt-1 font-normal`} />
              </label>
              <label className="text-[13px] font-bold text-ink">Height (cm)
                <input type="number" min={120} max={230} value={p.height} onChange={numChange('height')} className={`${field} mt-1 font-normal`} />
              </label>
              <label className="text-[13px] font-bold text-ink">Age
                <input type="number" min={14} max={100} value={p.age} onChange={numChange('age')} className={`${field} mt-1 font-normal`} />
              </label>
              <label className="text-[13px] font-bold text-ink">Sex
                <select value={p.sex} onChange={(e) => setP({ ...p, sex: e.target.value })} className={`${field} mt-1 font-normal`}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </label>
            </div>
            <label className="mt-3 block text-[13px] font-bold text-ink">Activity level
              <select value={p.activityLevel} onChange={(e) => setP({ ...p, activityLevel: e.target.value })} className={`${field} mt-1 font-normal`}>
                {ACTIVITY_OPTIONS.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
              </select>
            </label>
            {statsValid && targets && (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-900">
                Your daily targets: <b>{targets.calorieTarget} kcal</b> · <b>{targets.proteinTarget} g protein</b>
                <span className="mt-0.5 block text-xs text-green-700">Estimates (Mifflin-St Jeor). You can change them any time.</span>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="mt-3">
            <p className="mb-2 text-xs text-ink-soft">Optional. This is a preference filter, not a certified allergy check.</p>
            <div className="flex flex-wrap gap-1.5">
              {MEAT_CATEGORIES.map((m) => (
                <label key={m.value} className={`cursor-pointer rounded-lg border-[1.5px] px-2.5 py-2 text-xs font-semibold ${p.avoidMeats.includes(m.value) ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-ink-soft'}`}>
                  <input type="checkbox" className="mr-1" checked={p.avoidMeats.includes(m.value)} onChange={() => toggle('avoidMeats', m.value)} />
                  {m.label}
                </label>
              ))}
              {AVOID_INGREDIENT_OPTIONS.map((m) => (
                <label key={m.value} className={`cursor-pointer rounded-lg border-[1.5px] px-2.5 py-2 text-xs font-semibold ${p.avoidIngredients.includes(m.value) ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-ink-soft'}`}>
                  <input type="checkbox" className="mr-1" checked={p.avoidIngredients.includes(m.value)} onChange={() => toggle('avoidIngredients', m.value)} />
                  {m.label}
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-3 space-y-2.5 text-sm text-ink">
            <p className="text-ink-soft">We&apos;ve pre-filled the planner and recipe generator with your answers. Here is where to start:</p>
            <Link href="/#planner" onClick={() => finish(true)} className="block rounded-xl border border-gray-200 p-3 hover:bg-green-50">
              <b className="text-green-900">📅 Meal planner</b>
              <span className="block text-xs text-ink-soft">A full week of meals plus a shopping list, matched to your targets.</span>
            </Link>
            <Link href="/recipe-generator" onClick={() => finish(true)} className="block rounded-xl border border-gray-200 p-3 hover:bg-green-50">
              <b className="text-green-900">✨ AI recipe generator</b>
              <span className="block text-xs text-ink-soft">Describe a dish, or cook with what you have in the fridge.</span>
            </Link>
            <Link href="/recipes" onClick={() => finish(true)} className="block rounded-xl border border-gray-200 p-3 hover:bg-green-50">
              <b className="text-green-900">📖 Recipe library</b>
              <span className="block text-xs text-ink-soft">Browse hundreds of fitness recipes with calculated macros.</span>
            </Link>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button type="button" disabled={step === 0} onClick={() => setStep(step - 1)} className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-bold text-ink hover:bg-gray-50 disabled:opacity-40">
            Back
          </button>
          {step < 3 ? (
            <button
              type="button"
              disabled={step === 1 && !statsValid}
              onClick={() => setStep(step + 1)}
              className="rounded-full bg-green-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button type="button" onClick={() => finish(true)} className="rounded-full bg-green-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-700">
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
