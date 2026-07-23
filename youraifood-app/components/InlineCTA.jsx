'use client';

// A small, reusable contextual CTA dropped in after major homepage sections
// so a convinced visitor can convert immediately rather than having to
// scroll all the way back up to the hero or down to the final CTA.
export default function InlineCTA({ label = 'Create My Free Meal Plan' }) {
  function scrollToPlanner() {
    document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="px-6 py-8 text-center">
      <button
        onClick={scrollToPlanner}
        className="rounded-full bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition duration-200 hover:-translate-y-px hover:bg-green-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 active:translate-y-0"
      >
        {label} →
      </button>
    </div>
  );
}
