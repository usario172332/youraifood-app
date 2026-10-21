// Central, server-side configuration for the AI Recipe Generator.
// Every limit / tolerance / price can be overridden with an environment
// variable so nothing is hardcoded in route code.
//
// QUOTA MONTH CONVENTION: the generation allowance resets on the 1st of each
// calendar month in UTC (month key "YYYY-MM"). A user's count persists across
// plan changes: upgrading to Premium raises the cap immediately (used count is
// kept); downgrading lowers it and, if already above it, blocks new
// generations until the next month. Failed generations are refunded.

function num(name, fallback) {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v >= 0 ? v : fallback;
}

export const AI_RECIPE_CONFIG = {
  generatorVersion: 'ai-recipe-v1.0',

  limits: {
    free: {
      generationsPerMonth: num('AI_RECIPE_FREE_MONTHLY', 2),
      savedRecipes: num('AI_RECIPE_FREE_SAVED', 2),
    },
    premium: {
      generationsPerMonth: num('AI_RECIPE_PREMIUM_MONTHLY', 30),
      savedRecipes: null, // unlimited (a hard safeguard of 500 lives in the DB function)
    },
  },

  // Fractional tolerances applied to PER-SERVING values.
  tolerances: {
    calories: num('AI_RECIPE_TOL_CAL', 0.05),
    protein: num('AI_RECIPE_TOL_PROTEIN', 0.1),
  },

  // Low-carb / high-protein definitions used when the engine verifies tags.
  dietThresholds: {
    lowCarbMaxCarbsPerServing: num('AI_RECIPE_LOWCARB_MAX_G', 30),
    highProteinMinProteinPerServing: num('AI_RECIPE_HIGHPROTEIN_MIN_G', 25),
  },

  // Cost / abuse controls
  provider: process.env.AI_RECIPE_PROVIDER || 'anthropic',
  model: process.env.AI_RECIPE_MODEL || 'claude-haiku-5-5',
  maxOutputTokens: num('AI_RECIPE_MAX_TOKENS', 1600),
  attemptTimeoutMs: num('AI_RECIPE_TIMEOUT_MS', 20000),
  totalBudgetMs: num('AI_RECIPE_TOTAL_MS', 45000),
  maxAdjustRetries: num('AI_RECIPE_MAX_RETRIES', 2),
  rateLimitPerMinute: num('AI_RECIPE_RATE_PER_MIN', 3),
  cacheHours: num('AI_RECIPE_CACHE_HOURS', 24),

  // USD per million tokens — ESTIMATES used only for cost logging. Set the
  // real prices of the configured model via env.
  priceInputPerMTok: num('AI_RECIPE_PRICE_IN', 1),
  priceOutputPerMTok: num('AI_RECIPE_PRICE_OUT', 5),

  input: {
    maxDescriptionChars: 300,
    maxAvailable: 25,
    minAvailable: 2,
    maxExtras: 3,
    maxExcludedTerms: 10,
    maxTermChars: 40,
    calories: { min: 100, max: 2000 },
    protein: { min: 0, max: 200 },
    servings: { min: 1, max: 6 },
  },
};

// Basics assumed available in "Cook With What You Have" mode (when the user
// ticks "I have basic pantry staples"). Never counted as "missing".
export const PANTRY_STAPLES = [
  'water', 'salt', 'black_pepper', 'olive_oil', 'paprika', 'cumin', 'oregano_dried',
  'chilli_flakes', 'turmeric', 'cinnamon', 'garlic_powder', 'curry_powder',
];

export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Any'];
export const TIME_OPTIONS = [15, 30, 45, 60, 0]; // 0 = no preference
export const DIET_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Dairy-free',
  'Gluten-free',
  'Low-carb',
  'High-protein',
  'Mediterranean',
];

export function currentQuotaMonth(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function limitsFor(isPremium) {
  return isPremium ? AI_RECIPE_CONFIG.limits.premium : AI_RECIPE_CONFIG.limits.free;
}
