import HomeContent from '../components/HomeContent';

export const metadata = {
  title: 'YourAiFood — Fitness Recipes & Personalised Meal Plans',
  description:
    'Tell us your goal, diet, ingredient preference and time. YourAiFood builds your weekly menu, grocery list, and nutrition breakdown from our curated recipe library and calculated nutrition data.',
  alternates: {
    canonical: '/',
  },
};

export default function Home() {
  return <HomeContent />;
}
