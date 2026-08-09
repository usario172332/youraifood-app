'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { RECIPES } from '../lib/recipes';
import RecipeModal from './RecipeModal';
import { getRecipeSlug } from '../lib/recipeSlug';
import { getDifficulty, DIFFICULTY_ICON, isHighProtein, getHero, isMealPrepFriendly, isFreezerFriendly, isOnePan, isBeginnerFriendly, isQuick } from '../lib/recipeMeta';

const DIET_ICON = {
  vegan: 'ð±',
  vegetarian: 'ð¥',
  'dairy-free': 'ð¥',
  'gluten-free': 'ð¾',
};

// Minimum real ratings before an aggregate is shown â a 1-2 review average
// isn't meaningful social proof and can be misleading either direction, so
// we stay quiet on a recipe's rating until enough genuine reviews exist.
const MIN_RATINGS_TO_SHOW = 5;

const MEALS = ['all', 'Breakfast', 'Lunch & Dinner', 'Snack'];
const FILTERS = ['all', 'vegan', 'vegetarian', 'dairy-free', 'gluten-free', 'premium', 'favorites'];

const TIME_OPTIONS = [
  { value: 'any', label: 'â±ï¸ Any time' },
  { value: '20', label: 'Under 20 min' },
  { value: '30', label: 'Under 30 min' },
  { value: '45', label: 'Under 45 min' },
];

const CAL_OPTIONS = [
  { value: 'any', label: 'ð¥ Any calories' },
  { value: '400', label: 'Under 400 kcal' },
  { value: '600', label: 'Under 600 kcal' },
  { value: '800', label: 'Under 800 kcal' },
];

const PROTEIN_OPTIONS = [
  { value: 'any', label: 'ð¥© Any protein' },
  { value: '20', label: '20g+ protein' },
  { value: '30', label: '30g+ protein' },
  { value: '40', label: '40g+ protein' },
];

const SORT_OPTIONS = [
  { value: 'default', label: 'Sort: Default' },
  { value: 'protein', label: 'Highest protein' },
  { value: 'quickest', label: 'Quickest' },
  { value: 'lowestCal', label: 'Lowest calories' },
];

// Hand-picked homepage teaser â a compact mix of free recipes to prove
// quality, plus a couple of premium ones (shown locked/blurred) to create
// FOMO toward upgrading. Kept short on purpose so the homepage stays light;
// the full library is one click away via the "Browse Recipes" CTA below.
const TEASER_IDS = ['nr1', 'b2', 'nr14', 'b12', 'nr71', 'b19', 'nr108', 'b6'];

// Editorial picks used purely to make cards easier to scan while browsing â
// not derived from any popularity/view-tracking data (the app doesn't
// collect any), so these are clearly decorative rather than a factual claim.
const POPULAR_IDS = new Set(['nr1', 'b2', 'nr2', 'b1']);
const CHEFS_PICK_IDS = new Set(['nr4', 'ps1', 'b12']);

// One extra "special" badge per card, in priority order. The editorial picks
// above take priority; the rest are computed live from real recipe data so
// they stay honest â only shown on the full library page where the matching
// sort options ("Highest protein", "Quickest", "Lowest calories") live too.
function specialBadge(r, superlatives, compact) {
  if (POPULAR_IDS.has(r.id)) return { icon: 'â­', label: 'Most popular', decorative: true };
  if (CHEFS_PICK_IDS.has(r.id)) return { icon: 'ð¨âð³', label: "Chef's pick", decorative: true };
  if (!compact && superlatives) {
    if (r.id === superlatives.highestProtein) return { icon: 'ðª', label: 'Highest protein', decorative: false };
    if (r.id === superlatives.fastest) return { icon: 'â¡', label: 'Fastest', decorative: false };
    if (r.id === superlatives.lowestCal) return { icon: 'ð¥', label: 'Lowest calories', decorative: false };
  }
  return null;
}

// Priority order for which single extra attribute badge to show alongside
// High Protein â cards stay compact, so only the two most useful badges
// per recipe are surfaced instead of every attribute that applies.
function extraBadge(r) {
  if (isQuick(r)) return { label: 'Under 20 Minutes', icon: 'â±ï¸' };
  if (isOnePan(r)) return { label: 'One Pan', icon: 'ð³' };
  if (isBeginnerFriendly(r)) return { label: 'Beginner Friendly', icon: 'ð±' };
  if (isMealPrepFriendly(r)) return { label: 'Meal Prep Friendly', icon: 'ð¦' };
  if (isFreezerFriendly(r)) return { label: 'Freezer Friendly', icon: 'âï¸' };
  return null;
}

function ToggleChip({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-2 text-xs font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-green-900 ${
        active ? 'border-green-500 bg-green-500 text-white' : 'border-white/25 bg-white/10 text-white'
      }`}
    >
      {label}
    </button>
  );
}

export default function RecipeGallery({ isPremium, user, favorites, onToggleFavorite, compact = false }) {
  const [meal, setMeal] = useState('all');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState('any');
  const [calFilter, setCalFilter] = useState('any');
  const [proteinFilter, setProteinFilter] = useState('any');
  const [mealPrepOnly, setMealPrepOnly] = useState(false);
  const [freezerOnly, setFreezerOnly] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [active, setActive] = useState(null);
  const [reviewSummaries, setReviewSummaries] = useState({});
  const [hoverPreview, setHoverPreview] = useState(null);
  const [latestPlanIds, setLatestPlanIds] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('yaf_latest_plan');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.ids)) setLatestPlanIds(parsed.ids);
      }
    } catch (err) {
      // ignore malformed/unavailable localStorage
    }
  }, []);


  const superlatives = useMemo(() => {
    if (!RECIPES.length) return null;
    const highestProtein = RECIPES.reduce((a, b) => (b.protein > a.protein ? b : a));
    const fastest = RECIPES.reduce((a, b) => (b.time < a.time ? b : a));
    const lowestCal = RECIPES.reduce((a, b) => (b.cal < a.cal ? b : a));
    return { highestProtein: highestProtein.id, fastest: fastest.id, lowestCal: lowestCal.id };
  }, []);

  useEffect(() => {
    fetch('/api/reviews?summary=1')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setReviewSummaries(data.summaries || {}))
      .catch(() => {});
  }, []);

  const byMeal = meal === 'all' ? RECIPES : RECIPES.filter((r) => r.meal === meal);
  let filtered =
    filter === 'all'
      ? byMeal
      : filter === 'premium'
      ? byMeal.filter((r) => r.premium)
      : filter === 'favorites'
      ? byMeal.filter((r) => favorites?.has(r.id))
      : byMeal.filter((r) => r.diets.includes(filter));

  if (!compact) {
    if (freeOnly) filtered = filtered.filter((r) => !r.premium);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((r) => r.name.toLowerCase().includes(q));
    }
    if (timeFilter !== 'any') filtered = filtered.filter((r) => r.time <= Number(timeFilter));
    if (calFilter !== 'any') filtered = filtered.filter((r) => r.cal <= Number(calFilter));
    if (proteinFilter !== 'any') filtered = filtered.filter((r) => r.protein >= Number(proteinFilter));
    if (mealPrepOnly) filtered = filtered.filter((r) => isMealPrepFriendly(r));
    if (freezerOnly) filtered = filtered.filter((r) => isFreezerFriendly(r));

    if (sortBy === 'protein') filtered = [...filtered].sort((a, b) => b.protein - a.protein);
    else if (sortBy === 'quickest') filtered = [...filtered].sort((a, b) => a.time - b.time);
    else if (sortBy === 'lowestCal') filtered = [...filtered].sort((a, b) => a.cal - b.cal);
  }

  const list = compact
    ? TEASER_IDS.map((id) => RECIPES.find((r) => r.id === id)).filter(Boolean)
    : filtered;

  function goTo(hash) {
    const el = document.getElementById(hash);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = `/#${hash}`;
    }
  }

  function handleCardClick(r) {
    // Opening the modal for a locked recipe now shows a real preview
    // (photo, macros, badges) with only ingredients/instructions gated â
    // visitors can judge recipe quality before being asked to upgrade.
    setActive(r);
  }

  function handleHeartClick(e, r) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      goTo('planner');
      return;
    }
    onToggleFavorite?.(r.id);
  }
  function handleImageHover(e, r, locked) {
    if (!r.image) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const popupW = 240;
    const showBelow = rect.top < 280;
    const rawLeft = rect.left + rect.width / 2;
    const left = Math.min(Math.max(rawLeft, popupW / 2 + 12), window.innerWidth - popupW / 2 - 12);
    const top = showBelow ? rect.bottom + 10 : rect.top - 10;
    setHoverPreview({ src: r.image, alt: r.name, left, top, showBelow, locked });
  }

  function handleImageLeave() {
    setHoverPreview(null);
  }

  
  const planRecipes = useMemo(
    () => latestPlanIds.map((id) => RECIPES.find((r) => r.id === id)).filter(Boolean),
    [latestPlanIds]
  );

  function clearLatestPlan() {
    try {
      localStorage.removeItem('yaf_latest_plan');
    } catch (err) {
      // ignore
    }
    setLatestPlanIds([]);
  }

return (
    <section id="recipes" className="bg-green-900 px-6 py-16">
      <div className="mx-auto max-w-[1120px]">
        <h2 className="text-center text-2xl font-extrabold text-white">
          {compact ? 'A taste of the recipe library' : 'Browse the recipe library'}
        </h2>
        <p className="mb-8 text-center text-white/70">
          {compact
            ? `${RECIPES.length} fitness recipes â a photo, full macros and AI meal planning for every one`
            : 'Search, filter, and sort â find exactly the recipe you need'}
        </p>

        {!compact && planRecipes.length > 0 && (
          <div className="mb-8 rounded-2xl border border-white/15 bg-white/5 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-white">
                🗓️ Your latest plan, in order
              </h3>
              <button
                type="button"
                onClick={clearLatestPlan}
                className="text-xs font-semibold text-white/60 underline hover:text-white"
              >
                Clear
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {planRecipes.map((r, i) => {
                const hero = getHero(r);
                return (
                  <Link
                    key={`${r.id}-${i}`}
                    href={'/recipes/' + getRecipeSlug(r)}
                    className="block w-24 flex-shrink-0 overflow-hidden rounded-xl bg-white text-center"
                  >
                    {r.image ? (
                      <img src={r.image} alt={r.name} className="h-16 w-full object-cover" />
                    ) : (
                      <div className={`flex h-16 items-center justify-center bg-gradient-to-br ${hero.gradient} text-xl`}>
                        {hero.emoji}
                      </div>
                    )}
                    <div className="px-1.5 py-1.5 text-[10px] font-bold leading-tight text-green-900">{r.name}</div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}


        {!compact && (
          <>
            <div className="mb-3 flex flex-wrap justify-center gap-2">
              {MEALS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMeal(m)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-green-900 ${
                    meal === m
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-white/25 bg-white/10 text-white'
                  }`}
                >
                  {m === 'all' ? 'All meals' : m}
                </button>
              ))}
            </div>
            <div className="mb-3 flex flex-wrap justify-center gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-green-900 ${
                    filter === f
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-white/25 bg-white/10 text-white'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'premium' ? 'â­ Premium' : f === 'favorites' ? 'â¤ï¸ Favorites' : f}
                </button>
              ))}
            </div>

            <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ð Search recipesâ¦"
                className="w-full max-w-xs rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm text-white placeholder-white/60 focus:border-white/50 focus:outline-none sm:w-64"
              />
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="rounded-full border border-white/25 bg-white/10 px-3 py-2 text-xs font-semibold text-white focus:outline-none"
              >
                {TIME_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="text-ink">{o.label}</option>
                ))}
              </select>
              <select
                value={calFilter}
                onChange={(e) => setCalFilter(e.target.value)}
                className="rounded-full border border-white/25 bg-white/10 px-3 py-2 text-xs font-semibold text-white focus:outline-none"
              >
                {CAL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="text-ink">{o.label}</option>
                ))}
              </select>
              <select
                value={proteinFilter}
                onChange={(e) => setProteinFilter(e.target.value)}
                className="rounded-full border border-white/25 bg-white/10 px-3 py-2 text-xs font-semibold text-white focus:outline-none"
              >
                {PROTEIN_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="text-ink">{o.label}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-full border border-white/25 bg-white/10 px-3 py-2 text-xs font-semibold text-white focus:outline-none"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="text-ink">{o.label}</option>
                ))}
              </select>
            </div>

            <div className="mb-8 flex flex-wrap justify-center gap-2">
              <ToggleChip active={mealPrepOnly} onClick={() => setMealPrepOnly((v) => !v)} label="ð¦ Meal-prep friendly" />
              <ToggleChip active={freezerOnly} onClick={() => setFreezerOnly((v) => !v)} label="âï¸ Freezer friendly" />
              <ToggleChip active={freeOnly} onClick={() => setFreeOnly((v) => !v)} label="ð Free recipes only" />
            </div>
          </>
        )}

        {!compact && list.length === 0 && (
          <p className="mb-8 text-center text-sm text-white/70">No recipes match those filters â try loosening one.</p>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {list.map((r) => {
            const locked = r.premium && !isPremium;
            const isFav = favorites?.has(r.id);
            const hero = getHero(r);
            const highProtein = isHighProtein(r);
            const badge = extraBadge(r);
            const special = specialBadge(r, superlatives, compact);
            const summary = reviewSummaries[r.id];
            return (
              <Link
                key={r.id}
                href={'/recipes/' + getRecipeSlug(r)}
                className="group relative block cursor-pointer overflow-hidden rounded-2xl bg-white transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className="absolute right-2 top-2 z-10 flex flex-col items-end gap-1.5">
                  <button
                    onClick={(e) => handleHeartClick(e, r)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-sm shadow transition duration-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                    aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {isFav ? 'â¤ï¸' : 'ð¤'}
                  </button>
                  {locked && (
                    <span
                      title="Premium â preview available"
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs text-amber-950 shadow"
                    >
                      ð
                    </span>
                  )}
                  {summary && summary.count >= MIN_RATINGS_TO_SHOW && (
                    <span className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-extrabold text-amber-600 shadow">
                      â­ {summary.average}
                    </span>
                  )}
                </div>
                <div className={locked ? 'blur-[3px] select-none' : ''}>
                  {r.image ? (
                    <div
                      className="h-[88px] w-full overflow-hidden"
                      onMouseEnter={(e) => handleImageHover(e, r, locked)}
                      onMouseLeave={handleImageLeave}
                    >
                      <img src={r.image} alt={r.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className={`flex h-[88px] items-center justify-center bg-gradient-to-br ${hero.gradient} text-3xl`}>
                      {hero.emoji}
                    </div>
                  )}
                  <div className="p-4">
                    <div className="text-[11px] font-extrabold uppercase tracking-wide text-green-600">{r.meal}</div>
                    <h4 className="my-1.5 text-sm font-extrabold text-green-900">{r.name}</h4>
                    <div className="mb-2 flex flex-wrap gap-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${r.premium ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                        {r.premium ? 'â­ Premium recipe' : 'ð Free recipe'}
                      </span>
                      {highProtein && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">ðª High Protein</span>
                      )}
                      {badge && (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">{badge.icon} {badge.label}</span>
                      )}
                      {special && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${special.decorative ? 'bg-amber-100 text-amber-800' : 'bg-green-50 text-green-700'}`}>
                          {special.icon} {special.label}
                        </span>
                      )}
                      {r.diets.map((d) => (
                        <span key={d} className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">
                          {DIET_ICON[d] || ''} {d}
                        </span>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-1 border-t border-dashed border-gray-100 pt-2 text-center">
                      <div>
                        <div className="text-sm font-extrabold text-green-700">{r.protein}g</div>
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
                </div>
                <div className="px-4 pb-3">
                  {locked ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
                      ð Premium â preview available
                    </span>
                  ) : (
                    <span className="block text-xs font-bold text-green-600">View recipe â</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {compact && (
          <div className="mt-8 text-center">
            <Link
              href="/recipes"
              className="inline-block rounded-full border border-white/25 bg-white/10 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-green-900"
            >
              Browse Recipes â
            </Link>
          </div>
        )}

        {compact && !isPremium && (
          <div className="mt-8 rounded-2xl border border-white/15 bg-white/5 p-8 text-center">
            <p className="mb-1 text-lg font-extrabold text-white">ð Unlock all {RECIPES.length} macro-tracked recipes</p>
            <p className="mx-auto mb-3 max-w-lg text-sm text-white/70">
              Meal prep, high-protein, quick, vegetarian, and family meals â every recipe photo, ingredient swap,
              and freezer tag, plus unlimited meal plans for â¬7.77/mo.
            </p>
            <div className="mb-5 flex flex-wrap justify-center gap-1.5">
              {['Meal prep', 'High-protein', 'Quick', 'Vegetarian', 'Family meals'].map((c) => (
                <span key={c} className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/80">
                  {c}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/recipes"
                className="rounded-full bg-white px-6 py-3 text-sm font-bold text-green-900 transition hover:bg-gray-100"
              >
                Browse Recipes â
              </Link>
              <button
                onClick={() => goTo('pricing')}
                className="rounded-full bg-green-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-green-400"
              >
                See Premium plans â
              </button>
            </div>
            <p className="mt-3 text-center text-xs text-white/60">7 days free Â· Cancel anytime, no fees</p>
          </div>
        )}
      </div>
      <RecipeModal
        recipe={active}
        onClose={() => setActive(null)}
        isFavorite={active ? favorites?.has(active.id) : false}
        isPremium={isPremium}
        onToggleFavorite={active ? (e) => handleHeartClick(e, active) : undefined}
      />
    {hoverPreview && (
      <div
        className={`pointer-events-none fixed z-50 -translate-x-1/2 ${hoverPreview.showBelow ? '' : '-translate-y-full'}`}
        style={{ left: hoverPreview.left, top: hoverPreview.top }}
      >
        <img
          src={hoverPreview.src}
          alt={hoverPreview.alt}
          className={`h-44 w-60 rounded-2xl border-4 border-white object-cover shadow-2xl ring-1 ring-black/10 ${hoverPreview.locked ? 'blur-[3px]' : ''}`}
        />
      </div>
    )}
    </section>
  );
}
