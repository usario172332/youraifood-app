'use client';

export default function RecipeModal({ recipe, onClose, isFavorite, onToggleFavorite }) {
  if (!recipe) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-5"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-7">
        {onToggleFavorite && (
          <button
            onClick={onToggleFavorite}
            className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-sm"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorite ? '❤️' : '🤍'}
          </button>
        )}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-green-50 font-bold text-green-700"
        >
          ✕
        </button>
        <div className="text-xs font-extrabold uppercase tracking-wide text-green-600">
          {recipe.meal}
        </div>
        <h3 className="mt-1 text-xl font-extrabold text-green-900">{recipe.name}</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {recipe.diets.map((d) => (
            <span key={d} className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-700">
              {d}
            </span>
          ))}
        </div>
        <div className="mt-4 mb-5 flex gap-5 border-b border-gray-100 pb-4 text-sm text-ink-soft">
          <div><b className="block text-base text-green-900">{recipe.time} min</b>cook time</div>
          <div><b className="block text-base text-green-900">{recipe.protein}g</b>protein</div>
          <div><b className="block text-base text-green-900">{recipe.cal}</b>calories</div>
          <div><b className="block text-base text-green-900">€{recipe.cost.toFixed(2)}</b>per serving</div>
        </div>
        <h5 className="mb-2 text-xs font-bold uppercase tracking-wide text-green-700">Ingredients (1 serving)</h5>
        <ul className="mb-5">
          {recipe.ingredients.map((i) => (
            <li key={i.n} className="flex justify-between border-b border-dashed border-gray-100 py-1.5 text-sm">
              <span>{i.n}</span>
              <span>{i.q}{i.u}</span>
            </li>
          ))}
        </ul>
        <h5 className="mb-2 text-xs font-bold uppercase tracking-wide text-green-700">Instructions</h5>
        <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed">
          {recipe.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
