import HomeContent from '../components/HomeContent';

export const metadata = {
  title: 'YourAiFood — Fitness Recipes & Personalised Meal Plans',
  description:
    'Tell us your goal, diet, ingredient preference and time. YourAiFood builds a real AI-generated weekly menu, grocery list, and nutrition breakdown.',
  alternates: {
    canonical: '/',
  },
};

export default function Home() {
  return <HomeContent />;
}
