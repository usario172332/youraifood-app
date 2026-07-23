import SeoLandingPage from '../../components/SeoLandingPage';
import { RECIPES } from '../../lib/recipes';
import { isHighProtein } from '../../lib/recipeMeta';

export const metadata = {
  title: 'High Protein Breakfast Recipes | YourAiFood',
  description:
    'Real high-protein breakfast recipes with calculated macros — browse a few here, or get a full week of breakfasts built into your personalised meal plan.',
};

const recipes = RECIPES.filter((r) => r.meal === 'Breakfast' && isHighProtein(r))
  .sort((a, b) => b.protein - a.protein)
  .slice(0, 6);

export default function Page() {
  return (
    <SeoLandingPage
      eyebrow="🍳 Breakfast"
      h1="High Protein Breakfast Recipes"
      intro="Real high-protein breakfast recipes — eggs, oats, yogurt bowls and more — each with calories and macros calculated from the ingredients, not estimated by AI."
      statPoints={[
        { value: '32%+', label: 'Protein-to-calorie ratio' },
        { value: '235', label: 'Real recipes' },
        { value: '<1 min', label: 'To generate your plan' },
        { value: '100%', label: 'Automatic shopping list' },
      ]}
      recipes={recipes}
    />
  );
}
