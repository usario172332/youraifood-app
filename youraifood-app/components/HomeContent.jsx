'use client';

import { useEffect } from 'react';
import Planner from './Planner';
import WhyYourAiFood from './WhyYourAiFood';
import SamplePlan from './SamplePlan';
import TrustSection from './TrustSection';
import RecipeGallery from './RecipeGallery';
import FAQ from './FAQ';
import Pricing from './Pricing';
import FinalCTA from './FinalCTA';
import EmailCapture from './EmailCapture';
import { useAuth } from '../lib/AuthContext';

export default function HomeContent() {
  const { user, session, isPremium, favorites, toggleFavorite } = useAuth();

  function scrollToPlanner() {
    document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth' });
  }

  // If we arrive here via a hash link (e.g. a locked recipe card linking to
  // /#pricing), scroll to that section once the page has laid out — a plain
  // browser hash-jump can silently fail on client-side navigation.
  useEffect(() => {
    if (!window.location.hash) return;
    const id = window.location.hash.slice(1);

    const tryScroll = () => {
      const target = document.getElementById(id);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
      return !!target;
    };

    // A hard/full page load races React's render against the browser's
    // one-shot native anchor scroll, and images below can still be
    // reflowing layout. Try once immediately, once after everything has
    // finished loading, and a couple more times shortly after in case
    // late images/fonts shift the page.
    tryScroll();
    window.addEventListener('load', tryScroll, { once: true });
    const retryTimers = [300, 800, 1600].map((ms) => setTimeout(tryScroll, ms));

    return () => {
      window.removeEventListener('load', tryScroll);
      retryTimers.forEach(clearTimeout);
    };
  }, []);

  return (
    <>
      <section className="px-6 pb-6 pt-16">
        <div className="mx-auto max-w-[1120px] text-center">
          <span className="mb-4 inline-block rounded-full bg-green-50 px-3.5 py-1.5 text-[13px] font-bold text-green-700">
            🍽️ Your Personalised AI Meal Planner
          </span>
          <h1 className="mx-auto mb-4 max-w-3xl text-4xl font-extrabold leading-tight text-green-900 sm:text-5xl">
            Your entire week of eating, planned in <span className="text-green-600">60 seconds</span>.
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-lg text-ink-soft">
            A complete personalised weekly meal plan, built from our macro-tracked recipe library and matched
            to your goal — with calculated calories and macros, and one combined grocery list. Ready in under a
            minute.
          </p>
          <button
            onClick={scrollToPlanner}
            className="rounded-full bg-green-600 px-7 py-3.5 text-base font-bold text-white shadow-sm transition duration-200 hover:-translate-y-px hover:bg-green-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 active:translate-y-0"
          >
            Create My Free Meal Plan →
          </button>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-sm font-semibold text-ink-soft">
            <span>Create your free meal plan without a credit card</span>
            <span className="text-gray-300">·</span>
            <span>Ready in under a minute</span>
          </div>
        </div>
      </section>

      <section className="px-6 pb-10">
        <div className="mx-auto max-w-[880px]">
          <h2 className="mb-5 text-center text-lg font-extrabold text-green-900">
            Everything meal planning normally costs you — handled automatically
          </h2>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {[
              'No manual calorie or macro counting',
              'One combined shopping list, every week',
              'Recipes matched to your goal — weight loss, muscle gain, or eating healthier',
              'Swap out any meal without rebuilding your week',
              'Scales to any household size, from 1 to 8 people',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 rounded-xl bg-green-50 px-4 py-2.5 text-sm font-semibold text-ink">
                <span className="mt-0.5 text-green-600">✔</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 text-xs font-bold text-ink-soft">
            <span>📚 235 macro-tracked recipes</span>
            <span className="text-gray-300">·</span>
            <span>⏱️ Plans generated in under a minute</span>
            <span className="text-gray-300">·</span>
            <span>🆓 5 free plans every month, no card required</span>
          </div>
        </div>
      </section>

      <section className="px-6 pb-10 pt-2">
        <div className="mx-auto max-w-[1120px] text-center">
          <Planner user={user} session={session} isPremium={isPremium} favorites={favorites} onToggleFavorite={toggleFavorite} />
        </div>
      </section>

      <section id="how-it-works" className="px-6 py-14">
        <div className="mx-auto max-w-[1120px]">
          <h2 className="text-center text-2xl font-extrabold text-green-900">How it works</h2>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              { n: '1', icon: '🎯', title: 'Tell us your goal', text: 'Choose weight loss, muscle building, or healthier eating.' },
              { n: '2', icon: '📅', title: 'Receive your week', text: 'Get personalised meals with calculated calories, macros, and portions.' },
              { n: '3', icon: '🛒', title: 'Shop and cook', text: 'Use one combined grocery list and replace anything you dislike.' },
            ].map((step) => (
              <div key={step.n} className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
                <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-sm font-extrabold text-white">
                  {step.n}
                </span>
                <div className="mb-1.5 text-2xl">{step.icon}</div>
                <h3 className="mb-1 text-sm font-extrabold text-green-900">{step.title}</h3>
                <p className="text-sm text-ink-soft">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SamplePlan />
      <WhyYourAiFood />
      <TrustSection />
      <RecipeGallery isPremium={isPremium} user={user} favorites={favorites} onToggleFavorite={toggleFavorite} compact />
      <Pricing session={session} isPremium={isPremium} />
      <EmailCapture />
      <FAQ />
      <FinalCTA />
    </>
  );
}
