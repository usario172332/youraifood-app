import SeoLandingPage from '../../components/SeoLandingPage';
import { RECIPES } from '../../lib/recipes';

export const metadata = {
  title: 'Meal Plan With Shopping List — AI-Generated | YourAiFood',
  description:
    'Get a free weekly meal plan with an automatic shopping list — ingredient quantities consolidated across every recipe, organised and ready to shop.',
};

const freeRecipes = RECIPES.filter((r) => !r.premium);
const recipes = [
  ...freeRecipes.filter((r) => r.meal === 'Breakfast').slice(0, 2),
  ...freeRecipes.filter((r) => r.meal === 'Lunch & Dinner').slice(0, 3),
  ...freeRecipes.filter((r) => r.meal === 'Snack').slice(0, 1),
];

export default function Page() {
  return (
    <SeoLandingPage
      eyebrow="🛒 Shopping List Included"
      h1="Meal Plan With Shopping List"
      intro="Every YourAiFood plan comes with a shopping list built automatically — ingredient quantities consolidated across the whole week, organised by category, ready to shop."
      statPoints={[
        { value: '100%', label: 'Plans include a shopping list' },
        { value: '3', label: 'Organised categories' },
        { value: '235', label: 'Real recipes' },
        { value: '<1 min', label: 'To generate your plan' },
      ]}
      recipes={recipes}
    />
  );
}
