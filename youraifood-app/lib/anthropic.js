import Anthropic from '@anthropic-ai/sdk';
import { DAYS, catalogForPrompt } from './recipes';

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
          description: 'A 2-3 sentence note explaining the key tradeoffs made (protein target, budget, variety/reuse) in a friendly coach voice.',
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

  const { goal, proteinTarget, calorieTarget, budget, maxTime, family, diets, isPremium, meals, dishesPerDay } = inputs;
  const catalog = catalogForPrompt(isPremium);
  const mealSlots = Array.isArray(meals) && meals.length ? meals : ['breakfast', 'main', 'snack'];
  const mealList = mealSlots.map((s) => MEAL_LABELS[s]).join(', ');
  const total = Number(dishesPerDay) || mealSlots.length;
  const dishCounts = splitDishes(total, mealSlots);
  const dishSummary = mealSlots.map((s) => `${dishCounts[s]} ${MEAL_LABELS[s]}`).join(', ');

  const system = `You are the meal-planning engine behind YourAiFood, a fitness recipe app.
You will be given a recipe catalog (id, meal type, diet tags, cook time in minutes, cost per serving in EUR, protein in grams, calories) and a user's targets.
The user's calorie and protein targets were calculated from their actual body stats (weight, height, age, sex, activity level) using the Mifflin-St Jeor formula, adjusted for their goal — treat them as real, meaningful targets, not rough guesses.
The user only wants these meal types included in their plan: ${mealList}. The user has chosen ${total} dishes per day in total, split as: ${dishSummary}. Build a 7-day plan using ONLY recipe ids that appear in the catalog, filling exactly this many dishes per meal slot every day — never more, never fewer. Rules:
- HITTING THE DAILY CALORIE TARGET IS YOUR TOP PRIORITY — more important than variety, budget, or reuse. Before finalizing each day, mentally sum that day's calories (each dish's calories × its servings). If that sum is more than ~10% below the ${calorieTarget} kcal target, you MUST scale up dishes (set "servings" to 1.5 or 2) until the day is within range — do not submit a day left significantly under target. It is normal and expected for MOST dishes to end up scaled above 1x whenever the target is high relative to a single serving of each dish, especially with fewer dishes per day or a higher-calorie goal like muscle gain.
- Each dish within a meal slot must be a DIFFERENT recipe id (no duplicates within the same slot on the same day). The same recipe id may reappear on other days or in other slots.
- Respect every diet tag the user selected (a recipe must include ALL of them to qualify).
- Respect the max cook time per meal.
- Aim to land within roughly 10% of the daily calorie target on EVERY day, not just on average across the week.
- You have two levers to hit the calorie target, and should combine them as needed:
  1. Dish count is already fixed by the user's choice above (${dishSummary}) — always fill every dish slot.
  2. Serving multipliers — set "servings" on any individual dish to 1.5 or 2 to scale up that dish's calories, protein and cost proportionally. Do not default to 1x out of caution — scale confidently whenever the math calls for it.
  Never scale a dish below 1x or above 2x.
- Aim for the daily protein target on average across the week.
- Aim to stay within the weekly budget (cost per serving × family size × all dishes, including any scaling) — but if budget and the calorie target conflict, the calorie target wins.
- Deliberately REUSE a small set of recipes across the week (this reduces grocery waste) rather than picking a totally different recipe for every dish.
- Vary meals enough that it doesn't feel repetitive day to day.
Call the build_weekly_plan tool with your answer. Do not include any text outside the tool call.`;

  const user = `Recipe catalog (JSON):
${JSON.stringify(catalog)}

User targets:
- Fitness goal: ${goal}
- Daily calorie target: ${calorieTarget} kcal
- Daily protein target: ${proteinTarget}g
- Weekly grocery budget: €${budget} for ${family} ${family === 1 ? 'person' : 'people'}
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
