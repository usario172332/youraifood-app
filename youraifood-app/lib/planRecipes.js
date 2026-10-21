// Shared plan math used by the "Add to Meal Plan" flow, the PDF export and the
// profile page. A plan dish is { id, servings } for curated recipes, or
// { id: 'ai:<uuid>', servings, snapshot } for AI-generated recipes. The
// snapshot is embedded in the plan so deleting the saved recipe never changes
// or breaks an existing plan (historical accuracy).
//
// groceryKey() mirrors the normalisation in app/api/generate-plan/route.js so
// AI ingredients merge with curated-recipe ingredients on the same list.

import { findRecipe } from './recipes';
import { INGREDIENTS } from './ingredientNutrition';

export const PLAN_MEAL_SLOTS = ['breakfast', 'main', 'snack'];
export const PLAN_PORTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];

const PLURAL_TO_SINGULAR = {
  'Bell peppers': 'Bell pepper',
  Carrots: 'Carrot',
  'Egg whites': 'Egg white',
  'Soft-boiled eggs': 'Soft-boiled egg',
  'Sundried tomatoes': 'Sundried tomato',
  Tomatoes: 'Tomato',
};

export function groceryKey(name) {
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

const SPICE_KEYS = new Set(['salt', 'black_pepper', 'paprika', 'cumin', 'oregano_dried', 'chilli_flakes', 'turmeric', 'cinnamon', 'garlic_powder', 'curry_powder', 'basil_fresh', 'parsley_fresh', 'coriander_fresh', 'ginger']);
const PRODUCE_KEYS = new Set(['broccoli', 'spinach', 'kale', 'bell_pepper', 'onion', 'garlic', 'tomato', 'cucumber', 'carrot', 'courgette', 'aubergine', 'mushrooms', 'spring_onion', 'cauliflower', 'green_beans', 'asparagus', 'avocado', 'banana', 'apple', 'blueberries', 'strawberries', 'raspberries', 'mango', 'dates_medjool', 'lemon_juice', 'lime_juice', 'potato_raw', 'sweet_potato_raw']);
const PROTEIN_EXTRA = new Set(['whey_protein', 'tofu_firm', 'tempeh']);

export function categoryForKey(key) {
  const it = INGREDIENTS[key];
  if (!it) return 'Pantry';
  if (SPICE_KEYS.has(key)) return 'Spices';
  if (PRODUCE_KEYS.has(key)) return 'Produce';
  if (PROTEIN_EXTRA.has(key) || it.tags.some((t) => ['meat', 'poultry', 'fish', 'shellfish', 'egg'].includes(t))) return 'Protein';
  if (it.tags.includes('dairy') || key === 'almond_drink' || key === 'oat_drink') return 'Dairy/Alt';
  return 'Pantry';
}

// Builds the snapshot stored inside a plan dish from a saved/generated AI
// recipe ({ recipe fields, nutrition }). Values are PER SINGLE SERVING so the
// plan's `servings` multiplier works exactly like it does for curated recipes.
export function buildSnapshot(savedId, recipeJson) {
  const r = recipeJson;
  const n = recipeJson.nutrition?.perServing || {};
  const base = r.servings || 1;
  return {
    id: `ai:${savedId}`,
    ai: true,
    name: r.title,
    meal: r.mealType || 'Any',
    diets: (r.dietaryTags || []).map((t) => t.toLowerCase()),
    time: r.totalMinutes || 0,
    cost: 0,
    cal: n.kcal || 0,
    protein: n.protein || 0,
    carbs: n.carbs || 0,
    fat: n.fat || 0,
    image: null,
    ingredients: (r.ingredients || []).map((i) => ({
      n: i.name,
      q: Math.round((i.grams / base) * 10) / 10,
      u: 'g',
      cat: categoryForKey(i.key),
    })),
    steps: r.instructions || [],
  };
}

// Resolves a plan dish to a recipe object (curated or AI snapshot), or null.
export function resolveDish(dish) {
  if (!dish) return null;
  const curated = findRecipe(dish.id);
  if (curated) return curated;
  if (dish.snapshot && typeof dish.snapshot === 'object') return dish.snapshot;
  return null;
}

export function dayTotals(row, mealSlots = PLAN_MEAL_SLOTS) {
  const t = { cal: 0, protein: 0, carbs: 0, fat: 0 };
  mealSlots.forEach((slot) => {
    (row[`${slot}Dishes`] || []).forEach((d) => {
      const r = resolveDish(d);
      if (!r) return;
      const s = d.servings || 1;
      t.cal += r.cal * s; t.protein += r.protein * s; t.carbs += r.carbs * s; t.fat += r.fat * s;
    });
  });
  return { cal: Math.round(t.cal), protein: Math.round(t.protein), carbs: Math.round(t.carbs), fat: Math.round(t.fat) };
}

export function weekStats(days, mealSlots = PLAN_MEAL_SLOTS) {
  const totals = days.map((d) => dayTotals(d, mealSlots));
  const n = days.length || 1;
  const avg = (k) => Math.round(totals.reduce((s, t) => s + t[k], 0) / n);
  const ids = new Set();
  days.forEach((row) => mealSlots.forEach((slot) => (row[`${slot}Dishes`] || []).forEach((d) => { if (resolveDish(d)) ids.add(d.id); })));
  return { avgCal: avg('cal'), avgProtein: avg('protein'), avgCarbs: avg('carbs'), avgFat: avg('fat'), distinctRecipes: ids.size, perDay: totals };
}

export function buildGroceryList(days, family = 1, mealSlots = PLAN_MEAL_SLOTS) {
  const groceries = {};
  days.forEach((row) => {
    mealSlots.forEach((slot) => {
      (row[`${slot}Dishes`] || []).forEach((dish) => {
        const recipe = resolveDish(dish);
        if (!recipe) return;
        const mult = (dish.servings || 1) * family;
        recipe.ingredients.forEach((ing) => {
          let key = groceryKey(ing.n);
          // Never add quantities in different units under one name.
          if (groceries[key] && groceries[key].unit !== ing.u) key = `${key} (${ing.u})`;
          if (!groceries[key]) groceries[key] = { qty: 0, unit: ing.u, cat: ing.cat };
          groceries[key].qty += ing.q * mult;
        });
      });
    });
  });
  return groceries;
}

// Adds (or replaces) a dish in a copy of the plan days. Pure.
export function applyDishToPlan(days, { dayIndex, slot, replaceDishId = null, dish }) {
  if (!PLAN_MEAL_SLOTS.includes(slot)) throw new Error('Invalid meal slot.');
  if (!Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex >= days.length) throw new Error('Invalid day.');
  const next = days.map((row) => ({ ...row }));
  const key = `${slot}Dishes`;
  const current = Array.isArray(next[dayIndex][key]) ? [...next[dayIndex][key]] : [];
  if (replaceDishId) {
    const idx = current.findIndex((d) => d.id === replaceDishId);
    if (idx === -1) throw new Error('The dish you are replacing is no longer in that slot.');
    current.splice(idx, 1, dish);
    // avoid duplicate entries of the same recipe in one slot
    next[dayIndex][key] = current.filter((d, i) => i === idx || d.id !== dish.id);
  } else {
    next[dayIndex][key] = [...current.filter((d) => d.id !== dish.id), dish];
  }
  return next;
}
