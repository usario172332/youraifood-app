// Pure (no network / DB) engine for the AI Recipe Generator:
// input sanitising, ingredient normalisation, independent nutrition
// calculation, validation, and the generate -> validate -> adjust loop.
// The LLM is injected as a function so the whole pipeline is unit-testable
// and the provider can be swapped without touching this file.

import { AI_RECIPE_CONFIG, MEAL_TYPES, TIME_OPTIONS, DIET_OPTIONS, PANTRY_STAPLES } from './aiRecipeConfig.js';
import { INGREDIENTS, ALLOWED_UNITS, toGrams, resolveIngredientKey } from './ingredientNutrition.js';

const round1 = (n) => Math.round(n * 10) / 10;
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ---------------------------------------------------------------- input ---

export function sanitizeInput(body, cfg = AI_RECIPE_CONFIG) {
  const b = body && typeof body === 'object' ? body : {};
  const lim = cfg.input;

  const description = String(b.description || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/[<>`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, lim.maxDescriptionChars);
  // "Cook With What You Have": ingredient keys the user picked from our table.
  const available = [];
  if (Array.isArray(b.available)) {
    for (const raw of b.available) {
      const key = resolveIngredientKey(String(raw || '').slice(0, 60));
      if (key && !available.includes(key)) available.push(key);
      if (available.length >= lim.maxAvailable) break;
    }
  }
  const pantryMode = available.length > 0;
  if (pantryMode && available.length < lim.minAvailable) {
    return { error: `Pick at least ${lim.minAvailable} ingredients you have.` };
  }
  if (!pantryMode && description.length < 3) return { error: 'Tell us what you would like to eat (at least a few words).' };

  const numOrNull = (v, range, label) => {
    if (v === '' || v === null || v === undefined) return { value: null };
    const n = Number(v);
    if (!Number.isFinite(n)) return { error: `${label} must be a number.` };
    if (n < range.min || n > range.max) return { error: `${label} must be between ${range.min} and ${range.max}.` };
    return { value: Math.round(n) };
  };
  const cal = numOrNull(b.calories, lim.calories, 'Calorie target');
  if (cal.error) return { error: cal.error };
  const pro = numOrNull(b.protein, lim.protein, 'Protein target');
  if (pro.error) return { error: pro.error };
  if (pro.value === 0) pro.value = null;

  const servings = Math.round(Number(b.servings) || 1);
  if (servings < lim.servings.min || servings > lim.servings.max) {
    return { error: `Servings must be between ${lim.servings.min} and ${lim.servings.max}.` };
  }

  const mealType = MEAL_TYPES.includes(b.mealType) ? b.mealType : 'Any';
  const maxTime = TIME_OPTIONS.includes(Number(b.maxTime)) ? Number(b.maxTime) : 0;
  const diets = (Array.isArray(b.diets) ? b.diets : []).filter((d) => DIET_OPTIONS.includes(d));
  const uniqueDiets = [...new Set(diets)];

  const excluded = [];
  const rawEx = Array.isArray(b.excluded) ? b.excluded : String(b.excluded || '').split(/[,\n;]+/);
  for (const t of rawEx) {
    const term = String(t || '').toLowerCase().replace(/[^a-z\s-]/g, '').replace(/\s+/g, ' ').trim().slice(0, lim.maxTermChars);
    if (term.length >= 2 && !excluded.includes(term)) excluded.push(term);
    if (excluded.length >= lim.maxExcludedTerms) break;
  }

  const input = { description: description || 'A recipe made from my ingredients', calories: cal.value, protein: pro.value, servings, mealType, maxTime, diets: uniqueDiets, excluded };

  if (pantryMode) {
    // Drop items the user also excluded (e.g. allergy) so they can never be used.
    const usable = available.filter((k) => findExclusionHits({ ingredients: [{ key: k }], title: '', description: '', storage: '', instructions: [], substitutions: [] }, excluded).length === 0);
    if (usable.length < lim.minAvailable) return { error: 'Too many of your ingredients conflict with your excluded ingredients. Remove an exclusion or pick more ingredients.' };
    input.available = usable;
    input.pantryMode = true;
    input.strictPantry = b.strictPantry !== false; // default: only what I have (+ staples)
    input.staples = b.staples !== false; // default: assume basic staples
    input.dropped = available.filter((k) => !usable.includes(k));
  }
  return { input };
}

const MEAT_WORDS = ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'bacon', 'ham', 'sausage', 'steak', 'fish', 'salmon', 'tuna', 'cod', 'prawn', 'prawns', 'shrimp', 'anchovy', 'anchovies'];

// Cheap pre-checks that cost no AI tokens / quota.
export function checkFeasibility(input) {
  if (input.calories && input.protein) {
    const proteinKcal = input.protein * 4;
    if (proteinKcal > input.calories * 0.9) {
      return `${input.protein} g of protein already supplies ${proteinKcal} kcal, which is too close to (or above) a ${input.calories} kcal target. Raise the calories or lower the protein.`;
    }
    if (input.protein > 80 && input.servings === 1) {
      return `${input.protein} g of protein in a single serving is unrealistic for one meal. Try 60 g or less, or increase the servings.`;
    }
  }
  if (input.diets.includes('Vegan') && input.diets.includes('Vegetarian') === false) {
    /* vegan implies vegetarian — no conflict */
  }
  if (input.diets.includes('Low-carb') && input.calories && input.calories < 150) {
    return 'That calorie target is too low for a complete meal. Try at least 150 kcal.';
  }
  const desc = input.description.toLowerCase();
  if (input.diets.includes('Vegetarian') || input.diets.includes('Vegan')) {
    const hit = MEAT_WORDS.find((w) => new RegExp(`\\b${w}\\b`).test(desc) && !new RegExp(`(vegan|veggie|vegetarian|plant)[ -]${w}`).test(desc));
    if (hit) return `Your description mentions "${hit}" but you selected a vegetarian/vegan diet. Remove one of them.`;
  }
  for (const term of input.excluded) {
    const re = new RegExp(`\\b${escapeRe(term.replace(/s$/, ''))}(?:s|es)?\\b`);
    if (re.test(desc)) return `Your description mentions "${term}", which is also in your excluded ingredients. Remove one of them.`;
  }
  return null;
}

// ------------------------------------------------------------- exclusions ---

const TERM_TAGS = {
  seafood: ['fish', 'shellfish'], fish: ['fish'], shellfish: ['shellfish'],
  nut: ['nuts', 'peanut'], nuts: ['nuts', 'peanut'], 'tree nuts': ['nuts'], 'tree nut': ['nuts'],
  peanut: ['peanut'], peanuts: ['peanut'],
  dairy: ['dairy'], milk: ['dairy'], lactose: ['dairy'],
  egg: ['egg'], eggs: ['egg'],
  gluten: ['gluten'], wheat: ['gluten'],
  soy: ['soy'], soya: ['soy'],
  sesame: ['sesame'], mushroom: ['mushroom'], mushrooms: ['mushroom'],
  meat: ['meat'], poultry: ['poultry'], honey: ['honey'],
};

function termRegex(term) {
  const stem = term.replace(/(?:es|s)$/, '');
  return new RegExp(`\\b${escapeRe(stem)}(?:s|es)?\\b`, 'i');
}

function stripFreeClaims(text) {
  return text.replace(/\b[\w]+-free\b/gi, ' ');
}

export function findExclusionHits(recipe, excluded) {
  const hits = [];
  for (const term of excluded) {
    const re = termRegex(term);
    const tags = TERM_TAGS[term] || [];
    for (const ing of recipe.ingredients) {
      const item = INGREDIENTS[ing.key];
      if (tags.some((t) => item.tags.includes(t)) || re.test(item.name) || re.test(ing.key.replace(/_/g, ' '))) {
        hits.push(`${item.name} conflicts with excluded "${term}"`);
      }
    }
    const corpus = stripFreeClaims([
      recipe.title, recipe.description, recipe.storage, ...recipe.instructions, ...recipe.substitutions,
      ...recipe.ingredients.map((i) => i.note || ''),
    ].join(' \n '));
    if (re.test(corpus)) hits.push(`The recipe text mentions excluded "${term}"`);
  }
  return [...new Set(hits)];
}

// ------------------------------------------------------- normalisation ---

const clampStr = (v, max) => String(v ?? '').replace(/[\u0000-\u001f\u007f<>`]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

export function normalizeRecipe(raw, input) {
  const errors = [];
  if (!raw || typeof raw !== 'object') return { errors: ['Model returned no recipe object.'] };

  const rawIngs = Array.isArray(raw.ingredients) ? raw.ingredients : [];
  if (rawIngs.length < 2 || rawIngs.length > 25) errors.push('Recipe must contain between 2 and 25 ingredients.');

  const merged = new Map();
  for (const r of rawIngs.slice(0, 40)) {
    const key = resolveIngredientKey(r && (r.ingredient || r.name));
    if (!key) { errors.push(`Unknown ingredient "${clampStr(r && (r.ingredient || r.name), 40)}" — use only ingredient keys from the allowed list.`); continue; }
    const unit = String(r.unit || '').toLowerCase();
    const qty = Number(r.quantity);
    if (!ALLOWED_UNITS.includes(unit)) { errors.push(`Unit "${clampStr(unit, 10)}" is not allowed for ${key}.`); continue; }
    if (!Number.isFinite(qty) || qty <= 0) { errors.push(`Invalid quantity for ${key}.`); continue; }
    const grams = toGrams(key, qty, unit);
    if (grams === null) { errors.push(`Cannot convert ${qty} ${unit} of ${key} to grams — use g or ml.`); continue; }
    const prev = merged.get(key);
    if (prev) { prev.grams += grams; prev.quantity = round1(prev.grams); prev.unit = 'g'; }
    else merged.set(key, { key, quantity: qty, unit, grams, note: clampStr(r.note, 60) });
  }

  const instructions = (Array.isArray(raw.instructions) ? raw.instructions : []).map((s) => clampStr(s, 300)).filter(Boolean).slice(0, 15);
  if (instructions.length < 2) errors.push('Recipe needs at least 2 instruction steps.');

  const prep = Math.round(Number(raw.prep_time_minutes));
  const cook = Math.round(Number(raw.cook_time_minutes));
  if (!Number.isFinite(prep) || prep < 0 || prep > 240 || !Number.isFinite(cook) || cook < 0 || cook > 480) errors.push('Invalid prep/cook times.');

  const title = clampStr(raw.title, 80);
  if (!title) errors.push('Missing title.');

  if (errors.length) return { errors };

  // The model's quantities are for ITS stated servings; re-base to the request.
  const modelServings = Math.min(12, Math.max(1, Math.round(Number(raw.servings) || input.servings)));
  const factor = input.servings / modelServings;
  const ingredients = [...merged.values()].map((i) => {
    if (factor === 1) return i;
    return scaleIngredient(i, factor);
  });

  return {
    recipe: {
      title,
      description: clampStr(raw.description, 240),
      mealType: MEAL_TYPES.includes(raw.meal_type) ? raw.meal_type : input.mealType,
      servings: input.servings,
      prepMinutes: prep,
      cookMinutes: cook,
      totalMinutes: prep + cook,
      difficulty: ['Easy', 'Medium', 'Hard'].includes(raw.difficulty) ? raw.difficulty : 'Easy',
      ingredients,
      instructions,
      storage: clampStr(raw.storage_instructions, 300),
      substitutions: (Array.isArray(raw.substitution_suggestions) ? raw.substitution_suggestions : []).map((s) => clampStr(s, 160)).filter(Boolean).slice(0, 5),
    },
  };
}

function scaleIngredient(i, factor) {
  const step = i.unit === 'g' || i.unit === 'ml' ? (i.grams * factor >= 100 ? 5 : 1) : 0.25;
  const quantity = Math.max(step, Math.round((i.quantity * factor) / step) * step);
  const grams = toGrams(i.key, quantity, i.unit) ?? i.grams * factor;
  return { ...i, quantity: round1(quantity), grams };
}

// --------------------------------------------------------------- nutrition ---

export function computeNutrition(recipe) {
  const total = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  const lines = recipe.ingredients.map((ing) => {
    const it = INGREDIENTS[ing.key];
    const f = ing.grams / 100;
    const line = {
      kcal: it.kcal * f, protein: it.p * f, carbs: it.c * f, fat: it.f * f,
    };
    total.kcal += line.kcal; total.protein += line.protein; total.carbs += line.carbs; total.fat += line.fat;
    return { ...line };
  });
  const s = recipe.servings;
  return {
    lines,
    total: { kcal: Math.round(total.kcal), protein: round1(total.protein), carbs: round1(total.carbs), fat: round1(total.fat) },
    perServing: {
      kcal: Math.round(total.kcal / s), protein: round1(total.protein / s), carbs: round1(total.carbs / s), fat: round1(total.fat / s),
    },
  };
}

// ------------------------------------------------------------- validation ---

export function verifiedDietTags(recipe, perServing, cfg = AI_RECIPE_CONFIG) {
  const has = (tag) => recipe.ingredients.some((i) => INGREDIENTS[i.key].tags.includes(tag));
  const anyTag = (...tags) => tags.some(has);
  const tags = [];
  const vegetarian = !anyTag('meat', 'fish', 'shellfish');
  if (vegetarian) tags.push('Vegetarian');
  if (vegetarian && !anyTag('dairy', 'egg', 'honey')) tags.push('Vegan');
  if (!has('dairy')) tags.push('Dairy-free');
  if (!has('gluten')) tags.push('Gluten-free');
  if (perServing.carbs <= cfg.dietThresholds.lowCarbMaxCarbsPerServing) tags.push('Low-carb');
  if (perServing.protein >= cfg.dietThresholds.highProteinMinProteinPerServing) tags.push('High-protein');
  return tags;
}

// ---------------------------------------------------- pantry ("what I have") ---

export function pantrySplit(recipe, input) {
  const have = new Set(input.available || []);
  const staples = new Set(input.staples ? PANTRY_STAPLES : []);
  const used = [];
  const missing = [];
  for (const ing of recipe.ingredients) {
    if (have.has(ing.key)) used.push(ing.key);
    else if (!staples.has(ing.key)) missing.push(ing.key);
  }
  const unused = (input.available || []).filter((k) => !used.includes(k));
  return { used: [...new Set(used)], missing: [...new Set(missing)], unused };
}

export function minPantryUse(input) {
  const n = (input.available || []).filter((k) => !PANTRY_STAPLES.includes(k)).length || (input.available || []).length;
  return Math.min(n, Math.max(2, Math.ceil(n / 2)));
}

function pantryErrors(recipe, input, cfg = AI_RECIPE_CONFIG) {
  const errs = [];
  const { used, missing } = pantrySplit(recipe, input);
  const maxMissing = input.strictPantry ? 0 : cfg.input.maxExtras;
  if (missing.length > maxMissing) {
    errs.push(`Uses ingredients the user does not have: ${missing.map((k) => INGREDIENTS[k].name).join(', ')}. ${input.strictPantry ? 'Use ONLY the available ingredients' + (input.staples ? ' plus basic staples' : '') : `At most ${maxMissing} extra ingredients are allowed`}.`);
  }
  const need = minPantryUse(input);
  if (used.length < need) errs.push(`Only ${used.length} of the user's ingredients were used; use at least ${need}.`);
  return errs;
}

export function validateHard(recipe, input, nutrition, tags) {
  const errors = [];
  errors.push(...findExclusionHits(recipe, input.excluded));

  for (const d of input.diets) {
    if (d === 'Mediterranean') continue; // style hint only; never claimed as verified
    if (!tags.includes(d)) errors.push(`Recipe does not satisfy the "${d}" requirement.`);
  }
  const text = stripFreeClaims([recipe.title, recipe.description, ...recipe.instructions].join(' ')).toLowerCase();
  if (input.diets.includes('Vegetarian') || input.diets.includes('Vegan')) {
    const w = MEAT_WORDS.find((m) => new RegExp(`\\b${m}\\b`).test(text));
    if (w) errors.push(`Recipe text mentions "${w}" in a vegetarian/vegan recipe.`);
  }

  // Plausibility
  const perServingGrams = recipe.ingredients.reduce((s, i) => s + i.grams, 0) / recipe.servings;
  const dry = recipe.ingredients.filter((i) => !['water', 'vegetable_stock', 'chicken_stock'].includes(i.key)).reduce((s, i) => s + i.grams, 0) / recipe.servings;
  if (dry < 60) errors.push('Portion is implausibly small.');
  if (perServingGrams > 1400) errors.push('Portion is implausibly large.');
  for (const i of recipe.ingredients) {
    const it = INGREDIENTS[i.key];
    const spice = it.kcal > 200 && it.fat < 30 && it.p < 40 && /pepper|paprika|cumin|oregano|chilli|turmeric|cinnamon|powder/.test(i.key);
    if (spice && i.grams / recipe.servings > 15) errors.push(`${it.name} quantity is implausibly high.`);
    if (i.grams / recipe.servings > 600) errors.push(`${it.name} quantity per serving is implausibly high.`);
  }
  if (input.pantryMode) errors.push(...pantryErrors(recipe, input));

  const k = nutrition.perServing.kcal;
  if (k < 60 || k > 1800) errors.push(`Calculated ${k} kcal per serving is outside a plausible range.`);
  if (input.maxTime && recipe.totalMinutes > input.maxTime) errors.push(`Total time ${recipe.totalMinutes} min exceeds the ${input.maxTime} min limit.`);

  return [...new Set(errors)];
}

export function evaluateTargets(perServing, input, cfg = AI_RECIPE_CONFIG) {
  const res = { calories: null, protein: null, met: true, score: 0 };
  if (input.calories) {
    const dev = (perServing.kcal - input.calories) / input.calories;
    const ok = Math.abs(dev) <= cfg.tolerances.calories;
    res.calories = { target: input.calories, actual: perServing.kcal, deviation: round1(dev * 100), met: ok };
    res.met = res.met && ok;
    res.score += Math.abs(dev) / cfg.tolerances.calories;
  }
  if (input.protein) {
    const dev = (perServing.protein - input.protein) / input.protein;
    const ok = Math.abs(dev) <= cfg.tolerances.protein;
    res.protein = { target: input.protein, actual: perServing.protein, deviation: round1(dev * 100), met: ok };
    res.met = res.met && ok;
    res.score += Math.abs(dev) / cfg.tolerances.protein;
  }
  return res;
}

// Deterministic first adjustment: scale the calorie-bearing ingredients so the
// calories land on target (keeps flavourings and liquids untouched).
export function scaleToCalories(recipe, input, cfg = AI_RECIPE_CONFIG) {
  if (!input.calories) return recipe;
  const n = computeNutrition(recipe);
  const dev = Math.abs(n.perServing.kcal - input.calories) / input.calories;
  if (dev <= cfg.tolerances.calories) return recipe;

  const totalKcal = n.total.kcal || 1;
  const bearing = recipe.ingredients.map((i, idx) => n.lines[idx].kcal / totalKcal >= 0.03);
  const fixedKcal = n.lines.reduce((s, l, idx) => s + (bearing[idx] ? 0 : l.kcal), 0);
  const scalableKcal = totalKcal - fixedKcal;
  if (scalableKcal <= 0) return recipe;
  const wanted = input.calories * recipe.servings;
  let f = (wanted - fixedKcal) / scalableKcal;
  f = Math.min(1.4, Math.max(0.7, f));
  return {
    ...recipe,
    ingredients: recipe.ingredients.map((i, idx) => (bearing[idx] ? scaleIngredient(i, f) : i)),
  };
}

// ---------------------------------------------------------------- pipeline ---

export class RecipeValidationError extends Error {
  constructor(message, details = []) { super(message); this.name = 'RecipeValidationError'; this.details = details; }
}

function buildFeedback(kind, items, evalRes) {
  if (kind === 'invalid') return `The previous recipe was rejected: ${items.join('; ')}. Fix every issue.`;
  const parts = [];
  if (evalRes.calories && !evalRes.calories.met) parts.push(`calories were ${evalRes.calories.actual} per serving (target ${evalRes.calories.target})`);
  if (evalRes.protein && !evalRes.protein.met) parts.push(`protein was ${evalRes.protein.actual} g per serving (target ${evalRes.protein.target} g)`);
  return `The previous recipe's calculated nutrition missed the targets: ${parts.join('; ')}. Adjust ingredient quantities (or swap ingredients) to hit both targets.`;
}

/**
 * generate({ input, feedback, attempt }) -> { json, usage:{inputTokens,outputTokens} }
 */
export async function runPipeline({ input, generate, cfg = AI_RECIPE_CONFIG, now = () => Date.now() }) {
  const started = now();
  const usage = { inputTokens: 0, outputTokens: 0, attempts: 0 };
  let feedback = null;
  let best = null;
  let lastErrors = [];

  for (let attempt = 0; attempt <= cfg.maxAdjustRetries; attempt++) {
    if (attempt > 0 && now() - started > cfg.totalBudgetMs) break;
    usage.attempts += 1;
    const out = await generate({ input, feedback, attempt });
    usage.inputTokens += out.usage?.inputTokens || 0;
    usage.outputTokens += out.usage?.outputTokens || 0;

    const norm = normalizeRecipe(out.json, input);
    if (norm.errors) { lastErrors = norm.errors; feedback = buildFeedback('invalid', norm.errors); continue; }

    let recipe = scaleToCalories(norm.recipe, input, cfg);
    const nutrition = computeNutrition(recipe);
    const tags = verifiedDietTags(recipe, nutrition.perServing, cfg);
    const hard = validateHard(recipe, input, nutrition, tags);
    if (hard.length) { lastErrors = hard; feedback = buildFeedback('invalid', hard); continue; }

    const evalRes = evaluateTargets(nutrition.perServing, input, cfg);
    const candidate = { recipe, nutrition, tags, evalRes };
    if (!best || evalRes.score < best.evalRes.score) best = candidate;
    if (evalRes.met) break;
    feedback = buildFeedback('missed', null, evalRes);
  }

  if (!best) {
    throw new RecipeValidationError('We could not build a valid recipe that meets your constraints. Try relaxing a requirement.', lastErrors);
  }
  return { ...best, usage };
}

export function estimateCostUsd(usage, cfg = AI_RECIPE_CONFIG) {
  return (usage.inputTokens * cfg.priceInputPerMTok + usage.outputTokens * cfg.priceOutputPerMTok) / 1e6;
}

// Shapes the validated result for the API / DB (no raw model output).
export function buildResult({ recipe, nutrition, tags, evalRes }, input) {
  const targetsMet = evalRes.met;
  const notes = [];
  if (!targetsMet) {
    if (evalRes.calories && !evalRes.calories.met) notes.push(`Closest we could get: ${evalRes.calories.actual} kcal per serving (you asked for ${evalRes.calories.target}).`);
    if (evalRes.protein && !evalRes.protein.met) notes.push(`Closest we could get: ${evalRes.protein.actual} g protein per serving (you asked for ${evalRes.protein.target} g).`);
  }
  return {
    recipe: {
      title: recipe.title,
      description: recipe.description,
      mealType: recipe.mealType,
      servings: recipe.servings,
      prepMinutes: recipe.prepMinutes,
      cookMinutes: recipe.cookMinutes,
      totalMinutes: recipe.totalMinutes,
      difficulty: recipe.difficulty,
      dietaryTags: tags,
      ingredients: recipe.ingredients.map((i, idx) => ({
        key: i.key,
        name: INGREDIENTS[i.key].name,
        quantity: i.quantity,
        unit: i.unit,
        grams: Math.round(i.grams * 10) / 10,
        note: i.note || '',
        kcal: Math.round(nutrition.lines[idx].kcal),
        protein: round1(nutrition.lines[idx].protein),
        carbs: round1(nutrition.lines[idx].carbs),
        fat: round1(nutrition.lines[idx].fat),
      })),
      instructions: recipe.instructions,
      storage: recipe.storage,
      substitutions: recipe.substitutions,
    },
    nutrition: { total: nutrition.total, perServing: nutrition.perServing },
    validation: { status: targetsMet ? 'targets_met' : 'closest_alternative', targets: { calories: evalRes.calories, protein: evalRes.protein }, notes },
    request: { calories: input.calories, protein: input.protein, servings: input.servings },
    ...(input.pantryMode ? (() => {
      const s = pantrySplit(recipe, input);
      const nm = (k) => INGREDIENTS[k].name;
      return { pantry: { used: s.used.map(nm), missing: s.missing.map(nm), unused: s.unused.map(nm), dropped: (input.dropped || []).map(nm), strict: !!input.strictPantry } };
    })() : {}),
  };
}
