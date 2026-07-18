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
const PLAN_TOOL = {
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
          properties: {
            day: { type: 'string' },
            breakfast: { type: 'string', description: 'Recipe id from the catalog' },
            lunch: { type: 'string', description: 'Recipe id from the catalog' },
            dinner: { type: 'string', description: 'Recipe id from the catalog' },
            snack: { type: ['string', 'null'], description: 'Recipe id from the catalog, or null if not needed' },
          },
          required: ['day', 'breakfast', 'lunch', 'dinner'],
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

export async function generateWeeklyPlan(inputs) {
  const anthropic = getClient();
  if (!anthropic) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Add it to your environment to enable real AI plan generation.'
    );
  }

  const { goal, proteinTarget, budget, maxTime, family, diets } = inputs;
  const catalog = catalogForPrompt();

  const system = `You are the meal-planning engine behind YourAiFood, a fitness recipe app.
You will be given a recipe catalog (id, meal type, diet tags, cook time in minutes, cost per serving in EUR, protein in grams, calories) and a user's targets.
Build a 7-day plan using ONLY recipe ids that appear in the catalog. Rules:
- Respect every diet tag the user selected (a recipe must include ALL of them to qualify).
- Respect the max cook time per meal.
- Aim for the daily protein target on average across the week; add a snack on days that fall short.
- Aim to stay within the weekly budget (cost per serving × family size × meals planned).
- Deliberately REUSE a small set of recipes across the week (this reduces grocery waste) rather than picking 21 different recipes.
- Vary meals enough that it doesn't feel repetitive day to day.
Call the build_weekly_plan tool with your answer. Do not include any text outside the tool call.`;

  const user = `Recipe catalog (JSON):
${JSON.stringify(catalog)}

User targets:
- Fitness goal: ${goal}
- Daily protein target: ${proteinTarget}g
- Weekly grocery budget: €${budget} for ${family} ${family === 1 ? 'person' : 'people'}
- Max cook time per meal: ${maxTime} minutes
- Dietary needs: ${diets.length ? diets.join(', ') : 'none'}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 2000,
    system,
    messages: [{ role: 'user', content: user }],
    tools: [PLAN_TOOL],
    tool_choice: { type: 'tool', name: 'build_weekly_plan' },
  });

  const toolUse = response.content.find((block) => block.type === 'tool_use');
  if (!toolUse) {
    throw new Error('The model did not return a structured plan. Try again.');
  }
  return toolUse.input; // { days: [...], coachNote: '...' }
}
