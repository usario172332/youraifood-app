import { NextResponse } from 'next/server';
import { getUserFromToken, supabaseAdmin } from '../../../../lib/supabaseAdmin';
import {
  PLAN_MEAL_SLOTS, PLAN_PORTIONS, buildSnapshot, resolveDish, dayTotals, weekStats, buildGroceryList, applyDishToPlan,
} from '../../../../lib/planRecipes';

const UUID = /^[0-9a-f-]{36}$/i;

function summarize(plan) {
  const inputs = plan.inputs || {};
  const meals = Array.isArray(inputs.meals) && inputs.meals.length ? inputs.meals.filter((m) => PLAN_MEAL_SLOTS.includes(m)) : PLAN_MEAL_SLOTS;
  const days = Array.isArray(plan.plan_days) ? plan.plan_days : [];
  const stats = weekStats(days, meals);
  return {
    id: plan.id,
    createdAt: plan.created_at,
    goal: inputs.goal || null,
    family: inputs.family || 1,
    calorieTarget: inputs.calorieTarget || null,
    proteinTarget: inputs.proteinTarget || null,
    meals,
    days: days.map((row, i) => {
      const slots = {};
      meals.forEach((slot) => {
        slots[slot] = (Array.isArray(row[`${slot}Dishes`]) ? row[`${slot}Dishes`] : [])
          .map((d) => {
            const r = resolveDish(d);
            return r ? { id: d.id, name: r.name, servings: d.servings || 1, cal: Math.round(r.cal * (d.servings || 1)), protein: Math.round(r.protein * (d.servings || 1)), ai: !!(r.ai || String(d.id).startsWith('ai:')) } : null;
          })
          .filter(Boolean);
      });
      return { day: row.day, slots, totals: stats.perDay[i] };
    }),
    stats: { avgCal: stats.avgCal, avgProtein: stats.avgProtein, avgCarbs: stats.avgCarbs, avgFat: stats.avgFat, distinctRecipes: stats.distinctRecipes },
    groceries: buildGroceryList(days, inputs.family || 1, meals),
  };
}

async function auth(req) {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  return getUserFromToken(token);
}

// GET: the user's recent plans, with per-day macro totals
export async function GET(req) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Server is not configured.' }, { status: 500 });
  const { data, error } = await admin
    .from('saved_plans').select('id, inputs, plan_days, created_at')
    .eq('user_id', user.id).order('created_at', { ascending: false }).limit(5);
  if (error) return NextResponse.json({ error: 'Could not load your plans.' }, { status: 500 });
  return NextResponse.json({ plans: (data || []).map(summarize) });
}

// POST: add (or replace with) a saved AI recipe in a plan slot
export async function POST(req) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Server is not configured.' }, { status: 500 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }

  const { planId, savedRecipeId, slot } = body;
  const dayIndex = Number(body.dayIndex);
  const servings = Number(body.servings || 1);
  const replaceDishId = body.replaceDishId ? String(body.replaceDishId) : null;

  if (!UUID.test(String(planId || '')) || !UUID.test(String(savedRecipeId || ''))) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  if (!PLAN_MEAL_SLOTS.includes(slot)) return NextResponse.json({ error: 'Choose a meal slot.' }, { status: 400 });
  if (!Number.isInteger(dayIndex)) return NextResponse.json({ error: 'Choose a day.' }, { status: 400 });
  if (!PLAN_PORTIONS.includes(servings)) return NextResponse.json({ error: 'Invalid portion size.' }, { status: 400 });
  if (replaceDishId && body.confirmReplace !== true) {
    return NextResponse.json({ error: 'Please confirm replacing the existing meal.', code: 'confirm_required' }, { status: 409 });
  }

  const { data: plan } = await admin.from('saved_plans').select('id, inputs, plan_days, created_at').eq('id', planId).eq('user_id', user.id).maybeSingle();
  if (!plan || !Array.isArray(plan.plan_days)) return NextResponse.json({ error: 'Plan not found.' }, { status: 404 });
  const { data: saved } = await admin.from('saved_recipes').select('id, recipe_json').eq('id', savedRecipeId).eq('user_id', user.id).maybeSingle();
  if (!saved) return NextResponse.json({ error: 'Saved recipe not found. Save it first.' }, { status: 404 });

  const before = summarize(plan);
  const dish = { id: `ai:${saved.id}`, servings, snapshot: buildSnapshot(saved.id, saved.recipe_json) };

  let newDays;
  try {
    newDays = applyDishToPlan(plan.plan_days, { dayIndex, slot, replaceDishId, dish });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }

  const inputs = { ...(plan.inputs || {}) };
  const meals = Array.isArray(inputs.meals) && inputs.meals.length ? [...inputs.meals] : [...PLAN_MEAL_SLOTS];
  if (!meals.includes(slot)) meals.push(slot);
  inputs.meals = meals;

  const { error } = await admin.from('saved_plans').update({ plan_days: newDays, inputs }).eq('id', plan.id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: 'Could not update your plan.' }, { status: 500 });

  const after = summarize({ ...plan, plan_days: newDays, inputs });
  return NextResponse.json({
    ok: true,
    plan: after,
    changedDay: { index: dayIndex, before: before.days[dayIndex]?.totals || null, after: after.days[dayIndex]?.totals || null },
    message: 'Recipe added to your meal plan. Your macros and grocery list have been updated.',
  });
}
