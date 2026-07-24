import { RECIPES } from './recipes';

// Deterministic, human-readable slug derived from a recipe's name — used to
// build individual /recipes/[slug] URLs without having to hand-tag the
// 235-recipe catalog with a stored slug field. Recipe names in this catalog
// are unique, so name-derived slugs are unique too.
export function slugify(str) {
  return String(str)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getRecipeSlug(recipe) {
  return slugify(recipe.name);
}

export function findRecipeBySlug(slug) {
  return RECIPES.find((r) => getRecipeSlug(r) === slug) || null;
}

export function getAllRecipeSlugs() {
  return RECIPES.map((r) => getRecipeSlug(r));
}
