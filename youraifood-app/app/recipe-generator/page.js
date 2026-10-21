import RecipeGenerator from '../../components/RecipeGenerator';

export const metadata = {
  title: 'AI Recipe Generator — YourAiFood',
  description:
    'Generate personalised recipes tailored to your calories, protein goals, ingredients and preferences. Macros are calculated from ingredient data, not guessed.',
};

export default function RecipeGeneratorPage() {
  return <RecipeGenerator />;
}
