import SeoLandingPage from '../../components/SeoLandingPage';
import { RECIPES } from '../../lib/recipes';
import { isHighProtein } from '../../lib/recipeMeta';

export const metadata = {
  title: 'Muscle Gain Meal Plan — 7 Days, AI-Generated | YourAiFood',
  description:
    'A free weekly muscle-building meal plan with a calorie surplus and high-protein recipes matched to your target — plus an automatic shopping list.',
};

const recipes = RECIPES.filter((r) => isHighProtein(r) && r.cal >= 400)
  .sort((a, b) => b.protein - a.protein)
  .slice(0, 6);

export default function Page() {
  return (
    <SeoLandingPage
      eyebrow="💪 Muscle Gain"
      h1="Muscle Gain Meal Plan"
      intro="A free 7-day meal plan built around a lean calorie surplus — protein-focused recipes to support muscle growth, with exact macros calculated per meal."
      statPoints={[
        { value: '2.0g/kg', label: 'Protein target for muscle gain' },
        { value: '+350 kcal', label: 'Typical daily surplus' },
        { value: '235', label: 'Real recipes' },
        { value: '<1 min', label: 'To generate your plan' },
      ]}
      recipes={recipes}
    />
  );
}
