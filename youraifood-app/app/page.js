'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import AuthWidget from '../components/AuthWidget';
import Planner from '../components/Planner';
import RecipeGallery from '../components/RecipeGallery';
import Pricing from '../components/Pricing';

export default function Home() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !user) {
      setIsPremium(false);
      return;
    }
    supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => setIsPremium(!!data?.is_premium));
  }, [user]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex max-w-[1120px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-xl font-extrabold text-green-900">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
            YourAiFood
          </div>
          <div className="hidden gap-7 text-sm font-semibold text-ink-soft sm:flex">
            <a href="#planner" className="hover:text-green-700">Plan my week</a>
            <a href="#recipes" className="hover:text-green-700">Recipes</a>
            <a href="#pricing" className="hover:text-green-700">Pricing</a>
          </div>
          <AuthWidget user={user} onAuthChange={(u, s) => { setUser(u); if (s) setSession(s); }} />
        </nav>
      </header>

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
          <Planner user={user} session={session} />
        </div>
      </section>

      <RecipeGallery />
      <Pricing session={session} isPremium={isPremium} />

      <footer className="border-t border-gray-100 px-6 py-9 text-center text-sm text-ink-soft">
        © {new Date().getFullYear()} YourAiFood. Meal plans are AI-generated suggestions — not medical or dietary advice.
      </footer>
    </>
  );
}
