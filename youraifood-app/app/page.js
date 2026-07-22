import HomeContent from '../components/HomeContent';

export const metadata = {
  title: 'YourAiFood — Fitness Recipes & Personalized Meal Plans',
  description:
    'Tell us your goal, diet, budget and time. YourAiFood builds a real AI-generated weekly menu, grocery list, and nutrition breakdown.',
  alternates: {
    canonical: '/',
  },
};

export default function Home() {
  return <HomeContent />;
}
