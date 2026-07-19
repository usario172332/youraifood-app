import { NextResponse } from 'next/server';
import { getUserFromToken, supabaseAdmin } from '../../../lib/supabaseAdmin';
import { generateWeeklyPlan } from '../../../lib/anthropic';
import { findRecipe, DAYS } from '../../../lib/recipes';

// The Claude call can take 15-20+ seconds; Vercel's default function
// timeout is shorter than that, so this must be set explicitly.
export const maxDuration = 60;

const FREE_MONTHLY_LIMIT = 5;

function currentMonthKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
}

async function getOrCreateProfile(admin, user) {
  const { data: existing } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (existing) return existing;

  const { data: created, error } = await admin
    .from('profiles')
    .insert({ id: user.id, email: user.email, is_premium: false, plans_generated_this_month: 0, usage_month: currentMonthKey() })
    .select('*')
    .single();

  if (error) throw error;
  return created;
}

function buildGroceryList(days, family) {
  const groceries = {};
  days.forEach((row) => {
    ['breakfast', 'lunch', 'dinner', 'snack'].forEach((slot) => {
      const recipe = findRecipe(row[slot]);
      if (!recipe) return;
      recipe.ingredients.forEach((ing) => {
        const key = ing.n;
        if (!groceries[key]) groceries[key] = { qty: 0, unit: ing.u, cat: ing.cat };
        groceries[key].qty += ing.q * family;
      });
    });
  });
  return groceries;
}

function buildNutritionAndCost(days, family) {
  let totalCost = 0;
  let totalProtein = 0;
  let totalCal = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  const usedRecipeIds = new Set();

  days.forEach((row) => {
    ['breakfast', 'lunch', 'dinner', 'snack'].forEach((slot) => {
      const recipe = findRecipe(row[slot]);
      if (!recipe) return;
      totalCost += recipe.cost * family;
      totalProtein += recipe.protein;
      totalCal += recipe.cal;
      totalCarbs += recipe.carbs;
      totalFat += recipe.fat;
      usedRecipeIds.add(recipe.id);
    });
  });

  return {
    totalCost,
    avgProtein: Math.round(totalProtein / 7),
    avgCal: Math.round(totalCal / 7),
    avgCarbs: Math.round(totalCarbs / 7),
    avgFat: Math.round(totalFat / 7),
    distinctRecipes: usedRecipeIds.size,
  };
}

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({ error: 'Sign in to generate a plan.' }, { status: 401 });
    }

    const admin = supabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Supabase is not configured on the server yet.' },
        { status: 500 }
      );
    }

    let profile = await getOrCreateProfile(admin, user);

    // Reset the monthly counter if we've rolled into a new month.
    const monthKey = currentMonthKey();
    if (profile.usage_month !== monthKey) {
      const { data: reset } = await admin
        .from('profiles')
        .update({ plans_generated_this_month: 0, usage_month: monthKey })
        .eq('id', user.id)
        .select('*')
        .single();
      profile = reset || profile;
    }

    if (!profile.is_premium && profile.plans_generated_this_month >= FREE_MONTHLY_LIMIT) {
      return NextResponse.json(
        {
          error: `You've used all ${FREE_MONTHLY_LIMIT} free plans this month. Upgrade to Premium for unlimited plans.`,
          limitReached: true,
        },
        { status: 402 }
      );
    }

    const body = await req.json();
    const { goal, proteinTarget, calorieTarget, budget, maxTime, family, diets } = body;

    if (!goal || !proteinTarget || !calorieTarget || !budget || !maxTime || !family) {
      return NextResponse.json({ error: 'Missing required plan inputs.' }, { status: 400 });
    }

    const aiResult = await generateWeeklyPlan({
      goal,
      proteinTarget,
      calorieTarget,
      budget,
      maxTime,
      family,
      diets: Array.isArray(diets) ? diets : [],
    });

    // Validate + hydrate: the model only returns ids, we look up the real
    // recipe objects so nutrition/cost/instructions are never hallucinated.
    const days = aiResult.days.map((row, i) => ({
      day: row.day || DAYS[i],
      breakfast: findRecipe(row.breakfast)?.id || null,
      lunch: findRecipe(row.lunch)?.id || null,
      dinner: findRecipe(row.dinner)?.id || null,
      snack: row.snack ? findRecipe(row.snack)?.id || null : null,
    }));

    const groceries = buildGroceryList(days, family);
    const stats = buildNutritionAndCost(days, family);

    await admin
      .from('profiles')
      .update({ plans_generated_this_month: profile.plans_generated_this_month + 1 })
      .eq('id', user.id);

    await admin.from('saved_plans').insert({
      user_id: user.id,
      inputs: { goal, proteinTarget, calorieTarget, budget, maxTime, family, diets },
      plan_days: days,
      coach_note: aiResult.coachNote,
    });

    return NextResponse.json({
      days,
      coachNote: aiResult.coachNote,
      groceries,
      stats,
      usage: {
        used: profile.plans_generated_this_month + 1,
        limit: profile.is_premium ? null : FREE_MONTHLY_LIMIT,
        isPremium: profile.is_premium,
      },
    });
  } catch (err) {
    console.error('generate-plan error:', err);
    return NextResponse.json({ error: err.message || 'Something went wrong.' }, { status: 500 });
  }
}
