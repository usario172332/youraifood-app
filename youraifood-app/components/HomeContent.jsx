'use client';

import Planner from './Planner';
import HowItWorks from './HowItWorks';
import ComparisonTable from './ComparisonTable';
import UseCases from './UseCases';
import EcosystemDiagram from './EcosystemDiagram';
import SamplePlan from './SamplePlan';
import RecipeGallery from './RecipeGallery';
import EmailCapture from './EmailCapture';
import Roadmap from './Roadmap';
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
            🤖 Meet your AI nutrition coach
          </span>
          <h1 className="mx-auto mb-4 max-w-3xl text-4xl font-extrabold leading-tight text-green-900 sm:text-5xl">
            Never wonder what to cook <span className="text-green-600">again</span>.
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-lg text-ink-soft">
            Plan your entire week of healthy meals in seconds based on your calories, protein goals, available time,
            and dietary preferences — grocery list included.
          </p>
          <button
            onClick={scrollToPlanner}
            className="rounded-full bg-green-600 px-7 py-3.5 text-base font-bold text-white transition hover:-translate-y-px hover:bg-green-700"
          >
            Start Planning Free →
          </button>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-semibold text-ink-soft">
            <span>✓ High-protein recipes</span>
            <span>✓ Grocery lists</span>
            <span>✓ AI meal planner</span>
            <span>✓ Macro tracking</span>
          </div>
          <p className="mx-auto mt-4 max-w-lg text-xs text-ink-soft">
            🔍 Nutrition numbers are computed directly from real recipe data — never estimated or hallucinated by AI.
          </p>
        </div>
      </section>

      <HowItWorks />

      <section className="px-6 pb-10 pt-6">
        <div className="mx-auto max-w-[1120px] text-center">
          <Planner user={user} session={session} favorites={favorites} onToggleFavorite={toggleFavorite} />
        </div>
      </section>

      <ComparisonTable />
      <SamplePlan />
      <RecipeGallery isPremium={isPremium} user={user} favorites={favorites} onToggleFavorite={toggleFavorite} compact />
      <UseCases />
      <EmailCapture />
      <Pricing session={session} isPremium={isPremium} />
      <EcosystemDiagram />
      <Roadmap />
    </>
  );
}
