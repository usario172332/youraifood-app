'use client';

import Planner from './Planner';
import HowItWorks from './HowItWorks';
import SamplePlan from './SamplePlan';
import RecipeGallery from './RecipeGallery';
import Pricing from './Pricing';
import { useAuth } from '../lib/AuthContext';

export default function HomeContent() {
  const { user, session, isPremium, favorites, toggleFavorite } = useAuth();

  function scrollToPlanner() {
    document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <>
      <section className="px-6 pb-4 pt-16">
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
          <button
            onClick={scrollToPlanner}
            className="rounded-full bg-green-600 px-7 py-3.5 text-base font-bold text-white transition hover:-translate-y-px hover:bg-green-700"
          >
            Build my plan →
          </button>
        </div>
      </section>

      <HowItWorks />

      <section className="px-6 pb-10 pt-6">
        <div className="mx-auto max-w-[1120px] text-center">
          <Planner user={user} session={session} favorites={favorites} onToggleFavorite={toggleFavorite} />
        </div>
      </section>

      <SamplePlan />
      <RecipeGallery isPremium={isPremium} user={user} favorites={favorites} onToggleFavorite={toggleFavorite} compact />
      <Pricing session={session} isPremium={isPremium} />
    </>
  );
}
