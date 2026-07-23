// Derived "cookbook" metadata computed from the existing recipe data —
// difficulty, prep/freezer friendliness, high-protein badge, hero art, and
// ingredient substitutions. Nothing here is stored on the recipe objects;
// it's all computed on the fly so the 235-recipe catalog didn't need to be
// hand-tagged for every field.

export function getDifficulty(recipe) {
  const steps = recipe.steps?.length || 0;
  const ingredients = recipe.ingredients?.length || 0;
  const score = recipe.time * 0.5 + steps * 4 + ingredients * 2;
  if (score <= 36) return 'Easy';
  if (score <= 46) return 'Medium';
  return 'Hard';
}

export const DIFFICULTY_ICON = { Easy: '🟢', Medium: '🟡', Hard: '🔴' };

// Protein-to-calorie ratio flags a recipe as "high protein" regardless of
// meal size (a 300kcal snack and a 600kcal dinner can both qualify).
export function isHighProtein(recipe) {
  if (!recipe.cal) return false;
  return (recipe.protein * 4) / recipe.cal >= 0.32;
}

const MEAL_PREP_KEYWORDS = [
  'overnight', 'baked', 'bake', 'muffin', 'casserole', 'cassoulet', 'slow cooker',
  'meal prep', 'chia pudding', 'granola', 'frittata',
  ];
const FREEZER_KEYWORDS = [
  'casserole', 'cassoulet', 'soup', 'chili', 'curry', 'bolognese', 'muffin',
  'stew', 'burrito', 'quesadilla', 'baked oats',
  ];

function textBlob(recipe) {
  return `${recipe.name} ${recipe.steps?.join(' ') || ''}`.toLowerCase();
}

export function isMealPrepFriendly(recipe) {
  const blob = textBlob(recipe);
  return MEAL_PREP_KEYWORDS.some((k) => blob.includes(k));
}

export function isFreezerFriendly(recipe) {
  const blob = textBlob(recipe);
  return FREEZER_KEYWORDS.some((k) => blob.includes(k));
}

const ONE_PAN_KEYWORDS = ['one pan', 'one-pan', 'one pot', 'one-pot', 'sheet pan', 'tray bake', 'skillet'];

export function isOnePan(recipe) {
  const blob = textBlob(recipe);
  return ONE_PAN_KEYWORDS.some((k) => blob.includes(k));
}

export function isBeginnerFriendly(recipe) {
  return getDifficulty(recipe) === 'Easy';
}

export function isQuick(recipe) {
  return recipe.time <= 20;
}

// Picks a representative emoji + gradient "hero" for a recipe based on
// keywords in its name — used as stand-in artwork until real photography
// is wired up, so every recipe still gets a distinct, styled visual.
const HERO_RULES = [
  { keywords: ['pancake', 'waffle', 'french toast'], emoji: '🥞', gradient: 'from-amber-200 to-orange-300' },
  { keywords: ['omelette', 'egg', 'frittata', 'scramble'], emoji: '🍳', gradient: 'from-yellow-200 to-amber-300' },
  { keywords: ['smoothie', 'shake'], emoji: '🥤', gradient: 'from-pink-200 to-purple-300' },
  { keywords: ['oat', 'porridge', 'chia'], emoji: '🥣', gradient: 'from-orange-200 to-amber-300' },
  { keywords: ['yogurt', 'parfait', 'cottage cheese'], emoji: '🍨', gradient: 'from-sky-200 to-blue-300' },
  { keywords: ['pizza'], emoji: '🍕', gradient: 'from-red-200 to-orange-300' },
  { keywords: ['burrito', 'taco', 'quesadilla', 'fajita'], emoji: '🌯', gradient: 'from-lime-200 to-green-300' },
  { keywords: ['salad'], emoji: '🥗', gradient: 'from-green-200 to-emerald-300' },
  { keywords: ['curry', 'korma'], emoji: '🍛', gradient: 'from-amber-300 to-red-300' },
  { keywords: ['soup', 'chili', 'cassoulet', 'casserole', 'stew'], emoji: '🍲', gradient: 'from-orange-300 to-red-300' },
  { keywords: ['rice', 'risotto'], emoji: '🍚', gradient: 'from-slate-200 to-gray-300' },
  { keywords: ['sushi', 'tuna bowl', 'salmon'], emoji: '🐟', gradient: 'from-blue-200 to-cyan-300' },
  { keywords: ['shrimp'], emoji: '🍤', gradient: 'from-rose-200 to-pink-300' },
  { keywords: ['steak', 'beef'], emoji: '🥩', gradient: 'from-red-300 to-rose-400' },
  { keywords: ['chicken', 'turkey'], emoji: '🍗', gradient: 'from-amber-200 to-yellow-300' },
  { keywords: ['tofu'], emoji: '🧈', gradient: 'from-stone-200 to-amber-200' },
  { keywords: ['sandwich', 'bagel', 'toast', 'wrap'], emoji: '🥪', gradient: 'from-yellow-200 to-lime-300' },
  { keywords: ['noodle', 'udon', 'pasta'], emoji: '🍜', gradient: 'from-orange-200 to-yellow-300' },
  { keywords: ['bowl'], emoji: '🍱', gradient: 'from-teal-200 to-cyan-300' },
  ];

export function getHero(recipe) {
  const blob = textBlob(recipe);
  for (const rule of HERO_RULES) {
    if (rule.keywords.some((k) => blob.includes(k))) return rule;
  }
  return { emoji: '🍽️', gradient: 'from-green-200 to-emerald-300' };
}

// Common ingredient swaps — shown in the recipe modal so free-tier and
// premium users alike can adapt recipes to what's in their fridge.
const SUBSTITUTIONS = {
  'greek yogurt (0%)': 'low-fat quark or skyr',
  'cottage cheese': 'ricotta or quark',
  'low-fat cottage cheese': 'ricotta or quark',
  'egg whites': '2 whole eggs per 100g called for',
  'vanilla whey protein': 'any neutral/vanilla protein powder',
  'vanilla protein powder': 'any neutral/vanilla protein powder',
  'chocolate whey protein': 'any chocolate protein powder',
  'chocolate protein powder': 'any chocolate protein powder',
  'skimmed milk': 'unsweetened almond or oat milk',
  'oat milk': 'skimmed milk or soy milk',
  'almond butter': 'peanut or cashew butter',
  'peanut butter': 'almond or cashew butter',
  'chicken breast': 'turkey breast',
  'turkey breast': 'chicken breast',
  'lean beef mince': 'turkey or chicken mince',
  'turkey mince': 'lean beef or chicken mince',
  'firm tofu': 'tempeh or extra-firm tofu',
  'light feta': 'goat cheese (use half the amount)',
  'light mozzarella': 'low-fat cheddar',
  'reduced-fat cheddar': 'light mozzarella',
  'light cheddar': 'reduced-fat cheddar',
  'rolled oats (gf)': 'regular rolled oats (if gluten isn’t a concern)',
  'wholegrain bread': 'high-protein or sourdough bread',
  'high-protein tortilla': 'regular wholewheat tortilla',
  'quinoa': 'bulgur or couscous',
  'bulgur wheat': 'quinoa (for a gluten-free swap)',
  'arborio rice': 'short-grain or risotto rice',
  'coconut milk': 'light coconut milk or oat cream',
  'light coconut milk': 'regular coconut milk (fewer calories saved)',
  'tomato passata': 'crushed canned tomatoes',
  'cornflake crumb': 'panko breadcrumbs',
  'panko breadcrumbs': 'cornflake crumb for extra crunch',
};

export function getSubstitute(ingredientName) {
  return SUBSTITUTIONS[ingredientName.toLowerCase()] || null;
}
