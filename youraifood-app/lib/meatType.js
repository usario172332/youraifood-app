// Infers coarse meat/protein categories for a recipe from its ingredient
// names, so users can avoid categories they don't eat (e.g. no pork, no
// fish) without every one of the 235+ recipes needing a hand-added tag.
const CATEGORY_KEYWORDS = {
  poultry: ['chicken', 'turkey', 'duck'],
  redMeat: ['beef', 'pork', 'lamb', 'bacon', 'ham', 'sausage', 'salami', 'pepperoni', 'steak', 'mince', 'prosciutto', 'chorizo'],
  fish: ['fish', 'salmon', 'tuna', 'shrimp', 'prawn', 'cod', 'tilapia', 'seafood', 'anchov', 'sardine', 'mackerel', 'trout'],
};

export const MEAT_CATEGORIES = [
  { value: 'poultry', label: 'Poultry', desc: 'Chicken, turkey' },
  { value: 'redMeat', label: 'Red meat', desc: 'Beef, pork, lamb' },
  { value: 'fish', label: 'Fish & seafood', desc: 'Fish, shrimp, etc.' },
  ];

// Returns which of the categories above a recipe matches, based on a simple
// keyword scan of its name and ingredient list. A recipe can match more
// than one (e.g. a dish with both chicken and bacon), or none at all
// (vegetarian/vegan/dairy-only recipes).
export function recipeMeatCategories(recipe) {
  const text = [recipe?.name, ...((recipe?.ingredients || []).map((i) => i.n))]
  .filter(Boolean)
  .join(' ')
  .toLowerCase();
  return Object.keys(CATEGORY_KEYWORDS).filter((cat) =>
    CATEGORY_KEYWORDS[cat].some((word) => text.includes(word))
                                               );
}

// True if this recipe contains any meat category the user asked to avoid.
export function matchesAvoidedMeat(recipe, avoidMeats) {
  if (!Array.isArray(avoidMeats) || !avoidMeats.length) return false;
  const categories = recipeMeatCategories(recipe);
  return categories.some((c) => avoidMeats.includes(c));
}
