'use client';

import Planner from './Planner';
import WhyYourAiFood from './WhyYourAiFood';
import ComparisonTable from './ComparisonTable';
import UseCases from './UseCases';
import EcosystemDiagram from './EcosystemDiagram';
import SamplePlan from './SamplePlan';
import RecipeGallery from './RecipeGallery';
import EmailCapture from './EmailCapture';
import FAQ from './FAQ';
import WhatHappensNext from './WhatHappensNext';
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
          <p className="mx-auto mb-6 max-w-xl text-lg text-ink-soft">
            Generate a personalised 7-day meal plan complete with recipes, nutrition, macros and an automatically
            generated shopping list — in under one minute.
          </p>
          <div className="mb-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-semibold text-ink-soft">
            <span>✓ Personalised 7-day meal plan</span>
            <span>✓ High-protein healthy recipes</span>
            <span>✓ Calories & macros</span>
            <span>✓ Automatic shopping list</span>
            <span>✓ Built in under one minute</span>
          </div>
          <button
            onClick={scrollToPlanner}
            className="rounded-full bg-green-600 px-7 py-3.5 text-base font-bold text-white transition hover:-translate-y-px hover:bg-green-700"
          >
            Build My Week →
          </button>
          <p className="mt-3 text-xs font-bold text-green-700">⚡ Average plan generation time: ~20 seconds</p>
        </div>
      </section>

      <WhatHappensNext />

      <section className="px-6 pb-6">
        <div className="mx-auto max-w-[1120px] text-center">
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-semibold text-ink-soft">
            <span>💳 No credit card required</span>
            <span>✕ Cancel anytime</span>
            <span>⚡ Personalised instantly</span>
            <span>🔐 Secure account</span>
            <span>🛡️ Privacy first</span>
          </div>
          <p className="mx-auto mt-4 max-w-lg text-xs text-ink-soft">
            🔍 Nutrition numbers are computed directly from real recipe data — never estimated or hallucinated by AI.
          </p>
        </div>
      </section>

      <section className="px-6 pb-10 pt-2">
        <div className="mx-auto max-w-[1120px] text-center">
          <Planner user={user} session={session} favorites={favorites} onToggleFavorite={toggleFavorite} />
        </div>
      </section>

      <WhyYourAiFood />
      <ComparisonTable />
      <SamplePlan />
      <RecipeGallery isPremium={isPremium} user={user} favorites={favorites} onToggleFavorite={toggleFavorite} compact />
      <UseCases />
      <FAQ />
      <EmailCapture />
      <Pricing session={session} isPremium={isPremium} />
      <EcosystemDiagram />
      <Roadmap />
    </>
  );
}
