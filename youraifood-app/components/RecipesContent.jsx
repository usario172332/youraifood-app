'use client';

import Link from 'next/link';
import RecipeGallery from './RecipeGallery';
import { useAuth } from '../lib/AuthContext';
import { RECIPES } from '../lib/recipes';

const FREE_COUNT = RECIPES.filter((r) => !r.premium).length;

export default function RecipesContent() {
  const { user, isPremium, favorites, toggleFavorite } = useAuth();

  return (
    <>
      <section className="px-6 pb-4 pt-14 text-center">
        <h1 className="mx-auto mb-3 max-w-2xl text-3xl font-extrabold leading-tight text-green-900 sm:text-4xl">
          Browse all {RECIPES.length} recipes
        </h1>
        <p className="mx-auto max-w-xl text-ink-soft">
          Open {FREE_COUNT} complete recipes free, or preview the full Premium collection — filter by meal, diet, or
          favourites.
        </p>
        <div className="mx-auto mt-5 flex max-w-xl flex-col items-center gap-3 rounded-2xl border border-green-100 bg-green-50/60 px-5 py-4 sm:flex-row sm:justify-between">
          <p className="text-sm font-semibold text-green-900">Can&apos;t find what you&apos;re looking for? Create your own recipe with AI.</p>
          <Link
            href="/recipe-generator"
            className="whitespace-nowrap rounded-full bg-green-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
          >
            Generate My Recipe
          </Link>
        </div>
      </section>

      <RecipeGallery isPremium={isPremium} user={user} favorites={favorites} onToggleFavorite={toggleFavorite} />
    </>
  );
}
