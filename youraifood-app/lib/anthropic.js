import Anthropic from '@anthropic-ai/sdk';
import { DAYS, catalogForPrompt } from './recipes';

const BUDGET_LEVEL_GUIDANCE = {
  budget: 'Budget-friendly: favour affordable, everyday ingredients such as oats, rice, beans, lentils, eggs, frozen vegetables, chicken thighs, canned tuna and other cost-effective staples.',
  balanced: 'Balanced: use common supermarket ingredients, balancing affordability, variety and nutrition.',
  premium: 'Premium: prioritise ingredient quality and variety — salmon, lean steak, fresh berries, specialty cheeses, nuts and higher-quality proteins are all fair game.',
};

const MEAT_LABELS = { poultry: 'poultry (chicken/turkey)', redMeat: 'red meat (beef/pork/lamb)', fish: 'fish & seafood' };
const AVOID_INGREDIENT_LABELS = { nuts: 'nuts', mushrooms: 'mushrooms', shellfish: 'shellfish', fish: 'fish', dairy: 'dairy', eggs: 'eggs', soy: 'soy' };

let client = null;
function getClient() {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  client = new Anthropic({ apiKey });
  return client;
}

// We use tool-use (function calling) rather than free-text so the response
// is guaranteed valid JSON with only ids that exist in our catalog — the
// model never has to invent macros or prices, it just picks recipes.
const MEAL_LABELS = { breakfast: 'Breakfast', main: 'Lunch & Dinner', snack: 'Snack' };
const SERVINGS_OPTIONS = [1, 1.5, 2];
// When a day's total dish count must be split across meal slots, extra
// dishes are handed out in this priority order — lunch/dinner benefits most
// from a second dish, then breakfast, snacks last.
const SPLIT_PRIORITY = ['main', 'breakfast', 'snack'];

export function splitDishes(total, slots) {
  const active = SPLIT_PRIORITY.filter((s) => slots.includes(s));
  const n = active.length;
  const counts = {};
  if (!n) return counts;
  const base = Math.floor(total / n);
  let remainder = total % n;
  active.forEach((s) => {
    counts[s] = base;
  });
  active.forEach((s) => {
    if (remainder > 0) {
      counts[s] += 1;
      remainder -= 1;
    }
  });
  return counts;
}

// When the user wants to minimise their grocery list, we cap how many
// DIFFERENT recipe ids the model may use per meal slot across the whole
// week. Catalog entries also get a "key" array of each recipe's 2-3 main
// ingredients when this flag is on, so within that cap the model can spend
// its variety budget on DIFFERENT recipes that still share most of their
// shopping list (e.g. two different chicken-and-rice dishes), not only on
// literally repeating the same recipe id.
const MIN_VARIETY_CAP = { breakfast: 3, main: 3, snack: 2 };

function varietyInstruction(mealSlots, minimiseIngredients) {
  if (!minimiseIngredients) return '';
  const caps = mealSlots.map((s) => `at most ${MIN_VARIETY_CAP[s] || 2} distinct ${MEAL_LABELS[s]} recipe id${(MIN_VARIETY_CAP[s] || 2) > 1 ? 's' : ''} across all 7 days`).join('; ');
  return `\n- MINIMISE GROCERY LIST: the user explicitly wants to shrink their shopping list this week by buying fewer different ingredients. Stay within ${caps}. You don't have to repeat the exact same recipe id every time to achieve this — each catalog entry includes a "key" array of its 2-3 main ingredients, so when you do introduce a different recipe id, strongly prefer one whose key ingredients overlap with a recipe you've already picked this week over one that shares nothing with the rest of the plan. This keeps the shopping list small while still allowing some day-to-day variety.`;
}

function avoidMeatInstruction(avoidMeats) {
  if (!Array.isArray(avoidMeats) || !avoidMeats.length) return '';
  const list = avoidMeats.map((m) => MEAT_LABELS[m] || m).join(', ');
  return `\n- The user wants to avoid these meat categories entirely: ${list}. The catalog you were given has already excluded matching recipes, so simply never worry about reintroducing them.`;
}

function avoidIngredientInstruction(avoidIngredients) {
  if (!Array.isArray(avoidIngredients) || !avoidIngredients.length) return '';
  const list = avoidIngredients.map((m) => AVOID_INGREDIENT_LABELS[m] || m).join(', ');
  return `\n- The user wants to avoid these ingredients: ${list}. The catalog you were given has already excluded matching recipes, so simply never worry about reintroducing them.`;
}

function buildPlanTool(meals, dishCounts) {
  const dayProps = { day: { type: 'string' } };
  const required = ['day', ...meals.map((s) => `${s}Dishes`)];

  meals.forEach((slot) => {
    const count = dishCounts[slot] || 1;
    dayProps[`${slot}Dishes`] = {
      type: 'array',
      minItems: count,
      maxItems: count,
      description: `Exactly ${count} ${MEAL_LABELS[slot]} dish${count > 1 ? 'es' : ''} for this day. Each item is a different recipe id from the catalog matching this meal type — never repeat a recipe id within the same slot on the same day.`,
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Recipe id from the catalog' },
          servings: {
            type: 'number',
            enum: SERVINGS_OPTIONS,
            description:
              'Serving multiplier for this dish: 1, 1.5, or 2. Scale confidently whenever the day would otherwise fall short of the calorie target — most dishes across the week are expected to end up above 1x.',
          },
        },
        required: ['id', 'servings'],
      },
    };
  });

  return {
    name: 'build_weekly_plan',
    description: 'Return a 7-day meal plan built entirely from the provided recipe catalog.',
    input_schema: {
      type: 'object',
      properties: {
        days: {
          type: 'array',
          description: 'Exactly 7 entries, Monday through Sunday.',
          items: {
            type: 'object',
            properties: dayProps,
            required,
          },
        },
        coachNote: {
          type: 'string',
          description: 'A 2-3 sentence note explaining the key tradeoffs made (protein target, ingredient budget level, variety/reuse) in a friendly coach voice.',
        },
      },
      required: ['days', 'coachNote'],
    },
  };
}

export async function generateWeeklyPlan(inputs) {
  const anthropic = getClient();
  if (!anthropic) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Add it to your environment to enable real AI plan generation.'
    );
  }

  const { goal, proteinTarget, calorieTarget, budgetLevel, maxTime, family, diets, isPremium, meals, dishesPerDay, avoidMeats, avoidIngredients, minimiseIngredients } = inputs;
  const budgetGuidance = BUDGET_LEVEL_GUIDANCE[budgetLevel] || BUDGET_LEVEL_GUIDANCE.balanced;
  const catalog = catalogForPrompt(isPremium, avoidMeats, avoidIngredients, minimiseIngredients);
  const mealSlots = Array.isArray(meals) && meals.length ? meals : ['breakfast', 'main', 'snack'];
  const mealList = mealSlots.map((s) => MEAL_LABELS[s]).join(', ');
  const total = Number(dishesPerDay) || mealSlots.length;
  const dishCounts = splitDishes(total, mealSlots);
  const dishSummary = mealSlots.map((s) => `${dishCounts[s]} ${MEAL_LABELS[s]}`).join(', ');

  const system = `You are the meal-planning engine behind YourAiFood, a fitness recipe app.
You will be given a recipe catalog (id, meal type, diet tags, cook time in minutes, cost per serving in EUR, protein in grams, calories) and a user's targets.
The user's calorie and protein targets were calculated from their actual body stats (weight, height, age, sex, activity level) using the Mifflin-St Jeor formula, adjusted for their goal — treat them as real, meaningful targets, not rough guesses.
The user only wants these meal types included in their plan: ${mealList}. The user has chosen ${total} dishes per day in total, split as: ${dishSummary}. Build a 7-day plan using ONLY recipe ids that appear in the catalog, filling exactly this many dishes per meal slot every day — never more, never fewer. Rules:
- HITTING THE DAILY CALORIE TARGET IS YOUR TOP PRIORITY — more important than variety, budget, or reuse. Before finalizing each day, mentally sum that day's calories (each dish's calories × its servings). If that sum is more than ~10% below the ${calorieTarget} kcal target, you MUST scale up dishes (set "servings" to 1.5 or 2) until the day is within range — do not submit a day left significantly under target. It is normal and expected for MOST dishes to end up scaled above 1x whenever the target is high relative to a single serving of each dish, especially with fewer dishes per day or a higher-calorie goal like muscle gain. When scaling dishes up to hit the calorie target, don't only reach for high-protein dishes — mix in at least one lower-protein, carb- or fat-leaning dish per day where the catalog allows, so calories can be hit without dragging protein far past its own target (see the protein rule below).
- Each dish within a meal slot must be a DIFFERENT recipe id (no duplicates within the same slot on the same day). The same recipe id may reappear on other days or in other slots.
- Respect every diet tag the user selected (a recipe must include ALL of them to qualify).
- Respect the max cook time per meal.
- Aim to land within roughly 10% of the daily calorie target on EVERY day, not just on average across the week.
- You have two levers to hit the calorie target, and should combine them as needed:
  1. Dish count is already fixed by the user's choice above (${dishSummary}) — always fill every dish slot.
  2. Serving multipliers — set "servings" on any individual dish to 1.5 or 2 to scale up that dish's calories, protein and cost proportionally. Do not default to 1x out of caution — scale confidently whenever the math calls for it.
  Never scale a dish below 1x or above 2x.
- HIT THE DAILY PROTEIN TARGET CLOSELY TOO — this is not optional. After scaling dishes to hit the calorie target, mentally sum that day's protein (each dish's protein × its servings) and keep it within roughly ±20% of the ${proteinTarget}g target. If the calorie-scaled dishes would push protein far above target (a common trap: scaling up already high-protein dishes), swap in a lower-protein dish, dial a high-protein dish back toward 1x serving while adding a lower-protein dish to cover the remaining calories, or pick a different recipe combination. Never let protein land 50%+ above target just because it was the easiest way to hit calories.
- Ingredient budget level: ${budgetGuidance} This guides ingredient choice only — it never overrides the calorie or protein targets, dietary restrictions, or allergies.
- Deliberately REUSE a small set of recipes across the week (this reduces grocery waste) rather than picking a totally different recipe for every dish.
- Vary meals enough that it doesn't feel repetitive day to day.${varietyInstruction(mealSlots, minimiseIngredients)}${avoidMeatInstruction(avoidMeats)}${avoidIngredientInstruction(avoidIngredients)}
Call the build_weekly_plan tool with your answer. Do not include any text outside the tool call.`;

  const user = `Recipe catalog (JSON):
${JSON.stringify(catalog)}

User targets:
- Fitness goal: ${goal}
- Daily calorie target: ${calorieTarget} kcal
- Daily protein target: ${proteinTarget}g
- Budget level: ${budgetLevel === 'budget' ? 'Budget-friendly' : budgetLevel === 'premium' ? 'Premium' : 'Balanced'} for ${family} ${family === 1 ? 'person' : 'people'}
- Max cook time per meal: ${maxTime} minutes
- Dietary needs: ${diets.length ? diets.join(', ') : 'none'}
- Meals to include each day: ${mealList}
- Dishes per day: ${total} (${dishSummary})`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 3200,
    system,
    messages: [{ role: 'user', content: user }],
    tools: [buildPlanTool(mealSlots, dishCounts)],
    tool_choice: { type: 'tool', name: 'build_weekly_plan' },
  });

  const toolUse = response.content.find((block) => block.type === 'tool_use');
  if (!toolUse) {
    throw new Error('The model did not return a structured plan. Try again.');
  }
  return toolUse.input; // { days: [...], coachNote: '...' }
}

function buildDayTool(meals, dishCounts) {
  const dayProps = {};
  const required = meals.map((s) => `${s}Dishes`);

  meals.forEach((slot) => {
    const count = dishCounts[slot] || 1;
    dayProps[`${slot}Dishes`] = {
      type: 'array',
      minItems: count,
      maxItems: count,
      description: `Exactly ${count} ${MEAL_LABELS[slot]} dish${count > 1 ? 'es' : ''} for this day. Each item is a different recipe id from the catalog matching this meal type — never repeat a recipe id within the same slot.`,
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Recipe id from the catalog' },
          servings: {
            type: 'number',
            enum: SERVINGS_OPTIONS,
            description: 'Serving multiplier for this dish: 1, 1.5, or 2. Scale confidently whenever needed to hit the calorie target.',
          },
        },
        required: ['id', 'servings'],
      },
    };
  });

  return {
    name: 'build_day',
    description: 'Return a single replacement day built entirely from the provided recipe catalog.',
    input_schema: {
      type: 'object',
      properties: dayProps,
      required,
    },
  };
}

// Regenerates just ONE day of an already-generated weekly plan — used by the
// "regenerate this day" button so a user doesn't have to throw away a whole
// week's plan just to swap out one day they don't like. Mirrors
// generateWeeklyPlan's rules but scoped to a single day, and nudges the
// model toward recipe ids not already used elsewhere in the week (passed in
// as avoidIds) so the swap actually adds variety rather than repeating.
export async function regenerateDay(inputs) {
  const anthropic = getClient();
  if (!anthropic) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Add it to your environment to enable real AI plan generation.'
    );
  }

  const { dayName, goal, proteinTarget, calorieTarget, budgetLevel, maxTime, family, diets, isPremium, meals, dishesPerDay, avoidIds, avoidMeats, avoidIngredients, minimiseIngredients } = inputs;
  const budgetGuidance = BUDGET_LEVEL_GUIDANCE[budgetLevel] || BUDGET_LEVEL_GUIDANCE.balanced;
  const catalog = catalogForPrompt(isPremium, avoidMeats, avoidIngredients, minimiseIngredients);
  const mealSlots = Array.isArray(meals) && meals.length ? meals : ['breakfast', 'main', 'snack'];
  const mealList = mealSlots.map((s) => MEAL_LABELS[s]).join(', ');
  const total = Number(dishesPerDay) || mealSlots.length;
  const dishCounts = splitDishes(total, mealSlots);
  const dishSummary = mealSlots.map((s) => `${dishCounts[s]} ${MEAL_LABELS[s]}`).join(', ');
  const avoidList = Array.isArray(avoidIds) && avoidIds.length ? avoidIds.join(', ') : 'none';
    const system = `You are the meal-planning engine behind YourAiFood, a fitness recipe app.
You will be given a recipe catalog (id, meal type, diet tags, cook time in minutes, cost per serving in EUR, protein in grams, calories) and a user's targets.
The user is regenerating a single day (${dayName}) of an existing weekly plan because they want different meals for that day specifically. The user only wants these meal types included: ${mealList}. Build exactly ${dishSummary} using ONLY recipe ids that appear in the catalog. Rules:
- HITTING THE DAILY CALORIE TARGET IS YOUR TOP PRIORITY. Before finalizing, mentally sum this day's calories (each dish's calories × its servings). If more than ~10% below the ${calorieTarget} kcal target, scale dishes up (servings 1.5 or 2) until within range. Don't only reach for high-protein dishes to do this — mix in a lower-protein, carb- or fat-leaning dish if needed so protein doesn't overshoot its own target (see below).
- Each dish within a meal slot must be a DIFFERENT recipe id.
- Respect every diet tag the user selected (a recipe must include ALL of them to qualify).
- Respect the max cook time per meal.
- Where reasonably possible, prefer recipe ids NOT already used elsewhere in this week's plan (listed below) so the regenerated day adds real variety — but it's fine to reuse one if it's clearly the best fit for the target.${minimiseIngredients ? ' UNLESS the user has asked to minimise their grocery list (see below), in which case prefer an id already used elsewhere this week, or a different id that shares its main ingredients with one already used, over an unrelated new recipe.' : ''}
- HIT THE DAILY PROTEIN TARGET CLOSELY TOO — after scaling for calories, sum this day's protein and keep it within roughly ±20% of ${proteinTarget}g. If it would land far above that (e.g. from scaling up an already high-protein dish), swap in a lower-protein dish or dial a dish back toward 1x serving instead of just scaling everything up.
- Ingredient budget level: ${budgetGuidance} This guides ingredient choice only — it never overrides the calorie or protein targets, dietary restrictions, or allergies.${minimiseIngredients ? '\n- MINIMISE GROCERY LIST: the user wants to shrink their shopping list this week — strongly prefer reusing a recipe id already used elsewhere in the week (listed below), or a different recipe id that shares most of its main ingredients (see each catalog entry\'s "key" array) with one already used, over an unrelated brand-new recipe.' : ''}${avoidMeatInstruction(avoidMeats)}${avoidIngredientInstruction(avoidIngredients)}
Call the build_day tool with your answer. Do not include any text outside the tool call.`;

  const user = `Recipe catalog (JSON):
${JSON.stringify(catalog)}

Day to regenerate: ${dayName}
- Fitness goal: ${goal}
- Daily calorie target: ${calorieTarget} kcal
- Daily protein target: ${proteinTarget}g
- Dietary needs: ${diets.length ? diets.join(', ') : 'none'}
- Meals to include: ${mealList}
- Dishes: ${total} (${dishSummary})
- Recipe ids already used elsewhere this week (prefer to avoid repeating): ${avoidList}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 1200,
    system,
    messages: [{ role: 'user', content: user }],
    tools: [buildDayTool(mealSlots, dishCounts)],
    tool_choice: { type: 'tool', name: 'build_day' },
  });

  const toolUse = response.content.find((block) => block.type === 'tool_use');
  if (!toolUse) {
    throw new Error('The model did not return a replacement day. Try again.');
  }
  return toolUse.input; // { breakfastDishes: [...], mainDishes: [...], snackDishes: [...] }
}
