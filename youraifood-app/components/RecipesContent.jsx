'use client';

import RecipeGallery from './RecipeGallery';
import { useAuth } from '../lib/AuthContext';

export default function RecipesContent() {
  const { user, isPremium, favorites, toggleFavorite } = useAuth();

  return (
    <>
      <section className="px-6 pb-4 pt-14 text-center">
        <h1 className="mx-auto mb-3 max-w-2xl text-3xl font-extrabold leading-tight text-green-900 sm:text-4xl">
          Browse all 235 recipes
        </h1>
        <p className="mx-auto max-w-xl text-ink-soft">
          Open 24 complete recipes free, or preview the full Premium collection — filter by meal, diet, or
          favourites.
        </p>
      </section>

      <RecipeGallery isPremium={isPremium} user={user} favorites={favorites} onToggleFavorite={toggleFavorite} />
    </>
  );
}
