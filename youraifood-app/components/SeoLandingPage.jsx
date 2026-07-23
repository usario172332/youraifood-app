import Link from 'next/link';

export default function SeoLandingPage({ eyebrow, h1, intro, statPoints, recipes = [] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: recipes.map((r, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Recipe',
        name: r.name,
        recipeCategory: r.meal,
        nutrition: {
          '@type': 'NutritionInformation',
          calories: `${r.cal} calories`,
          proteinContent: `${r.protein} g`,
          carbohydrateContent: `${r.carbs} g`,
          fatContent: `${r.fat} g`,
        },
        totalTime: `PT${r.time}M`,
      },
    })),
  };

  return (
    <>
      <section className="px-6 pb-6 pt-16 text-center">
        <div className="mx-auto max-w-2xl">
          <span className="mb-4 inline-block rounded-full bg-green-50 px-3.5 py-1.5 text-[13px] font-bold text-green-700">
            {eyebrow}
          </span>
          <h1 className="mb-4 text-3xl font-extrabold leading-tight text-green-900 sm:text-4xl">{h1}</h1>
          <p className="mb-6 text-lg text-ink-soft">{intro}</p>
          <Link
            href="/#planner"
            className="inline-block rounded-full bg-green-600 px-7 py-3.5 text-base font-bold text-white shadow-sm transition duration-200 hover:-translate-y-px hover:bg-green-700 hover:shadow-md"
          >
            Create My Free Meal Plan →
          </Link>
        </div>
      </section>

      {statPoints?.length > 0 && (
        <section className="px-6 py-10">
          <div className="mx-auto grid max-w-[900px] grid-cols-2 gap-3.5 sm:grid-cols-4">
            {statPoints.map((s) => (
              <div key={s.label} className="rounded-2xl bg-green-900 px-4 py-5 text-center">
                <div className="text-2xl font-extrabold text-white">{s.value}</div>
                <div className="text-xs font-semibold text-green-100">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {recipes.length > 0 && (
        <section className="bg-green-900 px-6 py-16">
          <div className="mx-auto max-w-[1120px]">
            <h2 className="mb-8 text-center text-2xl font-extrabold text-white">Recipes to get you started</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {recipes.map((r) => (
                <div key={r.id} className="rounded-2xl bg-white p-4">
                  <div className="text-[11px] font-extrabold uppercase tracking-wide text-green-600">{r.meal}</div>
                  <h4 className="my-1.5 text-sm font-extrabold text-green-900">{r.name}</h4>
                  <div className="grid grid-cols-3 gap-1 border-t border-dashed border-gray-100 pt-2 text-center">
                    <div>
                      <div className="text-xs font-extrabold text-green-900">{r.protein}g</div>
                      <div className="text-[10px] text-ink-soft">Protein</div>
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-green-900">{r.cal}</div>
                      <div className="text-[10px] text-ink-soft">Calories</div>
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-green-900">{r.time}m</div>
                      <div className="text-[10px] text-ink-soft">Time</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/recipes"
                className="inline-block rounded-full border border-white/25 bg-white/10 px-6 py-2.5 text-sm font-bold text-white hover:bg-white/20"
              >
                Browse the full recipe library →
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="px-6 py-16 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="mb-3 text-2xl font-extrabold text-green-900">Ready for your own plan?</h2>
          <p className="mb-6 text-ink-soft">
            Get a full week of recipes, macros and a shopping list — personalised to you, in under a minute.
          </p>
          <Link
            href="/#planner"
            className="inline-block rounded-full bg-green-600 px-7 py-3.5 text-base font-bold text-white shadow-sm transition duration-200 hover:-translate-y-px hover:bg-green-700 hover:shadow-md"
          >
            Create My Free Meal Plan →
          </Link>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </>
  );
}
