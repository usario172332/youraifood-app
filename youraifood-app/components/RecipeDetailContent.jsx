'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/AuthContext';
import { RECIPES } from '../lib/recipes';
import { getRecipeSlug } from '../lib/recipeSlug';
import {
  getDifficulty,
  DIFFICULTY_ICON,
  isHighProtein,
  isMealPrepFriendly,
  isFreezerFriendly,
  getHero,
  getSubstitute,
} from '../lib/recipeMeta';

const DIET_ICON = {
  vegan: '🌱',
  vegetarian: '🥗',
  'dairy-free': '🥛',
  'gluten-free': '🌾',
};

const MIN_RATINGS_TO_SHOW = 5;

function StarPicker({ value, hover, onHover, onLeave, onPick }) {
  return (
    <div className="flex gap-1 text-2xl" onMouseLeave={onLeave}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => onHover(n)}
          onClick={() => onPick(n)}
          className="leading-none text-amber-500"
          aria-label={n + ' star' + (n > 1 ? 's' : '')}
        >
          {n <= (hover || value) ? '★' : '☆'}
        </button>
      ))}
    </div>
  );
}

function StaticStars({ rating }) {
  const rounded = Math.round(rating);
  return (
    <span className="font-bold text-amber-600">
      {'★'.repeat(rounded)}
      {'☆'.repeat(5 - rounded)}
    </span>
  );
}

function Stat({ icon, value, label }) {
  return (
    <div className="rounded-xl bg-gray-50 py-3 text-center">
      <div className="text-base">{icon}</div>
      <b className="block text-base text-green-900">{value}</b>
      <span className="text-xs text-ink-soft">{label}</span>
    </div>
  );
}

function RelatedCard({ recipe }) {
  const hero = getHero(recipe);
  const slug = getRecipeSlug(recipe);
  return (
    <Link
      href={'/recipes/' + slug}
      className="block overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {recipe.image ? (
        <img src={recipe.image} alt={recipe.name} loading="lazy" className="h-24 w-full object-cover" />
      ) : (
        <div className={'flex h-24 items-center justify-center bg-gradient-to-br text-2xl ' + hero.gradient}>
          {hero.emoji}
        </div>
      )}
      <div className="p-3">
        <div className="mb-1 text-xs font-extrabold text-green-900">{recipe.name}</div>
        <div className="text-[11px] text-ink-soft">{recipe.cal} kcal · {recipe.protein}g protein</div>
      </div>
    </Link>
  );
}

export default function RecipeDetailContent({ recipe }) {
  const { user, session, isPremium, favorites, toggleFavorite } = useAuth();
  const [copied, setCopied] = useState(false);
  const [reviewsData, setReviewsData] = useState(null);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [hoverStar, setHoverStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    setReviewsData(null);
    setReviewError('');
    const headers = session ? { Authorization: 'Bearer ' + session.access_token } : undefined;
    fetch('/api/reviews?recipeId=' + encodeURIComponent(recipe.id), { headers })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setReviewsData(data);
        setMyRating(data.myReview?.rating || 0);
        setMyComment(data.myReview?.comment || '');
      })
      .catch(() => {});
  }, [recipe.id, session]);

  const hero = getHero(recipe);
  const difficulty = getDifficulty(recipe);
  const highProtein = isHighProtein(recipe);
  const mealPrep = isMealPrepFriendly(recipe);
  const freezer = isFreezerFriendly(recipe);
  const locked = !!recipe.premium && !isPremium;
  const isFav = favorites?.has(recipe.id);

  const related = RECIPES.filter((r) => r.meal === recipe.meal && r.id !== recipe.id).slice(0, 4);

  function copyShoppingList() {
    const text = recipe.ingredients.map((i) => '- ' + i.n + ' (' + i.q + i.u + ')').join('\n');
    navigator.clipboard?.writeText(recipe.name + ' — shopping list\n' + text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  function handleFavoriteClick() {
    if (!user) {
      window.location.href = '/#planner';
      return;
    }
    toggleFavorite?.(recipe.id);
  }

  async function submitReview() {
    if (!user || !session) return;
    if (!myRating) {
      setReviewError('Pick a star rating first.');
      return;
    }
    setSubmitting(true);
    setReviewError('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token },
        body: JSON.stringify({ recipeId: recipe.id, rating: myRating, comment: myComment }),
      });
      if (!res.ok) {
        const data = await res.json();
        setReviewError(data.error || 'Could not save your review.');
        return;
      }
      const refreshed = await fetch('/api/reviews?recipeId=' + encodeURIComponent(recipe.id), {
        headers: { Authorization: 'Bearer ' + session.access_token },
      }).then((r) => r.json());
      setReviewsData(refreshed);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-ink-soft">
        <Link href="/" className="text-green-700 hover:underline">Home</Link>
        <span>/</span>
        <Link href="/recipes" className="text-green-700 hover:underline">Recipes</Link>
        <span>/</span>
        <span className="text-ink">{recipe.name}</span>
      </nav>

      <div
        className={
          'relative flex h-56 items-center justify-center overflow-hidden rounded-2xl sm:h-72 ' +
          (recipe.image ? '' : 'bg-gradient-to-br ' + hero.gradient)
        }
      >
        {recipe.image ? (
          <img src={recipe.image} alt={recipe.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-7xl drop-shadow-sm">{hero.emoji}</span>
        )}

        <button
          onClick={handleFavoriteClick}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-base shadow transition duration-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFav ? '❤️' : '🤍'}
        </button>

        <div className="absolute bottom-3 left-4 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-extrabold text-ink shadow">
            {DIFFICULTY_ICON[difficulty]} {difficulty}
          </span>
          {mealPrep && (
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-extrabold text-ink shadow">📦 Meal prep</span>
          )}
          {freezer && (
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-extrabold text-ink shadow">❄️ Freezer-friendly</span>
          )}
        </div>
      </div>

      <div className="mt-6">
        <div className="text-xs font-extrabold uppercase tracking-wide text-green-600">{recipe.meal}</div>
        <h1 className="mt-1 text-2xl font-extrabold text-green-900 sm:text-3xl">
          {recipe.name}
          {locked && <span title="Premium — preview available" className="ml-1.5 align-middle text-lg">🔒</span>}
        </h1>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className={'inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ' + (recipe.premium ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700')}>
            {recipe.premium ? (locked ? '🔒 Premium — preview available' : '⭐ Premium recipe') : '🆓 Free recipe'}
          </span>
          {highProtein && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">💪 High Protein</span>
          )}
          {recipe.diets.map((d) => (
            <span key={d} className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700">
              {DIET_ICON[d] || ''} {d}
            </span>
          ))}
        </div>

        {reviewsData && reviewsData.count >= MIN_RATINGS_TO_SHOW && (
          <div className="mt-2 flex items-center gap-1.5 text-sm">
            <StaticStars rating={reviewsData.average} />
            <span className="text-ink-soft">
              {reviewsData.average} · {reviewsData.count} review{reviewsData.count === 1 ? '' : 's'}
            </span>
          </div>
        )}

        <div className="mt-6 grid grid-cols-4 gap-2 border-b border-gray-100 pb-6 text-center text-sm text-ink-soft">
          <Stat icon="🔥" value={recipe.cal} label="kcal" />
          <Stat icon="🥩" value={recipe.protein + 'g'} label="protein" />
          <Stat icon="🍞" value={recipe.carbs + 'g'} label="carbs" />
          <Stat icon="🥑" value={recipe.fat + 'g'} label="fat" />
        </div>

        <div className="mt-5 flex gap-6 text-sm text-ink-soft">
          <div><b className="block text-base text-green-900">{recipe.time} min</b>cook time</div>
          <div><b className="block text-base text-green-900">€{recipe.cost.toFixed(2)}</b>per serving</div>
        </div>

        <div className="mt-8 mb-2 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wide text-green-700">Ingredients (1 serving)</h2>
          {!locked && (
            <button onClick={copyShoppingList} className="text-[11px] font-bold text-green-600 hover:text-green-800">
              {copied ? '✓ Copied' : '📋 Copy shopping list'}
            </button>
          )}
        </div>

        {locked ? (
          <div className="relative mb-6 overflow-hidden rounded-xl border border-gray-100">
            <ul aria-hidden="true" className="pointer-events-none select-none blur-sm">
              {recipe.ingredients.slice(0, 5).map((i) => (
                <li key={i.n} className="border-b border-dashed border-gray-100 py-1.5 text-sm">
                  <div className="flex justify-between px-1">
                    <span>{i.n}</span>
                    <span>{i.q}{i.u}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/85 px-4 text-center">
              <span className="text-2xl">🔒</span>
              <p className="max-w-[260px] text-xs font-bold text-green-900">Ingredients &amp; full instructions are a Premium feature</p>
              <Link href="/#pricing" className="rounded-full bg-green-600 px-4 py-2 text-xs font-bold text-white transition duration-200 hover:bg-green-700">
                Unlock with Premium →
              </Link>
            </div>
          </div>
        ) : (
          <ul className="mb-6">
            {recipe.ingredients.map((i) => {
              const sub = getSubstitute(i.n);
              return (
                <li key={i.n} className="border-b border-dashed border-gray-100 py-1.5 text-sm">
                  <div className="flex justify-between">
                    <span>{i.n}</span>
                    <span>{i.q}{i.u}</span>
                  </div>
                  {sub && <div className="mt-0.5 text-[11px] text-ink-soft">🔄 Swap for: {sub}</div>}
                </li>
              );
            })}
          </ul>
        )}

        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-green-700">Instructions</h2>
        {locked ? (
          <div className="relative mb-8 overflow-hidden rounded-xl border border-gray-100">
            <ol aria-hidden="true" className="pointer-events-none list-decimal space-y-3 pl-5 pt-3 text-sm leading-relaxed blur-sm">
              {recipe.steps.slice(0, 3).map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
            <div className="absolute inset-0 flex items-center justify-center bg-white/85 px-4 text-center">
              <p className="text-xs font-semibold text-ink-soft">🔒 Unlock to see the full step-by-step instructions</p>
            </div>
          </div>
        ) : (
          <ol className="mb-8 list-decimal space-y-3 pl-5 text-sm leading-relaxed">
            {recipe.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        )}

        <div className="mb-10 rounded-2xl border-2 border-green-300 bg-green-50 p-6 text-center">
          <p className="mb-1 text-base font-extrabold text-green-900">Build a full week around recipes like this.</p>
          <p className="mx-auto mb-4 max-w-md text-sm text-ink-soft">
            Tell YourAiFood your goals and it matches recipes from the full library, scales portions to your targets, and builds one combined grocery list.
          </p>
          <Link href="/#planner" className="inline-block rounded-full bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition duration-200 hover:-translate-y-px hover:bg-green-700 hover:shadow-md">
            Build My Weekly Plan →
          </Link>
        </div>

        {related.length > 0 && (
          <div className="mb-10">
            <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-green-700">More {recipe.meal} recipes</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {related.map((r) => (
                <RelatedCard key={r.id} recipe={r} />
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-100 pt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wide text-green-700">Ratings &amp; Reviews</h2>
            {reviewsData && reviewsData.count >= MIN_RATINGS_TO_SHOW && (
              <span className="text-xs text-ink-soft">
                <StaticStars rating={reviewsData.average} /> {reviewsData.average} ({reviewsData.count})
              </span>
            )}
          </div>

          {!reviewsData ? (
            <p className="mb-3 text-sm text-ink-soft">Loading reviews…</p>
          ) : reviewsData.count < MIN_RATINGS_TO_SHOW ? (
            <p className="mb-3 text-sm text-ink-soft">
              Ratings will appear here once enough people have tried this recipe — be one of the first to leave one.
            </p>
          ) : (
            <ul className="mb-3 space-y-2.5">
              {reviewsData.reviews.slice(0, 5).map((r) => (
                <li key={r.id} className="rounded-xl bg-gray-50 p-3 text-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <StaticStars rating={r.rating} />
                    <span className="text-[11px] text-ink-soft">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  {r.comment && <p className="text-ink-soft">{r.comment}</p>}
                </li>
              ))}
            </ul>
          )}

          {user ? (
            <div className="rounded-xl border border-dashed border-gray-200 p-3.5">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-soft">
                {reviewsData?.myReview ? 'Your review' : 'Leave a review'}
              </div>
              <StarPicker value={myRating} hover={hoverStar} onHover={setHoverStar} onLeave={() => setHoverStar(0)} onPick={setMyRating} />
              <textarea
                value={myComment}
                onChange={(e) => setMyComment(e.target.value)}
                placeholder="What did you think? (optional)"
                maxLength={500}
                rows={2}
                className="mt-2 w-full rounded-lg border-[1.5px] border-gray-200 px-3 py-2 text-sm"
              />
              {reviewError && <p className="mt-1.5 text-xs font-semibold text-amber-700">{reviewError}</p>}
              <button
                onClick={submitReview}
                disabled={submitting}
                className="mt-2 rounded-full bg-green-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
              >
                {submitting ? 'Saving…' : reviewsData?.myReview ? 'Update review' : 'Submit review'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-ink-soft">Sign in from the sidebar to leave a rating and review.</p>
          )}
        </div>

        <div className="mt-10 text-center">
          <Link href="/recipes" className="text-sm font-bold text-green-700 hover:underline">
            ← Back to Recipe Library
          </Link>
        </div>
      </div>
    </div>
  );
}
