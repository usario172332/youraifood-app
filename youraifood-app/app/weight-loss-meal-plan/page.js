import SeoLandingPage from '../../components/SeoLandingPage';
import { RECIPES } from '../../lib/recipes';

export const metadata = {
  title: 'Weight Loss Meal Plan — 7 Days, AI-Generated | YourAiFood',
  description:
    'A free weekly weight loss meal plan built from real, lower-calorie recipes — high protein to protect muscle in a deficit, with a shopping list included.',
};

const recipes = [...RECIPES]
  .filter((r) => r.cal <= 550)
  .sort((a, b) => b.protein - a.protein)
  .slice(0, 6);

export default function Page() {
  return (
    <SeoLandingPage
      eyebrow="🔥 Weight Loss"
      h1="Weight Loss Meal Plan"
      intro="A free 7-day meal plan built around a calorie deficit — higher protein to protect muscle while you lose weight, with every calorie calculated from real ingredients."
      statPoints={[
        { value: '1.8g/kg', label: 'Protein target while cutting' },
        { value: '-500 kcal', label: 'Typical daily deficit' },
        { value: '235', label: 'Real recipes' },
        { value: '<1 min', label: 'To generate your plan' },
      ]}
      recipes={recipes}
    />
  );
}
