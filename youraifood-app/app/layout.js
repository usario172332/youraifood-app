import './globals.css';
import CookieBanner from '../components/CookieBanner';
import AppShell from '../components/AppShell';

export const metadata = {
  title: 'YourAiFood — Fitness Recipes & Personalized Meal Plans',
  description:
    'Tell us your goal, diet, budget and time. YourAiFood builds a real AI-generated weekly menu, grocery list, and nutrition breakdown.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
        <CookieBanner />
      </body>
    </html>
  );
}
