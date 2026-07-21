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

const MEAL_SLOTS = ['breakfast', 'main', 'snack'];
const SERVINGS_OPTIONS = [1, 1.5, 2];
const MIN_DISHES_PER_DAY = 3;
const MAX_DISHES_PER_DAY = 6;

function servingsValue(raw) {
  const n = Number(raw);
  return SERVINGS_OPTIONS.includes(n) ? n : 1;
}

// Some recipes reference what's really the same shopping-list item under
// slightly different names (e.g. "Cooked chicken breast" vs "Chicken
// breast", "Greek yogurt (0%)" vs "Greek yogurt"). Grouping the grocery list
// by a normalized key — stripping parenthetical qualifiers and a leading
// "cooked " — merges those into one line so the list stays genuinely
// optimized instead of splitting one ingredient across two rows.
function groceryKey(name) {
  return name
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/^\s*cooked\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Each day/slot now holds an array of dishes (`${slot}Dishes`), each with its
// own serving multiplier — letting a plan reach the calorie target by adding
// more dishes to a meal, scaling portions, or both, instead of being capped
// at one fixed-size recipe per slot.
function buildGroceryList(days, family, meals) {
  const groceries = {};
  const addIngredients = (recipe, multiplier) => {
    if (!recipe) return;
    recipe.ingredients.forEach((ing) => {
      const key = groceryKey(ing.n);
      if (!groceries[key]) groceries[key] = { qty: 0, unit: ing.u, cat: ing.cat };
      groceries[key].qty += ing.q * family * multiplier;
    });
  };
  days.forEach((row) => {
    meals.forEach((slot) => {
      (row[`${slot}Dishes`] || []).forEach((dish) => {
        addIngredients(findRecipe(dish.id), dish.servings || 1);
      });
    });
  });
  return groceries;
}

function buildNutritionAndCost(days, family, meals) {
  let totalCost = 0;
  let totalProtein = 0;
  let totalCal = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  const usedRecipeIds = new Set();

  const addRecipe = (recipe, multiplier) => {
    if (!recipe) return;
    totalCost += recipe.cost * family * multiplier;
    totalProtein += recipe.protein * multiplier;
    totalCal += recipe.cal * multiplier;
    totalCarbs += recipe.carbs * multiplier;
    totalFat += recipe.fat * multiplier;
    usedRecipeIds.add(recipe.id);
  };

  days.forEach((row) => {
    meals.forEach((slot) => {
      (row[`${slot}Dishes`] || []).forEach((dish) => {
        addRecipe(findRecipe(dish.id), dish.servings || 1);
      });
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
    const { goal, proteinTarget, calorieTarget, budget, maxTime, family, diets, meals, dishesPerDay } = body;

    if (!goal || !proteinTarget || !calorieTarget || !budget || !maxTime || !family) {
      return NextResponse.json({ error: 'Missing required plan inputs.' }, { status: 400 });
    }

    const mealSlots = Array.isArray(meals) && meals.length ? meals.filter((m) => MEAL_SLOTS.includes(m)) : MEAL_SLOTS;
    if (!mealSlots.length) {
      return NextResponse.json({ error: 'Select at least one meal type to include.' }, { status: 400 });
    }

    const rawDishes = Number(dishesPerDay);
    const totalDishes = Number.isFinite(rawDishes) && rawDishes > 0
      ? Math.min(MAX_DISHES_PER_DAY, Math.max(MIN_DISHES_PER_DAY, Math.round(rawDishes)))
      : Math.max(MIN_DISHES_PER_DAY, mealSlots.length);

    const aiResult = await generateWeeklyPlan({
      goal,
      proteinTarget,
      calorieTarget,
      budget,
      maxTime,
      family,
      diets: Array.isArray(diets) ? diets : [],
      isPremium: profile.is_premium,
      meals: mealSlots,
      dishesPerDay: totalDishes,
    });

    // Validate + hydrate: the model only returns ids, we look up the real
    // recipe objects so nutrition/cost/instructions are never hallucinated.
    // The premium check here is defense-in-depth — the model was never shown
    // Premium recipe ids for a free user, but we double-check anyway in case
    // it somehow guessed one. We also drop any duplicate id within the same
    // slot/day, since the model is asked not to repeat but we don't rely on it.
    const resolveRecipe = (id) => {
      const recipe = findRecipe(id);
      if (!recipe) return null;
      if (recipe.premium && !profile.is_premium) return null;
      return recipe.id;
    };

    const days = aiResult.days.map((row, i) => {
      const dayRow = { day: row.day || DAYS[i] };
      mealSlots.forEach((slot) => {
        const rawSlotDishes = Array.isArray(row[`${slot}Dishes`]) ? row[`${slot}Dishes`] : [];
        const seen = new Set();
        const resolved = [];
        rawSlotDishes.forEach((d) => {
          const id = resolveRecipe(d && d.id);
          if (!id || seen.has(id)) return;
          seen.add(id);
          resolved.push({ id, servings: servingsValue(d && d.servings) });
        });
        dayRow[`${slot}Dishes`] = resolved;
      });
      return dayRow;
    });

    const groceries = buildGroceryList(days, family, mealSlots);
    const stats = buildNutritionAndCost(days, family, mealSlots);

    await admin
      .from('profiles')
      .update({ plans_generated_this_month: profile.plans_generated_this_month + 1 })
      .eq('id', user.id);

    await admin.from('saved_plans').insert({
      user_id: user.id,
      inputs: { goal, proteinTarget, calorieTarget, budget, maxTime, family, diets, meals: mealSlots, dishesPerDay: totalDishes },
      plan_days: days,
      coach_note: aiResult.coachNote,
    });

    return NextResponse.json({
      days,
      meals: mealSlots,
      dishesPerDay: totalDishes,
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
