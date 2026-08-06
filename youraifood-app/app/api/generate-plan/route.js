import { NextResponse } from 'next/server';
import { getUserFromToken, supabaseAdmin } from '../../../lib/supabaseAdmin';
import { generateWeeklyPlan } from '../../../lib/anthropic';
import { findRecipe, DAYS, catalogForPrompt } from '../../../lib/recipes';

// The Claude call can take 15-20+ seconds; Vercel's default function
// timeout is shorter than that, so this must be set explicitly.
export const maxDuration = 60;

const FREE_MONTHLY_LIMIT = 3;

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
const SERVINGS_OPTIONS = [1, 1.25, 1.5, 1.75, 2];
const SLOT_TO_MEAL = { breakfast: 'Breakfast', main: 'Lunch & Dinner', snack: 'Snack' };
const MIN_DISHES_PER_DAY = 3;
const MAX_DISHES_PER_DAY = 6;
const MEAT_CATEGORY_VALUES = ['poultry', 'redMeat', 'fish'];
const AVOID_INGREDIENT_VALUES = ['nuts', 'mushrooms', 'shellfish', 'fish', 'dairy', 'eggs', 'soy'];

function servingsValue(raw) {
const n = Number(raw);
return SERVINGS_OPTIONS.includes(n) ? n : 1;
}

function nextServing(s) {
const idx = SERVINGS_OPTIONS.indexOf(s);
if (idx === -1 || idx === SERVINGS_OPTIONS.length - 1) return null;
return SERVINGS_OPTIONS[idx + 1];
}

function enforceCalorieTarget(days, meals, calorieTarget) {
const threshold = calorieTarget * 0.9;
days.forEach((dayRow) => {
const dishRefs = [];
meals.forEach((slot) => {
(dayRow[`${slot}Dishes`] || []).forEach((dish) => {
const recipe = findRecipe(dish.id);
if (recipe) dishRefs.push({ dish, recipe });
});
});
if (!dishRefs.length) return;

let total = dishRefs.reduce((sum, { dish, recipe }) => sum + recipe.cal * dish.servings, 0);
if (total >= threshold) return;

let guard = 0;
while (total < threshold && guard < 50) {
guard += 1;
const candidate = dishRefs
.filter(({ dish }) => nextServing(dish.servings) !== null)
.sort((a, b) => a.dish.servings - b.dish.servings)[0];
if (!candidate) break;
const before = candidate.dish.servings;
const after = nextServing(before);
total += candidate.recipe.cal * (after - before);
candidate.dish.servings = after;
}
});
}

function bestServingsCombo(dishRefs, proteinTarget, calFloor, calorieTarget) {
  const n = dishRefs.length;
  const combos = Math.pow(SERVINGS_OPTIONS.length, n);
  if (combos > 200000) return null;

  let best = null;
  for (let idx = 0; idx < combos; idx++) {
    let rem = idx;
    const combo = new Array(n);
    for (let i = 0; i < n; i++) {
      combo[i] = SERVINGS_OPTIONS[rem % SERVINGS_OPTIONS.length];
      rem = Math.floor(rem / SERVINGS_OPTIONS.length);
    }
    let protein = 0;
    let cal = 0;
    for (let i = 0; i < n; i++) {
      protein += dishRefs[i].recipe.protein * combo[i];
      cal += dishRefs[i].recipe.cal * combo[i];
    }
    if (cal < calFloor) continue;
    const proteinDev = Math.abs(protein - proteinTarget);
    const calDev = Math.abs(cal - calorieTarget);
    const score = proteinDev * 10 + calDev;
    if (!best || score < best.score) {
      best = { score, combo, protein, cal };
    }
  }
  return best;
}

function enforceProteinTarget(days, meals, proteinTarget, calorieTarget, goal, catalog, maxTime, diets) {
  if (!proteinTarget || !calorieTarget || goal === 'muscle') return;
  const tolerance = proteinTarget * 0.05;
  const calFloor = calorieTarget * 0.9;
  const requiredDiets = Array.isArray(diets) ? diets.filter(Boolean) : [];
  const timeLimit = Number(maxTime);

  days.forEach((dayRow) => {
    const dishRefs = [];
    meals.forEach((slot) => {
      (dayRow[`${slot}Dishes`] || []).forEach((dish) => {
        const recipe = findRecipe(dish.id);
        if (recipe) dishRefs.push({ dish, recipe, slot });
      });
    });
    if (!dishRefs.length) return;

    const proteinOf = () => dishRefs.reduce((sum, { dish, recipe }) => sum + recipe.protein * dish.servings, 0);

    if (Math.abs(proteinOf() - proteinTarget) <= tolerance) return;

    const fit = bestServingsCombo(dishRefs, proteinTarget, calFloor, calorieTarget);
    if (fit) {
      dishRefs.forEach(({ dish }, i) => {
        dish.servings = fit.combo[i];
      });
    }

    if (Math.abs(proteinOf() - proteinTarget) <= tolerance) return;
    if (!Array.isArray(catalog) || !catalog.length) return;

    const maxAttempts = dishRefs.length * 3;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const protein = proteinOf();
      const dev = protein - proteinTarget;
      if (Math.abs(dev) <= tolerance) break;

      const sorted = [...dishRefs].sort((a, b) => {
        const da = a.recipe.protein / a.recipe.cal;
        const db = b.recipe.protein / b.recipe.cal;
        return dev > 0 ? db - da : da - db;
      });
      const target = sorted[0];
      const usedIds = new Set(dishRefs.map((r) => r.recipe.id));
      const slotMeal = SLOT_TO_MEAL[target.slot];

      const candidates = catalog.filter((r) => {
        if (r.meal !== slotMeal) return false;
        if (usedIds.has(r.id)) return false;
        if (Number.isFinite(timeLimit) && timeLimit > 0 && r.time > timeLimit) return false;
        if (requiredDiets.length) {
          const rd = Array.isArray(r.diets) ? r.diets : [];
          if (!requiredDiets.every((d) => rd.includes(d))) return false;
        }
        return true;
      });
      if (!candidates.length) break;

      const targetDensity = target.recipe.protein / target.recipe.cal;
      candidates.sort((a, b) => {
        const da = a.protein / a.cal;
        const db = b.protein / b.cal;
        return dev > 0 ? da - db : db - da;
      });
      const replacement = candidates[0];
      const replacementDensity = replacement.protein / replacement.cal;
      if (dev > 0 && replacementDensity >= targetDensity) break;
      if (dev < 0 && replacementDensity <= targetDensity) break;

      const newRecipe = findRecipe(replacement.id);
      if (!newRecipe) break;
      target.dish.id = newRecipe.id;
      target.recipe = newRecipe;
      target.dish.servings = 1;

      const refit = bestServingsCombo(dishRefs, proteinTarget, calFloor, calorieTarget);
      if (refit) {
        dishRefs.forEach(({ dish }, i) => {
          dish.servings = refit.combo[i];
        });
      }
    }
  });
}
const PLURAL_TO_SINGULAR = {
  'Bell peppers': 'Bell pepper',
  'Carrots': 'Carrot',
  'Egg whites': 'Egg white',
  'Soft-boiled eggs': 'Soft-boiled egg',
  'Sundried tomatoes': 'Sundried tomato',
  'Tomatoes': 'Tomato',
};

function groceryKey(name) {
  const cleaned = name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\bchili\b/gi, 'chilli')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/^\s*(cooked|grilled|roasted|baked|sliced|diced|chopped|shredded|steamed|boiled|minced|grated)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  const titled = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  if (titled === 'Eggs') return 'Egg';
  return PLURAL_TO_SINGULAR[titled] || titled;
}

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
avgProtein: Math.round(totalProtein / days.length),
avgCal: Math.round(totalCal / days.length),
avgCarbs: Math.round(totalCarbs / days.length),
avgFat: Math.round(totalFat / days.length),
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

await getOrCreateProfile(admin, user);

const body = await req.json();
const { goal, proteinTarget, calorieTarget, budgetLevel, maxTime, family, diets, meals, dishesPerDay, avoidMeats, avoidIngredients, minimiseIngredients, numDays } = body;
const safeNumDays = [1, 3, 5, 7].includes(Number(numDays)) ? Number(numDays) : 7;

if (!goal || !proteinTarget || !calorieTarget || !budgetLevel || !maxTime || !family) {
return NextResponse.json({ error: 'Missing required plan inputs.' }, { status: 400 });
}

const mealSlots = Array.isArray(meals) && meals.length ? meals.filter((m) => MEAL_SLOTS.includes(m)) : MEAL_SLOTS;
if (!mealSlots.length) {
return NextResponse.json({ error: 'Select at least one meal type to include.' }, { status: 400 });
}

const safeAvoidMeats = Array.isArray(avoidMeats) ? avoidMeats.filter((m) => MEAT_CATEGORY_VALUES.includes(m)) : [];
const safeAvoidIngredients = Array.isArray(avoidIngredients) ? avoidIngredients.filter((m) => AVOID_INGREDIENT_VALUES.includes(m)) : [];

const { data: claimRows, error: claimError } = await admin.rpc('claim_free_plan_slot', {
p_user_id: user.id,
p_limit: FREE_MONTHLY_LIMIT,
p_month: currentMonthKey(),
});
if (claimError) throw claimError;
const claim = Array.isArray(claimRows) ? claimRows[0] : claimRows;

if (!claim || !claim.allowed) {
return NextResponse.json(
{
error: `You've used all ${FREE_MONTHLY_LIMIT} free plans this month. Upgrade to Premium for unlimited plans.`,
limitReached: true,
},
{ status: 402 }
);
}

const isPremium = claim.is_premium;

const rawDishes = Number(dishesPerDay);
const totalDishes = Number.isFinite(rawDishes) && rawDishes > 0
? Math.min(MAX_DISHES_PER_DAY, Math.max(MIN_DISHES_PER_DAY, Math.round(rawDishes)))
: Math.max(MIN_DISHES_PER_DAY, mealSlots.length);

const aiResult = await generateWeeklyPlan({
goal,
proteinTarget,
calorieTarget,
budgetLevel,
maxTime,
family,
diets: Array.isArray(diets) ? diets : [],
isPremium,
meals: mealSlots,
dishesPerDay: totalDishes,
avoidMeats: safeAvoidMeats,
avoidIngredients: safeAvoidIngredients,
minimiseIngredients: !!minimiseIngredients,
numDays: safeNumDays,
});

const resolveRecipe = (id) => {
const recipe = findRecipe(id);
if (!recipe) return null;
if (recipe.premium && !isPremium) return null;
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

enforceCalorieTarget(days, mealSlots, calorieTarget);
const swapCatalog = catalogForPrompt(isPremium, safeAvoidMeats, safeAvoidIngredients, false);
enforceProteinTarget(days, mealSlots, proteinTarget, calorieTarget, goal, swapCatalog, maxTime, diets);

const groceries = buildGroceryList(days, family, mealSlots);
const stats = buildNutritionAndCost(days, family, mealSlots);

await admin.from('saved_plans').insert({
user_id: user.id,
inputs: { goal, proteinTarget, calorieTarget, budgetLevel, maxTime, family, diets, meals: mealSlots, dishesPerDay: totalDishes, avoidMeats: safeAvoidMeats, avoidIngredients: safeAvoidIngredients, minimiseIngredients: !!minimiseIngredients, numDays: safeNumDays },
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
used: claim.plans_generated_this_month,
limit: isPremium ? null : FREE_MONTHLY_LIMIT,
isPremium,
},
});
} catch (err) {
console.error('generate-plan error:', err);
return NextResponse.json({ error: err.message || 'Something went wrong.' }, { status: 500 });
}
}
