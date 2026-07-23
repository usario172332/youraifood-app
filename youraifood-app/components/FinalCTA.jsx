'use client';

export default function FinalCTA() {
  function scrollToPlanner() {
    document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <section className="bg-green-900 px-6 py-16 text-center">
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-3 text-2xl font-extrabold text-white sm:text-3xl">
          Ready to stop wondering what to cook?
        </h2>
        <p className="mb-8 text-green-100">
          Get your personalised weekly meal plan — recipes, macros and a shopping list, ready in under a minute.
        </p>
        <div className="flex flex-col items-center justify-center gap-3">
          <button
            onClick={scrollToPlanner}
            className="rounded-full bg-white px-7 py-3.5 text-base font-bold text-green-900 shadow-sm transition duration-200 hover:-translate-y-px hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-green-900"
          >
            Create My Free Meal Plan →
          </button>
          <a
            href="/recipes"
            className="text-sm font-semibold text-green-100/80 underline decoration-green-100/40 underline-offset-4 transition duration-200 hover:text-white"
          >
            Browse Recipes
          </a>
        </div>
      </div>
    </section>
  );
}
