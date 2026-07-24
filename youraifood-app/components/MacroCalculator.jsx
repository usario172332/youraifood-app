'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { calculateTargets, ACTIVITY_OPTIONS } from '../lib/nutrition';

const DEFAULT_FORM = {
  goal: 'lose',
  weight: 75,
  height: 175,
  age: 30,
  sex: 'male',
  activityLevel: 'moderate',
};

// A simple, standard macro split for the free calculator: protein comes
// straight from calculateTargets (same formula the real planner uses), fat
// is set to 25% of total calories (a common, sensible default), and carbs
// take up whatever calories are left.
const FAT_PCT_OF_CALORIES = 0.25;

export default function MacroCalculator() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [touched, setTouched] = useState(false);

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

  const macros = useMemo(() => {
    const proteinCals = targets.proteinTarget * 4;
    const fatCals = Math.round(targets.calorieTarget * FAT_PCT_OF_CALORIES);
    const fatGrams = Math.round(fatCals / 9);
    const carbCals = Math.max(0, targets.calorieTarget - proteinCals - fatCals);
    const carbGrams = Math.round(carbCals / 4);
    return { fatGrams, carbGrams };
  }, [targets]);

  const plannerHref = `/?calories=${targets.calorieTarget}&protein=${targets.proteinTarget}#planner`;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 text-center">
        <span className="mb-3 inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
          Free tool — no account needed
        </span>
        <h1 className="text-3xl font-extrabold text-green-900">Macro Calculator</h1>
        <p className="mx-auto mt-2 max-w-xl text-ink-soft">
          Get your daily calorie, protein, carb, and fat targets using the Mifflin-St Jeor formula — the same
          calculation YourAiFood uses to build real meal plans.
        </p>
      </div>

      <div className="rounded-[20px] border border-gray-200 bg-white p-8 shadow-xl">
        <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-green-700">About you</h3>
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
          <Field label="Weight" hint="(kg)">
            <input
              type="number"
              min={30}
              max={250}
              step={1}
              value={form.weight}
              onChange={(e) => { setForm({ ...form, weight: Number(e.target.value) }); setTouched(true); }}
              className="w-full rounded-lg border-[1.5px] border-gray-200 px-3 py-2.5 text-sm"
            />
          </Field>
          <Field label="Height" hint="(cm)">
            <input
              type="number"
              min={120}
              max={230}
              step={1}
              value={form.height}
              onChange={(e) => { setForm({ ...form, height: Number(e.target.value) }); setTouched(true); }}
              className="w-full rounded-lg border-[1.5px] border-gray-200 px-3 py-2.5 text-sm"
            />
          </Field>
          <Field label="Age">
            <input
              type="number"
              min={14}
              max={100}
              step={1}
              value={form.age}
              onChange={(e) => { setForm({ ...form, age: Number(e.target.value) }); setTouched(true); }}
              className="w-full rounded-lg border-[1.5px] border-gray-200 px-3 py-2.5 text-sm"
            />
          </Field>
          <Field label="Sex">
            <select
              value={form.sex}
              onChange={(e) => { setForm({ ...form, sex: e.target.value }); setTouched(true); }}
              className="w-full rounded-lg border-[1.5px] border-gray-200 px-3 py-2.5 text-sm"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </Field>
          <Field label="Activity">
            <select
              value={form.activityLevel}
              onChange={(e) => { setForm({ ...form, activityLevel: e.target.value }); setTouched(true); }}
              className="w-full rounded-lg border-[1.5px] border-gray-200 px-3 py-2.5 text-sm"
            >
              {ACTIVITY_OPTIONS.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-green-700">Your goal</h3>
        <div className="mb-8 flex flex-wrap gap-2">
          <GoalChip label="🔥 Lose weight" active={form.goal === 'lose'} onClick={() => { setForm({ ...form, goal: 'lose' }); setTouched(true); }} />
          <GoalChip label="💪 Build muscle" active={form.goal === 'muscle'} onClick={() => { setForm({ ...form, goal: 'muscle' }); setTouched(true); }} />
          <GoalChip
            label="⚖️ Maintain / general health"
            active={form.goal === 'maintain'}
            onClick={() => { setForm({ ...form, goal: 'maintain' }); setTouched(true); }}
          />
        </div>

        <div className="rounded-xl bg-green-50 p-5">
          <b className="mb-3 block text-sm text-green-900">
            🔢 {touched ? 'Your daily targets' : 'Example daily targets'}
          </b>
          {!touched && (
            <p className="-mt-2 mb-3 text-xs text-green-700">
              Based on placeholder stats — enter your own above for a personalised target.
            </p>
          )}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <MacroStat label="Calories" value={targets.calorieTarget} unit="kcal" />
            <MacroStat label="Protein" value={targets.proteinTarget} unit="g" />
            <MacroStat label="Carbs" value={macros.carbGrams} unit="g" />
            <MacroStat label="Fat" value={macros.fatGrams} unit="g" />
          </div>
          <p className="mt-3 text-xs text-green-700">
            BMR {targets.bmr} kcal · maintenance (TDEE) {targets.tdee} kcal, based on the Mifflin-St Jeor formula. Fat is
            set to 25% of calories, carbs fill the rest — a common, general-purpose split.
          </p>
        </div>

        <div className="mt-6 rounded-xl border-2 border-green-300 bg-green-50 p-6 text-center">
          <p className="mb-1 text-base font-extrabold text-green-900">
            Turn these targets into a complete weekly meal plan.
          </p>
          <p className="mx-auto mb-4 max-w-md text-sm text-ink-soft">
            Recipes, a grocery list, and calculated macros per meal — built by AI around your {targets.calorieTarget} kcal
            and {targets.proteinTarget}g protein targets.
          </p>
          <Link
            href={plannerHref}
            className="inline-block rounded-full bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition duration-200 hover:-translate-y-px hover:bg-green-700 hover:shadow-md"
          >
            Build my weekly plan →
          </Link>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-ink-soft">
        This calculator gives a general estimate and is not medical or dietary advice.{' '}
        <Link href="/privacy" className="font-semibold text-green-700 underline">
          Privacy policy
        </Link>
        .
      </p>
    </div>
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

function GoalChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border-[1.5px] px-3.5 py-1.5 text-sm font-semibold ${
        active ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-ink-soft'
      }`}
    >
      {label}
    </button>
  );
}

function MacroStat({ label, value, unit }) {
  return (
    <div className="rounded-xl bg-white p-3.5 text-center shadow-sm">
      <div className="text-xl font-extrabold text-green-900">
        {value} <span className="text-xs font-normal text-ink-soft">{unit}</span>
      </div>
      <div className="text-xs font-semibold text-ink-soft">{label}</div>
    </div>
  );
}
