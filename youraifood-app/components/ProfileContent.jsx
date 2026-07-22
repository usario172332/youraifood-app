'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { RECIPES, findRecipe } from '../lib/recipes';
import RecipeModal from './RecipeModal';
import { getHero } from '../lib/recipeMeta';

export default function ProfileContent() {
  const { user, session, isPremium, favorites, toggleFavorite, authReady } = useAuth();

  if (!authReady) return null;

  if (!user) {
    return (
      <div className="mx-auto max-w-[700px] px-6 py-20 text-center">
        <h1 className="mb-2 text-2xl font-extrabold text-green-900">My Profile</h1>
        <p className="text-ink-soft">Sign in from the sidebar to view your account, favorites, plans and weight diary.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[900px] px-6 py-12">
      <h1 className="mb-8 text-2xl font-extrabold text-green-900">My Profile</h1>
      <AccountCard user={user} session={session} isPremium={isPremium} />
      <FavoritesSection favorites={favorites} onToggleFavorite={toggleFavorite} />
      <PastPlansSection session={session} />
      <WeightDiarySection session={session} />
    </div>
  );
}

function AccountCard({ user, session, isPremium }) {
  const [loading, setLoading] = useState(false);

  async function goPremium() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || 'Could not start checkout.');
    } finally {
      setLoading(false);
    }
  }

  async function manageSubscription() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || 'Could not open billing portal.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mb-10 rounded-2xl border border-gray-200 p-6">
      <h2 className="mb-4 text-lg font-extrabold text-green-900">Account</h2>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-sm text-ink-soft">Signed in as</div>
          <div className="font-semibold text-ink">{user.email}</div>
          <span
            className={`mt-2 inline-block rounded-full px-3 py-1 text-[11px] font-extrabold ${
              isPremium ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-ink-soft'
            }`}
          >
            {isPremium ? '⭐ Premium' : 'Free plan'}
          </span>
        </div>
        {isPremium ? (
          <div className="text-right">
            <button
              onClick={manageSubscription}
              disabled={loading}
              className="rounded-full bg-green-100 px-5 py-2.5 text-sm font-bold text-green-700"
            >
              Manage subscription
            </button>
            <p className="mt-1.5 text-[11px] text-ink-soft">Cancel anytime, no fees</p>
          </div>
        ) : (
          <div className="text-right">
            <button
              onClick={goPremium}
              disabled={loading}
              className="rounded-full bg-green-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {loading ? 'Redirecting…' : 'Start free trial — then €7.77/mo'}
            </button>
            <p className="mt-1.5 text-[11px] text-ink-soft">7 days free. Cancel anytime, no fees.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function FavoritesSection({ favorites, onToggleFavorite }) {
  const [active, setActive] = useState(null);
  const favRecipes = RECIPES.filter((r) => favorites?.has(r.id));

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-lg font-extrabold text-green-900">Favorited recipes</h2>
      {favRecipes.length === 0 ? (
        <p className="text-sm text-ink-soft">
          No favorites yet — tap the heart icon on any recipe card to save it here.{' '}
          <a href="/recipes" className="font-semibold text-green-700 underline">Browse the recipe library →</a>
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {favRecipes.map((r) => {
            const hero = getHero(r);
            return (
              <div
                key={r.id}
                onClick={() => setActive(r)}
                className="relative cursor-pointer overflow-hidden rounded-xl border border-gray-200 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite?.(r.id);
                  }}
                  className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-xs shadow"
                  aria-label="Remove from favorites"
                >
                  ❤️
                </button>
                {r.image ? (
                  <img src={r.image} alt={r.name} className="h-14 w-full object-cover" />
                ) : (
                  <div className={`flex h-14 items-center justify-center bg-gradient-to-br ${hero.gradient} text-2xl`}>
                    {hero.emoji}
                  </div>
                )}
                <div className="p-3">
                  <div className="text-[10px] font-extrabold uppercase tracking-wide text-green-600">{r.meal}</div>
                  <div className="mt-1 text-sm font-bold text-green-900">{r.name}</div>
                  <div className="mt-1 text-xs text-ink-soft">{r.protein}g protein · {r.cal} kcal</div>
                </div>
              </div>
          );
          })}
        </div>
      )}
      <RecipeModal
        recipe={active}
        onClose={() => setActive(null)}
        isFavorite={active ? favorites?.has(active.id) : false}
        onToggleFavorite={active ? () => onToggleFavorite?.(active.id) : undefined}
      />
    </section>
  );
}

const PAST_PLANS_PREVIEW_COUNT = 5;

function PastPlansSection({ session }) {
  const [plans, setPlans] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch('/api/saved-plans', { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((res) => (res.ok ? res.json() : { plans: [] }))
      .then((data) => setPlans(data.plans || []))
      .catch(() => setPlans([]));
  }, [session]);

  const visiblePlans = plans ? (showAll ? plans : plans.slice(0, PAST_PLANS_PREVIEW_COUNT)) : [];
  const hiddenCount = plans ? plans.length - visiblePlans.length : 0;

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-lg font-extrabold text-green-900">Past generated plans</h2>
      {plans === null ? (
        <p className="text-sm text-ink-soft">Loading…</p>
      ) : plans.length === 0 ? (
        <p className="text-sm text-ink-soft">
          No plans generated yet.{' '}
          <a href="/#planner" className="font-semibold text-green-700 underline">Build your first week →</a>
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {visiblePlans.map((p) => {
              const isOpen = expanded === p.id;
              return (
                <div key={p.id} className="rounded-xl border border-gray-200 p-4">
                  <button
                    onClick={() => setExpanded(isOpen ? null : p.id)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <div>
                      <div className="text-sm font-bold text-green-900">
                        {new Date(p.created_at).toLocaleDateString()} · {p.inputs?.goal || 'plan'}
                      </div>
                      {p.coach_note && <div className="mt-0.5 text-xs text-ink-soft line-clamp-1">{p.coach_note}</div>}
                    </div>
                    <span className="text-xs font-bold text-green-600">{isOpen ? 'Hide' : 'View'}</span>
                  </button>
                  {isOpen && (
                    <div className="mt-3 space-y-2 border-t border-dashed border-gray-100 pt-3">
                      {(p.plan_days || []).map((row, i) => {
                        // Supports both the current format (arrays of dishes
                        // per slot, e.g. breakfastDishes: [{id, servings}]) and
                        // older saved plans (a single recipe id string per slot).
                        const names = [];
                        Object.entries(row).forEach(([key, value]) => {
                          if (key === 'day') return;
                          if (Array.isArray(value)) {
                            value.forEach((dish) => {
                              const name = findRecipe(dish?.id)?.name;
                              if (name) names.push(dish.servings > 1 ? `${name} (×${dish.servings})` : name);
                            });
                          } else {
                            const name = findRecipe(value)?.name;
                            if (name) names.push(name);
                          }
                        });
                        return (
                          <div key={row.day || i} className="text-sm">
                            <span className="font-semibold text-green-900">{row.day}: </span>
                            {names.join(' · ')}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {!showAll && hiddenCount > 0 && (
            <button
              onClick={() => setShowAll(true)}
              className="mt-3 rounded-full border border-gray-200 px-4 py-2 text-xs font-bold text-green-700 hover:bg-green-50"
            >
              Show {hiddenCount} more {hiddenCount === 1 ? 'plan' : 'plans'} ↓
            </button>
          )}
        </>
      )}
    </section>
  );
}

function WeightDiarySection({ session }) {
  const [entries, setEntries] = useState(null);
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function loadEntries() {
    if (!session) return;
    fetch('/api/weight', { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((res) => (res.ok ? res.json() : { entries: [] }))
      .then((data) => setEntries(data.entries || []))
      .catch(() => setEntries([]));
  }

  useEffect(loadEntries, [session]);

  async function addEntry(e) {
    e.preventDefault();
    setError('');
    const w = Number(weight);
    if (!w || w <= 0) {
      setError('Enter a valid weight.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ weight: w }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Could not save entry.');
        return;
      }
      setWeight('');
      loadEntries();
    } finally {
      setSaving(false);
    }
  }

  async function removeEntry(id) {
    await fetch(`/api/weight?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    loadEntries();
  }

  return (
    <section>
      <h2 className="mb-4 text-lg font-extrabold text-green-900">Weight diary</h2>
      <form onSubmit={addEntry} className="mb-5 flex items-end gap-3">
        <div>
          <label className="mb-1 block text-[13px] font-bold text-ink">Log today&apos;s weight (kg)</label>
          <input
            type="number"
            step="0.1"
            min="1"
            max="500"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-40 rounded-lg border-[1.5px] border-gray-200 px-3 py-2.5 text-sm"
            placeholder="e.g. 78.5"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-green-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Add entry'}
        </button>
      </form>
      {error && <p className="mb-3 text-sm font-semibold text-amber-700">{error}</p>}

      {entries === null ? (
        <p className="text-sm text-ink-soft">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-ink-soft">No entries yet — log your weight above to start tracking.</p>
      ) : (
        <ul className="rounded-xl border border-gray-200">
          {entries.map((e, i) => {
            const prev = entries[i + 1];
            const delta = prev ? +(e.weight - prev.weight).toFixed(1) : null;
            return (
              <li
                key={e.id}
                className="flex items-center justify-between border-b border-dashed border-gray-100 px-4 py-2.5 text-sm last:border-b-0"
              >
                <span className="text-ink-soft">{new Date(e.logged_at).toLocaleDateString()}</span>
                <span className="font-bold text-green-900">{e.weight} kg</span>
                {delta !== null && (
                  <span className={`text-xs font-semibold ${delta > 0 ? 'text-amber-600' : delta < 0 ? 'text-green-600' : 'text-ink-soft'}`}>
                    {delta > 0 ? `+${delta}` : delta} kg
                  </span>
                )}
                <button onClick={() => removeEntry(e.id)} className="text-xs font-semibold text-ink-soft hover:text-red-600">
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
