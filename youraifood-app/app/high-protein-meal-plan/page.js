import SeoLandingPage from '../../components/SeoLandingPage';
import { RECIPES } from '../../lib/recipes';
import { isHighProtein } from '../../lib/recipeMeta';

export const metadata = {
  title: 'High Protein Meal Plan — 7 Days, AI-Generated | YourAiFood',
  description:
    'Get a free high-protein weekly meal plan built from real recipes — calculated protein and calorie targets, plus an automatic, consolidated shopping list.',
};

const recipes = RECIPES.filter((r) => isHighProtein(r))
  .sort((a, b) => b.protein - a.protein)
  .slice(0, 6);

export default function Page() {
  return (
    <SeoLandingPage
      eyebrow="🥩 High Protein"
      h1="High Protein Meal Plan"
      intro="A free 7-day meal plan built around high-protein recipes — matched to your calorie target, with every meal's macros calculated from real ingredients, not estimated by AI."
      statPoints={[
        { value: '235', label: 'Real recipes' },
        { value: '32%+', label: 'Protein-to-calorie ratio' },
        { value: '<1 min', label: 'To generate your plan' },
        { value: '100%', label: 'Automatic shopping list' },
      ]}
      recipes={recipes}
    />
  );
}
