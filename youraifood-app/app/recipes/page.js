'use client';

import RecipeGallery from '../../components/RecipeGallery';
import { useAuth } from '../../lib/AuthContext';

export default function RecipesPage() {
  const { user, isPremium, favorites, toggleFavorite } = useAuth();

  return (
    <>
      <section className="px-6 pb-4 pt-14 text-center">
        <h1 className="mx-auto mb-3 max-w-2xl text-3xl font-extrabold leading-tight text-green-900 sm:text-4xl">
          The full recipe library
        </h1>
        <p className="mx-auto max-w-xl text-ink-soft">
          Every recipe YourAiFood can pull from when building your plan — filter by meal, diet, or favorites.
        </p>
      </section>

      <RecipeGallery isPremium={isPremium} user={user} favorites={favorites} onToggleFavorite={toggleFavorite} />

      <footer className="border-t border-gray-100 px-6 py-9 text-center text-sm text-ink-soft">
        © {new Date().getFullYear()} YourAiFood. Meal plans are AI-generated suggestions — not medical or dietary advice.
      </footer>
    </>
  );
}
