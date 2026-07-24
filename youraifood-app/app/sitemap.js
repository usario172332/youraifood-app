import { RECIPES } from '../lib/recipes';
import { getRecipeSlug } from '../lib/recipeSlug';

const SITE_URL = 'https://youraifood.com';

// Static, mostly-stable pages. Recipe URLs are appended separately below
// since there are 235 of them, generated from the same catalog the rest of
// the site reads from.
const STATIC_PATHS = [
  { path: '', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/recipes', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/tips', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/roadmap', priority: 0.4, changeFrequency: 'monthly' },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/tools/macro-calculator', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/healthy-weekly-meal-plan', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/high-protein-breakfast-recipes', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/high-protein-meal-plan', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/meal-plan-with-shopping-list', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/muscle-gain-meal-plan', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/vegetarian-meal-plan', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/weight-loss-meal-plan', priority: 0.7, changeFrequency: 'monthly' },
];

export default function sitemap() {
  const now = new Date();

  const staticEntries = STATIC_PATHS.map((p) => ({
    url: SITE_URL + p.path,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  const recipeEntries = RECIPES.map((recipe) => ({
    url: SITE_URL + '/recipes/' + getRecipeSlug(recipe),
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticEntries, ...recipeEntries];
}
