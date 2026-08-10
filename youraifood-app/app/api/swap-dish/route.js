import { NextResponse } from 'next/server';
import { getUserFromToken, supabaseAdmin } from '../../../lib/supabaseAdmin';
import { findRecipe, catalogForPrompt } from '../../../lib/recipes';

// Swaps a single dish within a single day of an already-generated plan.
// Unlike /api/regenerate-day (which calls the AI to rebuild a whole day and
// counts against the free monthly plan limit), this is a fast, deterministic,
// non-AI operation: pick a different recipe for the same meal slot from the
// same avoid-meat/avoid-ingredient-filtered catalog used at generation time,
// then re-run the existing calorie/protein correction passes (scoped to just
// this one day) so the day still hits the user's targets. Doesn't touch
// plans_generated_this_month, since no new plan is being generated.

const MEAL_SLOTS = ['breakfast', 'main', 'snack'];
const SERVINGS_OPTIONS = [1, 1.25, 1.5, 1.75, 2, 2.5, 3];
const SLOT_TO_MEAL = { breakfast: 'Breakfast', main: 'Lunch & Dinner', snack: 'Snack' };
const MAX_DISHES_PER_DAY = 6;
const MEAT_CATEGORY_VALUES = ['poultry', 'redMeat', 'fish'];
const AVOID_INGREDIENT_VALUES = ['nuts', 'mushrooms', 'shellfish', 'fish', 'dairy', 'eggs', 'soy'];

function nextServing(s) {
  const idx = SERVINGS_OPTIONS.indexOf(s);
  if (idx === -1 || idx === SERVINGS_OPTIONS.length - 1) return null;
  return SERVINGS_OPTIONS[idx + 1];
}

// Same day-scoped calorie top-up as generate-plan's enforceCalorieTarget,
// just always called with a single-day array from this route.
function enforceCalorieTarget(days, meals, calorieTarget, catalog, maxTime, diets) {
  const threshold = calorieTarget * 0.9;
  const requiredDiets = Array.isArray(diets) ? diets.filter(Boolean) : [];
  const timeLimit = Number(maxTime);
  const slotPriority = ['main', 'breakfast', 'snack'];
  days.forEach((dayRow) => {
    const dishRefs = [];
    meals.forEach((slot) => {
      (dayRow[`${slot}Dishes`] || []).forEach((dish) => {
        const recipe = findRecipe(dish.id);
        if (recipe) dishRefs.push({ dish, recipe, slot });
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
      if (candidate) {
        const before = candidate.dish.servings;
        const after = nextServing(before);
        total += candidate.recipe.cal * (after - before);
        candidate.dish.servings = after;
        continue;
      }

      if (!Array.isArray(catalog) || !catalog.length || dishRefs.length >= MAX_DISHES_PER_DAY) break;

      const usedIds = new Set(dishRefs.map((r) => r.recipe.id));
      let added = null;
      for (const slot of slotPriority) {
        if (!meals.includes(slot)) continue;
        const slotMeal = SLOT_TO_MEAL[slot];
        const options = catalog
          .filter((r) => r.meal === slotMeal)
          .filter((r) => !usedIds.has(r.id))
          .filter((r) => !Number.isFinite(timeLimit) || timeLimit <= 0 || r.time <= timeLimit)
          .filter((r) => {
            if (!requiredDiets.length) return true;
            const rd = Array.isArray(r.diets) ? r.diets : [];
            return requiredDiets.every((d) => rd.includes(d));
          })
          .sort((a, b) => b.cal - a.cal);
        if (options.length) {
          added = { slot, recipe: options[0] };
          break;
        }
      }
      if (!added) break;

      const newRecipe = findRecipe(added.recipe.id);
      if (!newRecipe) break;
      const newDish = { id: newRecipe.id, servings: 1 };
      dayRow[`${added.slot}Dishes`] = [...(dayRow[`${added.slot}Dishes`] || []), newDish];
      dishRefs.push({ dish: newDish, recipe: newRecipe, slot: added.slot });
      total += newRecipe.cal;
    }
  });
}

function bestServingsCombo(dishRefs, proteinTarget, calFloor, calorieTarget, proteinTolerance, calCeiling) {
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
    const shortfall = Math.max(0, calFloor - cal);
    const proteinDev = Math.abs(protein - proteinTarget);
    const calDev = Math.abs(cal - calorieTarget);
    const inTolerance = Number.isFinite(proteinTolerance) && proteinDev < proteinTolerance && (!Number.isFinite(calCeiling) || cal <= calCeiling) && cal >= calFloor;
    const score = inTolerance ? (calDev - 1000000) : (proteinDev * 10 + calDev + shortfall * 50);
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
  const calCeiling = calorieTarget * 1.2;
  const requiredDiets = Array.isArray(diets) ? diets.filter(Boolean) : [];
  const timeLimit = Number(maxTime);
  const slotOrder = ['main', 'breakfast', 'snack'];

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

    const fit = bestServingsCombo(dishRefs, proteinTarget, calFloor, calorieTarget, tolerance, calCeiling);
    if (fit) {
      dishRefs.forEach(({ dish }, i) => {
        dish.servings = fit.combo[i];
      });
    }

    if (Math.abs(proteinOf() - proteinTarget) < tolerance) return;
    if (!Array.isArray(catalog) || !catalog.length) return;

    const maxAttempts = dishRefs.length * 3 + MAX_DISHES_PER_DAY;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const protein = proteinOf();
      const dev = protein - proteinTarget;
      if (Math.abs(dev) < tolerance) break;

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

      let acted = false;
      if (candidates.length) {
        const targetDensity = target.recipe.protein / target.recipe.cal;
        candidates.sort((a, b) => {
          const da = a.protein / a.cal;
          const db = b.protein / b.cal;
          return dev > 0 ? da - db : db - da;
        });
        const replacement = candidates[0];
        const replacementDensity = replacement.protein / replacement.cal;
        const improves = dev > 0 ? replacementDensity < targetDensity : replacementDensity > targetDensity;
        if (improves) {
          const newRecipe = findRecipe(replacement.id);
          if (newRecipe) {
            target.dish.id = newRecipe.id;
            target.recipe = newRecipe;
            target.dish.servings = 1;
            const refit = bestServingsCombo(dishRefs, proteinTarget, calFloor, calorieTarget, tolerance, calCeiling);
            if (refit) {
              dishRefs.forEach(({ dish }, i) => {
                dish.servings = refit.combo[i];
              });
            }
            acted = true;
          }
        }
      }

      if (!acted && dev < 0 && dishRefs.length < MAX_DISHES_PER_DAY) {
        const baseFit = bestServingsCombo(dishRefs, proteinTarget, calFloor, calorieTarget, tolerance, calCeiling);
        const baseScore = baseFit ? baseFit.score : Infinity;
        let bestOption = null;
        for (const slot of slotOrder) {
          if (!meals.includes(slot)) continue;
          const slotMeal2 = SLOT_TO_MEAL[slot];
          const options = catalog
            .filter((r) => r.meal === slotMeal2)
            .filter((r) => !usedIds.has(r.id))
            .filter((r) => !Number.isFinite(timeLimit) || timeLimit <= 0 || r.time <= timeLimit)
            .filter((r) => {
              if (!requiredDiets.length) return true;
              const rd = Array.isArray(r.diets) ? r.diets : [];
              return requiredDiets.every((d) => rd.includes(d));
            })
            .sort((a, b) => (b.protein / b.cal) - (a.protein / a.cal));
          const candidateRecipe = options[0];
          if (!candidateRecipe) continue;
          const newRecipeForTrial = findRecipe(candidateRecipe.id);
          if (!newRecipeForTrial) continue;
          const trialRefs = [...dishRefs, { dish: { id: newRecipeForTrial.id, servings: 1 }, recipe: newRecipeForTrial, slot }];
          const trialFit = bestServingsCombo(trialRefs, proteinTarget, calFloor, calorieTarget, tolerance, calCeiling);
          if (trialFit && (!bestOption || trialFit.score < bestOption.fit.score)) {
            bestOption = { slot, recipe: newRecipeForTrial, fit: trialFit };
          }
        }
        if (bestOption && bestOption.fit.score < baseScore) {
          const newDish = { id: bestOption.recipe.id, servings: 1 };
          dayRow[`${bestOption.slot}Dishes`] = [...(dayRow[`${bestOption.slot}Dishes`] || []), newDish];
          dishRefs.push({ dish: newDish, recipe: bestOption.recipe, slot: bestOption.slot });
          dishRefs.forEach(({ dish }, i) => {
            dish.servings = bestOption.fit.combo[i];
          });
          acted = true;
        }
      }

      if (!acted) break;
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
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
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

async function getOrCreateProfile(admin, user) {
  const { data: existing } = await admin.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (existing) return existing;
  function currentMonthKey(date = new Date()) {
    return `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
  }
  const { data: created, error } = await admin
    .from('profiles')
    .insert({ id: user.id, email: user.email, is_premium: false, plans_generated_this_month: 0, usage_month: currentMonthKey() })
    .select('*')
    .single();
  if (error) throw error;
  return created;
}

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Sign in to swap a dish.' }, { status: 401 });
    }

    const admin = supabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Supabase is not configured on the server yet.' }, { status: 500 });
    }

    const profile = await getOrCreateProfile(admin, user);
    const isPremium = !!profile.is_premium;

    const body = await req.json();
    const {
      days, dayIndex, slot, dishId,
      goal, proteinTarget, calorieTarget, budgetLevel, maxTime, family, diets, meals,
      avoidMeats, avoidIngredients, minimiseIngredients,
    } = body;

    if (!Array.isArray(days) || dayIndex == null || !days[dayIndex]) {
      return NextResponse.json({ error: 'Missing plan context for this swap.' }, { status: 400 });
    }
    if (!MEAL_SLOTS.includes(slot)) {
      return NextResponse.json({ error: 'Unknown meal slot.' }, { status: 400 });
    }
    if (!dishId) {
      return NextResponse.json({ error: 'Missing dish to swap.' }, { status: 400 });
    }
    if (!goal || !proteinTarget || !calorieTarget || !budgetLevel || !maxTime || !family) {
      return NextResponse.json({ error: 'Missing required plan inputs.' }, { status: 400 });
    }

    const mealSlots = Array.isArray(meals) && meals.length ? meals.filter((m) => MEAL_SLOTS.includes(m)) : MEAL_SLOTS;
    const safeAvoidMeats = Array.isArray(avoidMeats) ? avoidMeats.filter((m) => MEAT_CATEGORY_VALUES.includes(m)) : [];
    const safeAvoidIngredients = Array.isArray(avoidIngredients) ? avoidIngredients.filter((m) => AVOID_INGREDIENT_VALUES.includes(m)) : [];

    // Deep-clone just the target day so we don't mutate the caller's array in place.
    const dayRow = JSON.parse(JSON.stringify(days[dayIndex]));
    const slotDishes = Array.isArray(dayRow[`${slot}Dishes`]) ? dayRow[`${slot}Dishes`] : [];
    const dishIdx = slotDishes.findIndex((d) => d.id === dishId);
    if (dishIdx === -1) {
      return NextResponse.json({ error: 'That dish is no longer part of this day — try refreshing your plan.' }, { status: 400 });
    }

    // Catalog already filters out premium recipes for free users and any
    // recipe matching an avoided meat category or avoided ingredient — the
    // same function used to build the swap-candidate pool during generation.
    const catalog = catalogForPrompt(isPremium, safeAvoidMeats, safeAvoidIngredients, false);
    const slotMeal = SLOT_TO_MEAL[slot];
    const timeLimit = Number(maxTime);
    const requiredDiets = Array.isArray(diets) ? diets.filter(Boolean) : [];

    // Never suggest a recipe already used elsewhere that day (including the
    // dish being replaced, which is naturally excluded this way too).
    const usedIdsToday = new Set();
    mealSlots.forEach((s) => (dayRow[`${s}Dishes`] || []).forEach((d) => usedIdsToday.add(d.id)));

    const candidates = catalog
      .filter((r) => r.meal === slotMeal)
      .filter((r) => !usedIdsToday.has(r.id))
      .filter((r) => !Number.isFinite(timeLimit) || timeLimit <= 0 || r.time <= timeLimit)
      .filter((r) => {
        if (!requiredDiets.length) return true;
        const rd = Array.isArray(r.diets) ? r.diets : [];
        return requiredDiets.every((d) => rd.includes(d));
      });

    if (!candidates.length) {
      return NextResponse.json(
        { error: 'No alternative dish is available for this meal right now — try relaxing your cook-time limit or dietary filters.' },
        { status: 400 }
      );
    }

    const replacement = candidates[Math.floor(Math.random() * candidates.length)];
    const newRecipe = findRecipe(replacement.id);
    if (!newRecipe) {
      return NextResponse.json({ error: 'Something went wrong picking a replacement dish.' }, { status: 500 });
    }

    slotDishes[dishIdx] = { id: newRecipe.id, servings: 1 };
    dayRow[`${slot}Dishes`] = [...slotDishes];

    // Re-run the same day-scoped calorie/protein correction passes used
    // during generation, so swapping a dish doesn't knock the day off target.
    enforceCalorieTarget([dayRow], mealSlots, calorieTarget, catalog, maxTime, diets);
    enforceProteinTarget([dayRow], mealSlots, proteinTarget, calorieTarget, goal, catalog, maxTime, diets);

    const updatedDays = days.map((row, i) => (i === dayIndex ? dayRow : row));
    const groceries = buildGroceryList(updatedDays, family, mealSlots);
    const stats = buildNutritionAndCost(updatedDays, family, mealSlots);

    return NextResponse.json({ day: dayRow, days: updatedDays, groceries, stats });
  } catch (err) {
    console.error('swap-dish error:', err);
    return NextResponse.json({ error: err.message || 'Something went wrong.' }, { status: 500 });
  }
}
