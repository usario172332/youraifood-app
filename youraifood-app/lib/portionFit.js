// Discrete serving-size steps a single dish can be scaled to — mirrors the
// steps the AI planner already uses (lib/anthropic.js / generate-plan route)
// when auto-scaling portions to hit a day's calorie target, so recipes you
// pick yourself behave the same way as recipes the planner picks for you.
export const SERVINGS_OPTIONS = [1, 1.25, 1.5, 1.75, 2, 2.5, 3];

function nextServing(servings) {
  const idx = SERVINGS_OPTIONS.indexOf(servings);
  if (idx === -1 || idx === SERVINGS_OPTIONS.length - 1) return null;
  return SERVINGS_OPTIONS[idx + 1];
}

// Given a set of recipes (each needs .cal and .protein per single serving)
// plus a target calorie/protein pair, finds a serving multiplier per recipe
// — drawn from SERVINGS_OPTIONS — that gets the combined total as close to
// both targets as possible.
//
// This runs entirely client-side (no AI call, no server round-trip): it's
// a small greedy search, not portion-scaling that needs real nutrition
// judgement. At each step it bumps whichever recipe's next serving size
// closes the most of the larger remaining gap (calories or protein,
// whichever is furthest from target, normalized so the two are
// comparable), and stops once both are within tolerance or no recipe can
// scale up any further.
export function fitRecipesToTargets(recipes, calorieTarget, proteinTarget) {
  const list = (recipes || []).filter((r) => r && typeof r.cal === 'number' && typeof r.protein === 'number');
  if (!list.length) {
    return { items: [], totalCal: 0, totalProtein: 0 };
  }

  const items = list.map((recipe) => ({ recipe, servings: 1 }));
  const CAL_TOLERANCE = 0.05;
  const PROTEIN_TOLERANCE = 0.05;

  function totals() {
    return items.reduce(
      (acc, it) => ({
        cal: acc.cal + it.recipe.cal * it.servings,
        protein: acc.protein + it.recipe.protein * it.servings,
      }),
      { cal: 0, protein: 0 }
    );
  }

  let guard = 0;
  while (guard++ < 200) {
    const t = totals();
    const calOk = calorieTarget ? t.cal >= calorieTarget * (1 - CAL_TOLERANCE) : true;
    const proteinOk = proteinTarget ? t.protein >= proteinTarget * (1 - PROTEIN_TOLERANCE) : true;
    if (calOk && proteinOk) break;

    const calGap = calorieTarget ? Math.max(0, calorieTarget - t.cal) : 0;
    const proteinGap = proteinTarget ? Math.max(0, proteinTarget - t.protein) : 0;

    let best = null;
    items.forEach((it, index) => {
      const next = nextServing(it.servings);
      if (next == null) return;
      const delta = next - it.servings;
      const calContribution = it.recipe.cal * delta;
      const proteinContribution = it.recipe.protein * delta;
      const calScore = calorieTarget ? Math.min(calContribution, calGap) / calorieTarget : 0;
      const proteinScore = proteinTarget ? Math.min(proteinContribution, proteinGap) / proteinTarget : 0;
      const score = calScore + proteinScore;
      if (!best || score > best.score) {
        best = { index, next, score };
      }
    });

    if (!best || best.score <= 0) break;
    items[best.index].servings = best.next;
  }

  const finalTotals = totals();
  return {
    items: items.map((it) => ({
      recipe: it.recipe,
      servings: it.servings,
      cal: Math.round(it.recipe.cal * it.servings),
      protein: Math.round(it.recipe.protein * it.servings),
    })),
    totalCal: Math.round(finalTotals.cal),
    totalProtein: Math.round(finalTotals.protein),
  };
}
