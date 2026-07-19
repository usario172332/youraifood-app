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
const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };

function buildPlanTool(meals) {
  const dayProps = { day: { type: 'string' } };
  meals.forEach((slot) => {
    dayProps[slot] = { type: 'string', description: `${MEAL_LABELS[slot]} recipe id from the catalog` };
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
            required: ['day', ...meals],
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

  const { goal, proteinTarget, calorieTarget, budget, maxTime, family, diets, isPremium, meals } = inputs;
  const catalog = catalogForPrompt(isPremium);
  const mealSlots = Array.isArray(meals) && meals.length ? meals : ['breakfast', 'lunch', 'dinner', 'snack'];
  const mealList = mealSlots.map((s) => MEAL_LABELS[s]).join(', ');

  const system = `You are the meal-planning engine behind YourAiFood, a fitness recipe app.
You will be given a recipe catalog (id, meal type, diet tags, cook time in minutes, cost per serving in EUR, protein in grams, calories) and a user's targets.
The user's calorie and protein targets were calculated from their actual body stats (weight, height, age, sex, activity level) using the Mifflin-St Jeor formula, adjusted for their goal — treat them as real, meaningful targets, not rough guesses.
The user only wants these meal types included in their plan: ${mealList}. Build a 7-day plan using ONLY recipe ids that appear in the catalog, filling exactly these meal slots every day. Rules:
- Respect every diet tag the user selected (a recipe must include ALL of them to qualify).
- Respect the max cook time per meal.
- Aim for the daily calorie target on average across the week (within roughly 10%) — this is the primary constraint, since it drives the user's weight loss/gain/maintenance goal.
- Aim for the daily protein target on average across the week.
- Aim to stay within the weekly budget (cost per serving × family size × meals planned).
- Deliberately REUSE a small set of recipes across the week (this reduces grocery waste) rather than picking a totally different recipe for every slot.
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
- Meals to include each day: ${mealList}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 2000,
    system,
    messages: [{ role: 'user', content: user }],
    tools: [buildPlanTool(mealSlots)],
    tool_choice: { type: 'tool', name: 'build_weekly_plan' },
  });

  const toolUse = response.content.find((block) => block.type === 'tool_use');
  if (!toolUse) {
    throw new Error('The model did not return a structured plan. Try again.');
  }
  return toolUse.input; // { days: [...], coachNote: '...' }
}
