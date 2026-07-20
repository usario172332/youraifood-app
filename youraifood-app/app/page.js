'use client';

import Planner from '../components/Planner';
import RecipeGallery from '../components/RecipeGallery';
import Pricing from '../components/Pricing';
import { useAuth } from '../lib/AuthContext';

export default function Home() {
  const { user, session, isPremium, favorites, toggleFavorite } = useAuth();

  return (
    <>
      <section className="px-6 pb-10 pt-16">
        <div className="mx-auto max-w-[1120px] text-center">
          <span className="mb-4 inline-block rounded-full bg-green-50 px-3.5 py-1.5 text-[13px] font-bold text-green-700">
            Real AI-generated meal plans, built around you
          </span>
          <h1 className="mx-auto mb-4 max-w-3xl text-4xl font-extrabold leading-tight text-green-900 sm:text-5xl">
            Tell us your goal. Get a <span className="text-green-600">week of meals</span> that fit it.
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-lg text-ink-soft">
            Set a fitness goal, dietary needs, budget, and time you have to cook. YourAiFood builds a personalized
            weekly menu, an optimized grocery list, and a full nutritional breakdown — with minimal waste and smart
            ingredient reuse.
          </p>
          <Planner user={user} session={session} favorites={favorites} onToggleFavorite={toggleFavorite} />
        </div>
      </section>

      <RecipeGallery isPremium={isPremium} user={user} favorites={favorites} onToggleFavorite={toggleFavorite} compact />
      <Pricing session={session} isPremium={isPremium} />

      <footer className="border-t border-gray-100 px-6 py-9 text-center text-sm text-ink-soft">
        © {new Date().getFullYear()} YourAiFood. Meal plans are AI-generated suggestions — not medical or dietary advice.
      </footer>
    </>
  );
}
