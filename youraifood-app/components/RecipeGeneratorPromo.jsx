import Link from 'next/link';

// Homepage feature section for the AI Recipe Generator. Sits after the sample
// plan so the primary seven-day planner CTA keeps its position.
export default function RecipeGeneratorPromo() {
  return (
    <section className="px-6 py-14" aria-labelledby="recipe-generator-promo">
      <div className="mx-auto flex max-w-[1120px] flex-col items-center gap-5 rounded-3xl border border-green-100 bg-gradient-to-br from-green-50 to-white px-6 py-12 text-center shadow-sm">
        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-violet-700">✨ New · AI Recipe Generator</span>
        <h2 id="recipe-generator-promo" className="max-w-2xl text-3xl font-extrabold leading-tight text-green-900 sm:text-4xl">
          Your Cravings. Your Goals. Your Recipe.
        </h2>
        <p className="max-w-xl text-ink-soft">
          Generate personalized recipes tailored to your calories, protein goals, ingredients, and preferences — in seconds.
          Macros are calculated from ingredient data, not guessed by the AI.
        </p>
        <Link
          href="/recipe-generator"
          className="rounded-full bg-green-600 px-8 py-3.5 text-base font-extrabold text-white shadow-sm transition duration-200 hover:-translate-y-px hover:bg-green-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
        >
          Generate My Recipe
        </Link>
      </div>
    </section>
  );
}
