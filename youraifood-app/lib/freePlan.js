import { findRecipe } from './recipes';

// A curated 7-day high-protein plan used to instantly deliver the homepage
// "Free 7-Day High-Protein Meal Plan" lead magnet (no email-sending backend
// yet, so we hand over a PDF immediately instead of promising one by email).
// Reuses the same real, live recipe IDs as the homepage sample plan, so
// every number in the generated PDF is accurate — nothing invented.
const FREE_PLAN_DAYS = [
  {
    day: 'Monday',
    breakfastDishes: [{ id: 'nb50', servings: 1 }],
    mainDishes: [{ id: 'nr1', servings: 1 }, { id: 'nr19', servings: 1 }],
    snackDishes: [{ id: 'ps1', servings: 1 }],
  },
  {
    day: 'Tuesday',
    breakfastDishes: [{ id: 'nb46', servings: 1.5 }],
    mainDishes: [{ id: 'nr16', servings: 1 }, { id: 'nr36', servings: 1 }],
    snackDishes: [{ id: 'ps2', servings: 1 }],
  },
  {
    day: 'Wednesday',
    breakfastDishes: [{ id: 'nb16', servings: 1 }],
    mainDishes: [{ id: 'nr56', servings: 1 }, { id: 'nr30', servings: 1 }],
    snackDishes: [{ id: 's4', servings: 1.5 }],
  },
  {
    day: 'Thursday',
    breakfastDishes: [{ id: 'nb42', servings: 1 }],
    mainDishes: [{ id: 'nr33', servings: 1.5 }, { id: 'nr1', servings: 1 }],
    snackDishes: [{ id: 's1', servings: 1 }],
  },
  {
    day: 'Friday',
    breakfastDishes: [{ id: 'nb26', servings: 1 }],
    mainDishes: [{ id: 'nr19', servings: 1 }, { id: 'nr16', servings: 1 }],
    snackDishes: [{ id: 's3', servings: 1 }],
  },
  {
    day: 'Saturday',
    breakfastDishes: [{ id: 'nb1', servings: 1.5 }],
    mainDishes: [{ id: 'nr36', servings: 1 }, { id: 'nr56', servings: 1 }],
    snackDishes: [{ id: 's2', servings: 1 }],
  },
  {
    day: 'Sunday',
    breakfastDishes: [{ id: 'nb24', servings: 1 }],
    mainDishes: [{ id: 'nr30', servings: 1 }, { id: 'nr33', servings: 1 }],
    snackDishes: [{ id: 'ps4', servings: 1.5 }],
  },
];
const MEAL_SLOTS = ['breakfast', 'main', 'snack'];

// Same normalization used everywhere else on the site (route.js, SamplePlan,
// Planner) so ingredient names merge consistently in the grocery list.
function groceryKey(name) {
  const cleaned = name
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/^\s*(cooked|grilled|roasted|baked|sliced|diced|chopped|shredded|steamed|boiled|minced|grated)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  const titled = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  if (titled === 'Eggs') return 'Egg';
  return titled;
}

// Builds the exact shape lib/pdfExport.js's downloadPlanPdf() expects, so
// the free lead-magnet plan can reuse the same PDF generator as a real
// generated plan.
export function buildFreePlanExport() {
  const groceries = {};
  let totalCost = 0;
  let totalProtein = 0;
  let totalCal = 0;
  const usedRecipeIds = new Set();

  FREE_PLAN_DAYS.forEach((row) => {
    MEAL_SLOTS.forEach((slot) => {
      (row[`${slot}Dishes`] || []).forEach((dish) => {
        const recipe = findRecipe(dish.id);
        if (!recipe) return;
        const multiplier = dish.servings || 1;
        recipe.ingredients.forEach((ing) => {
          const key = groceryKey(ing.n);
          if (!groceries[key]) groceries[key] = { qty: 0, unit: ing.u, cat: ing.cat };
          groceries[key].qty += ing.q * multiplier;
        });
        totalCost += recipe.cost * multiplier;
        totalProtein += recipe.protein * multiplier;
        totalCal += recipe.cal * multiplier;
        usedRecipeIds.add(recipe.id);
      });
    });
  });

  const avgProtein = Math.round(totalProtein / 7);
  const avgCal = Math.round(totalCal / 7);

  return {
    days: FREE_PLAN_DAYS,
    mealSlots: MEAL_SLOTS,
    groceries,
    stats: { totalCost, avgProtein, avgCal, distinctRecipes: usedRecipeIds.size },
    coachNote:
      "A high-protein starter week built from real recipes in our library — reused ingredients keep grocery costs down and prep simple. Sign up in the planner above to get a version tailored to your own goal, budget, and schedule.",
    goal: 'muscle',
    proteinTarget: avgProtein,
    calorieTarget: avgCal,
    budget: Math.ceil(totalCost / 5) * 5,
  };
}
