import { notFound } from 'next/navigation';
import { RECIPES } from '../../../lib/recipes';
import { findRecipeBySlug, getRecipeSlug } from '../../../lib/recipeSlug';
import RecipeDetailContent from '../../../components/RecipeDetailContent';

const SITE_URL = 'https://youraifood.com';

// Statically generate all 235 recipe pages at build time — recipe data is
// fixed/curated (not user-generated), so full static generation is safe and
// gives every recipe a fast, crawlable, individually-indexable URL.
export function generateStaticParams() {
  return RECIPES.map((recipe) => ({ slug: getRecipeSlug(recipe) }));
}

export function generateMetadata({ params }) {
  const recipe = findRecipeBySlug(params.slug);
  if (!recipe) return { title: 'Recipe not found — YourAiFood' };

  const title = recipe.name + ' — Calories, Protein & Recipe | YourAiFood';
  const description =
    recipe.name + ': ' + recipe.cal + ' kcal and ' + recipe.protein + 'g protein per serving, ready in ' +
    recipe.time + ' min. Full ingredients, step-by-step instructions and nutrition from the YourAiFood recipe library.';
  const url = SITE_URL + '/recipes/' + getRecipeSlug(recipe);
  const image = recipe.image ? SITE_URL + recipe.image : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      images: image ? [{ url: image, width: 1200, height: 900, alt: recipe.name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default function RecipePage({ params }) {
  const recipe = findRecipeBySlug(params.slug);
  if (!recipe) notFound();

  const url = SITE_URL + '/recipes/' + getRecipeSlug(recipe);
  const image = recipe.image ? SITE_URL + recipe.image : undefined;

  // Recipe structured data — every field here comes directly from the same
  // recipe object rendered on the page (ingredients, steps, macros), so the
  // markup always matches what a visitor actually sees.
  const RECIPE_SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.name,
    image: image ? [image] : undefined,
    description: recipe.name + ' — ' + recipe.cal + ' kcal, ' + recipe.protein + 'g protein per serving.',
    recipeCategory: recipe.meal,
    recipeCuisine: 'International',
    keywords: recipe.diets.join(', '),
    totalTime: 'PT' + recipe.time + 'M',
    recipeYield: '1 serving',
    recipeIngredient: recipe.ingredients.map((i) => i.q + i.u + ' ' + i.n),
    recipeInstructions: recipe.steps.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      text: step,
    })),
    nutrition: {
      '@type': 'NutritionInformation',
      calories: recipe.cal + ' kcal',
      proteinContent: recipe.protein + 'g',
      carbohydrateContent: recipe.carbs + 'g',
      fatContent: recipe.fat + 'g',
    },
    url,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(RECIPE_SCHEMA) }}
      />
      <RecipeDetailContent recipe={recipe} />
    </>
  );
}
