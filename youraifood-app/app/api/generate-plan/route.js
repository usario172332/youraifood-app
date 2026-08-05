import { NextResponse } from 'next/server';
import { getUserFromToken, supabaseAdmin } from '../../../lib/supabaseAdmin';
import { generateWeeklyPlan } from '../../../lib/anthropic';
import { findRecipe, DAYS } from '../../../lib/recipes';

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
const SERVINGS_OPTIONS = [1, 1.5, 2];
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

await getOrCreateProfile(admin, user);

const body = await req.json();
const { goal, proteinTarget, calorieTarget, budgetLevel, maxTime, family, diets, meals, dishesPerDay, avoidMeats, avoidIngredients, minimiseIngredients } = body;

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

const groceries = buildGroceryList(days, family, mealSlots);
const stats = buildNutritionAndCost(days, family, mealSlots);

await admin.from('saved_plans').insert({
user_id: user.id,
inputs: { goal, proteinTarget, calorieTarget, budgetLevel, maxTime, family, diets, meals: mealSlots, dishesPerDay: totalDishes, avoidMeats: safeAvoidMeats, avoidIngredients: safeAvoidIngredients, minimiseIngredients: !!minimiseIngredients },
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
