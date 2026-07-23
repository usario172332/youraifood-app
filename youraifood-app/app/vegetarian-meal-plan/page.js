import SeoLandingPage from '../../components/SeoLandingPage';
import { RECIPES } from '../../lib/recipes';

export const metadata = {
  title: 'Vegetarian Meal Plan — 7 Days, AI-Generated | YourAiFood',
  description:
    'A free weekly vegetarian meal plan built from real recipes, matched to your calorie and protein targets — with an automatic, consolidated shopping list.',
};

const recipes = RECIPES.filter((r) => r.diets.includes('vegetarian'))
  .sort((a, b) => b.protein - a.protein)
  .slice(0, 6);

export default function Page() {
  return (
    <SeoLandingPage
      eyebrow="🥗 Vegetarian"
      h1="Vegetarian Meal Plan"
      intro="A free 7-day vegetarian meal plan — every recipe respects your diet automatically, matched to your calorie and protein targets, with a shopping list included."
      statPoints={[
        { value: '235', label: 'Real recipes' },
        { value: '4', label: 'Diet filters supported' },
        { value: '<1 min', label: 'To generate your plan' },
        { value: '100%', label: 'Automatic shopping list' },
      ]}
      recipes={recipes}
    />
  );
}
