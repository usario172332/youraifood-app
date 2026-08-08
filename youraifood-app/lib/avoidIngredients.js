// Infers common ingredient-avoidance categories (allergens and common
// dislikes) for a recipe from its ingredient names, in the same spirit as
// lib/meatType.js, so users can steer plan generation away from ingredients
// they want to avoid. This is a keyword-based preference filter, not a
// certified allergen safety check — anyone with a serious food allergy
// should still verify the full ingredient list themselves.

// Plant-based milk/cream/yogurt alternatives (e.g. "Coconut milk", "Plant
// milk") shouldn't count as dairy even though they contain the word "milk".
const PLANT_MILK_RE = /(coconut|almond|oat|soy|cashew|rice|hemp|pea|plant)\s*(milk|cream|yogurt|yoghurt)/i;

// Nut butters (peanut butter, almond butter) and butter lettuce aren't
// dairy even though they contain the word "butter".
const NON_DAIRY_BUTTER_RE = /(peanut|almond|cashew|nut|sunflower|seed|shea|cocoa)\s*butter|butter\s*(lettuce|nut)/i;

const AVOID_KEYWORDS = {
  nuts: ['almond', 'walnut', 'pecan', 'cashew', 'peanut', 'pistachio', 'hazelnut', 'macadamia', 'pine nut', 'brazil nut'],
  mushrooms: ['mushroom', 'shiitake', 'portobello', 'portabella', 'cremini', 'enoki'],
  shellfish: ['shrimp', 'prawn', 'crab', 'lobster', 'mussel', 'clam', 'oyster', 'scallop'],
  fish: ['fish', 'salmon', 'tuna', 'cod', 'tilapia', 'anchov', 'sardine', 'mackerel', 'trout'],
  dairy: ['milk', 'cheese', 'yogurt', 'yoghurt', 'cream', 'butter', 'feta', 'mozzarella', 'parmesan', 'ricotta', 'halloumi'],
  eggs: ['egg'],
  soy: ['soy', 'tofu', 'edamame', 'tempeh'],
};

export const AVOID_INGREDIENT_OPTIONS = [
  { value: 'nuts', label: 'Nuts', desc: 'Almonds, peanuts, cashews...' },
  { value: 'mushrooms', label: 'Mushrooms', desc: 'All varieties' },
  { value: 'shellfish', label: 'Shellfish', desc: 'Shrimp, crab, mussels...' },
  { value: 'fish', label: 'Fish', desc: 'Salmon, tuna, cod...' },
  { value: 'dairy', label: 'Dairy', desc: 'Milk, cheese, yogurt...' },
  { value: 'eggs', label: 'Eggs', desc: 'Whole eggs, egg whites' },
  { value: 'soy', label: 'Soy', desc: 'Tofu, edamame...' },
];

function wordMatches(text, word) {
  // Allow a simple trailing plural ('mushroom' -> 'mushrooms') since
  // ingredient names in the recipe data are almost always plural.
  return new RegExp(`\\b${word}s?\\b`, 'i').test(text);
}

function ingredientMatchesCategory(name, keywords) {
  const lower = name.toLowerCase();
  return keywords.some((word) => {
    if (!wordMatches(lower, word)) return false;
    if ((word === 'milk' || word === 'cream' || word === 'yogurt' || word === 'yoghurt') && PLANT_MILK_RE.test(lower)) return false;
    if (word === 'butter' && NON_DAIRY_BUTTER_RE.test(lower)) return false;
    return true;
  });
}

// Returns which of the categories above a recipe matches, based on a
// per-ingredient keyword scan of its name and ingredient list. A recipe
// can match more than one category, or none at all.
export function recipeAvoidCategories(recipe) {
  const names = [recipe?.name, ...((recipe?.ingredients || []).map((i) => i.n))].filter(Boolean);
  const matched = new Set();
  for (const cat of Object.keys(AVOID_KEYWORDS)) {
    if (names.some((n) => ingredientMatchesCategory(n, AVOID_KEYWORDS[cat]))) {
      matched.add(cat);
    }
  }
  return Array.from(matched);
}

// True if this recipe contains any ingredient category the user asked to avoid.
export function matchesAvoidedIngredient(recipe, avoidIngredients) {
  if (!Array.isArray(avoidIngredients) || !avoidIngredients.length) return false;
  const categories = recipeAvoidCategories(recipe);
  return categories.some((c) => avoidIngredients.includes(c));
}
