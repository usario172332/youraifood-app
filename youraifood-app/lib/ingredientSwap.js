// Deterministic ingredient substitution for a generated recipe. No LLM, no quota:
// pick a like-for-like replacement from our trusted table, rescale it to keep the
// recipe's calories (or protein, for protein sources), then recompute everything.

import { INGREDIENTS } from './ingredientNutrition.js';
import {
  computeNutrition, verifiedDietTags, evaluateTargets, validateHard, buildResult, findExclusionHits,
} from './aiRecipeEngine.js';

const VEG = new Set(['broccoli', 'spinach', 'kale', 'bell_pepper', 'onion', 'garlic', 'tomato', 'tomato_canned_chopped', 'cucumber', 'carrot', 'courgette', 'aubergine', 'mushrooms', 'spring_onion', 'cauliflower', 'green_beans', 'asparagus', 'sweetcorn_canned', 'avocado', 'ginger', 'banana', 'apple', 'blueberries', 'strawberries', 'raspberries', 'mango', 'dates_medjool', 'potato_raw', 'sweet_potato_raw']);
const CARB = new Set(['black_beans_canned', 'chickpeas_canned', 'kidney_beans_canned', 'lentils_cooked', 'red_lentils_dry', 'rice_white_cooked', 'brown_rice_cooked', 'basmati_rice_dry', 'quinoa_cooked', 'oats_rolled', 'pasta_dry', 'pasta_gf_dry', 'couscous_dry', 'bread_wholemeal', 'tortilla_wrap', 'corn_tortilla', 'flour_plain', 'almond_flour']);
const FATS = new Set(['olive_oil', 'coconut_oil', 'butter', 'almonds', 'walnuts', 'cashews', 'peanut_butter', 'chia_seeds', 'flaxseed', 'pumpkin_seeds', 'tahini']);
const NEVER = new Set(['water', 'salt', 'black_pepper']); // flavourings/liquids: not swappable

export function groupOf(key) {
  const it = INGREDIENTS[key];
  if (!it) return 'other';
  if (VEG.has(key)) return 'veg';
  if (CARB.has(key)) return 'carb';
  if (FATS.has(key)) return 'fat';
  if (it.tags.includes('dairy') || ['oat_drink', 'almond_drink', 'cream_cheese_light'].includes(key)) return 'dairy';
  if (it.tags.some((t) => ['meat', 'poultry', 'fish', 'shellfish', 'egg'].includes(t)) || ['tofu_firm', 'tempeh', 'whey_protein'].includes(key)) return 'protein';
  return 'other';
}

const round1 = (n) => Math.round(n * 10) / 10;

// "Chicken breast (raw)" -> "chicken breast"; "Chicken thigh, skinless (raw)" -> "chicken thigh"
function simpleName(key) {
  return INGREDIENTS[key].name.replace(/\(.*?\)/g, '').replace(/,.*$/, '').trim().toLowerCase();
}

function swappedGrams(fromKey, toKey, grams) {
  const a = INGREDIENTS[fromKey];
  const b = INGREDIENTS[toKey];
  const g = groupOf(fromKey);
  let f;
  if (g === 'protein' && b.p > 0) f = a.p / b.p; // keep the protein
  else if (g === 'veg' || a.kcal < 60 || b.kcal < 60) f = 1; // low-calorie bulk: like for like
  else f = a.kcal / b.kcal; // keep the calories
  f = Math.min(2.5, Math.max(0.4, f));
  const out = grams * f;
  return out >= 100 ? Math.round(out / 5) * 5 : Math.round(out);
}

function profileDistance(a, b) {
  // distance between macro shares per 100 kcal
  const s = (x) => { const k = Math.max(x.kcal, 1); return [x.p * 4 / k, x.c * 4 / k, x.f * 9 / k]; };
  const [pa, ca, fa] = s(a);
  const [pb, cb, fb] = s(b);
  return Math.abs(pa - pb) + Math.abs(ca - cb) + Math.abs(fa - fb);
}

function perServingOf(recipeIngredients, servings) {
  return computeNutrition({ servings, ingredients: recipeIngredients }).perServing;
}

/** Candidate replacements for one ingredient, with the resulting per-serving macros. */
export function suggestSubstitutes(stored, fromKey, excluded = []) {
  const recipe = stored.recipe;
  const from = recipe.ingredients.find((i) => i.key === fromKey);
  if (!from || NEVER.has(fromKey) || !INGREDIENTS[fromKey]) return [];
  const group = groupOf(fromKey);
  if (group === 'other') return [];
  const have = new Set(recipe.ingredients.map((i) => i.key));
  const out = [];
  for (const key of Object.keys(INGREDIENTS)) {
    if (key === fromKey || have.has(key) || NEVER.has(key) || groupOf(key) !== group) continue;
    if (excluded.length && findExclusionHits({ ingredients: [{ key }], title: '', description: '', storage: '', instructions: [], substitutions: [] }, excluded).length) continue;
    const grams = swappedGrams(fromKey, key, from.grams);
    if (!(grams > 0)) continue;
    const next = recipe.ingredients.map((i) => (i.key === fromKey ? { key, grams } : { key: i.key, grams: i.grams }));
    const ps = perServingOf(next, recipe.servings);
    out.push({ key, name: INGREDIENTS[key].name, grams, kcal: ps.kcal, protein: ps.protein, dist: profileDistance(INGREDIENTS[fromKey], INGREDIENTS[key]) });
  }
  return out.sort((x, y) => x.dist - y.dist).slice(0, 6).map(({ dist, ...rest }) => rest);
}

const GENERIC_WORDS = new Set(['greek', 'firm', 'lean', 'sweet', 'brown', 'white', 'whole', 'red', 'black', 'olive', 'canned', 'dried', 'plain', 'low', 'egg']);

function replaceName(text, fromKey, toKey, remainingKeys = []) {
  if (!text) return text;
  const oldN = simpleName(fromKey);
  const newN = simpleName(toKey);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const sub = (m) => (m[0] === m[0].toUpperCase() ? newN[0].toUpperCase() + newN.slice(1) : newN);
  let out = text.replace(new RegExp(`\\b${esc(oldN)}(?:s|es)?\\b`, 'gi'), sub);
  // Also the bare head word ("chicken") when no remaining ingredient still uses it.
  const head = oldN.split(' ')[0];
  const stillUsed = remainingKeys.some((k) => simpleName(k).split(' ').includes(head));
  if (oldN.includes(' ') && head.length >= 4 && !GENERIC_WORDS.has(head) && !stillUsed) {
    out = out.replace(new RegExp(`\\b${esc(head)}(?:s|es)?\\b`, 'gi'), sub);
  }
  return out;
}

/** Apply a substitution; returns { result } in the same shape as buildResult, or { error }. */
export function applySubstitution(stored, fromKey, toKey, excluded = []) {
  const r = stored.recipe;
  const from = r.ingredients.find((i) => i.key === fromKey);
  if (!from || !INGREDIENTS[fromKey] || !INGREDIENTS[toKey]) return { error: 'That ingredient is not in this recipe.' };
  if (groupOf(toKey) !== groupOf(fromKey) || NEVER.has(fromKey) || NEVER.has(toKey)) return { error: 'That swap is not a like-for-like substitution.' };
  if (r.ingredients.some((i) => i.key === toKey)) return { error: 'The recipe already uses that ingredient.' };
  const grams = swappedGrams(fromKey, toKey, from.grams);

  const ingredients = r.ingredients.map((i) => (i.key === fromKey
    ? { key: toKey, quantity: grams, unit: 'g', grams, note: '' }
    : { key: i.key, quantity: i.quantity, unit: i.unit, grams: i.grams, note: i.note || '' }));

  const remaining = r.ingredients.filter((i) => i.key !== fromKey).map((i) => i.key).concat(toKey);
  const recipe = {
    title: replaceName(r.title, fromKey, toKey, remaining),
    description: replaceName(r.description, fromKey, toKey, remaining),
    mealType: r.mealType,
    servings: r.servings,
    prepMinutes: r.prepMinutes,
    cookMinutes: r.cookMinutes,
    totalMinutes: r.totalMinutes,
    difficulty: r.difficulty,
    ingredients,
    instructions: r.instructions.map((s) => replaceName(s, fromKey, toKey, remaining)),
    storage: replaceName(r.storage, fromKey, toKey, remaining),
    substitutions: (r.substitutions || []).map((s) => replaceName(s, fromKey, toKey, remaining)),
  };

  const nutrition = computeNutrition(recipe);
  const tags = verifiedDietTags(recipe, nutrition.perServing);
  const errs = validateHard(recipe, { excluded, diets: [], pantryMode: false, maxTime: 0 }, nutrition, tags);
  if (errs.length) return { error: errs[0] };

  const req = stored.request || {};
  const input = { calories: req.calories || null, protein: req.protein || null, servings: r.servings };
  const evalRes = evaluateTargets(nutrition.perServing, input);
  const result = buildResult({ recipe, nutrition, tags, evalRes }, input);
  result.substituted = {
    from: INGREDIENTS[fromKey].name,
    to: INGREDIENTS[toKey].name,
    before: stored.nutrition.perServing,
    after: nutrition.perServing,
  };
  return { result };
}
