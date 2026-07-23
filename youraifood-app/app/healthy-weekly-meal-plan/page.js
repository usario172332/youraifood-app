import SeoLandingPage from '../../components/SeoLandingPage';
import { RECIPES } from '../../lib/recipes';

export const metadata = {
  title: 'Healthy Weekly Meal Plan — AI-Generated | YourAiFood',
  description:
    'A free, balanced weekly meal plan built from real recipes — breakfast, lunch, dinner and snacks matched to your goals, with a shopping list included.',
};

const freeRecipes = RECIPES.filter((r) => !r.premium);
const recipes = [
  ...freeRecipes.filter((r) => r.meal === 'Breakfast').slice(0, 2),
  ...freeRecipes.filter((r) => r.meal === 'Lunch & Dinner').slice(0, 2),
  ...freeRecipes.filter((r) => r.meal === 'Snack').slice(0, 2),
];

export default function Page() {
  return (
    <SeoLandingPage
      eyebrow="🥗 Healthy Eating"
      h1="Healthy Weekly Meal Plan"
      intro="A free 7-day meal plan balanced across breakfast, lunch, dinner and snacks — built around your goal and diet, with every meal's nutrition calculated from real ingredients."
      statPoints={[
        { value: '7', label: 'Days planned' },
        { value: '235', label: 'Real recipes' },
        { value: '<1 min', label: 'To generate your plan' },
        { value: '100%', label: 'Automatic shopping list' },
      ]}
      recipes={recipes}
    />
  );
}
