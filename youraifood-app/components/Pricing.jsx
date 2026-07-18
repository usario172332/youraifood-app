'use client';

import { useState } from 'react';

export default function Pricing({ session, isPremium }) {
  const [loading, setLoading] = useState(false);

  async function goPremium() {
    if (!session) {
      alert('Sign in first, then hit Go Premium again.');
      return;
    }
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
    <section id="pricing" className="px-6 py-16">
      <div className="mx-auto max-w-[1120px]">
        <h2 className="text-center text-2xl font-extrabold text-green-900">Simple pricing</h2>
        <p className="mb-9 text-center text-ink-soft">
          Start free. Upgrade when you want the AI doing the heavy lifting every week.
        </p>
        <div className="mx-auto grid max-w-[760px] grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border-[1.5px] border-gray-200 p-7">
            <h3 className="text-lg font-extrabold text-green-900">Free</h3>
            <div className="my-2 text-3xl font-extrabold text-green-900">
              €0<span className="text-base font-semibold text-ink-soft">/month</span>
            </div>
            <ul className="mb-6 space-y-1.5 text-sm">
              {['Browse the recipe library', '5 AI meal plans / month', 'Shopping list generator', 'Basic nutrition info'].map((f) => (
                <li key={f} className="flex gap-2"><span className="font-bold text-green-600">✓</span>{f}</li>
              ))}
            </ul>
          </div>
          <div className="relative rounded-2xl border-[1.5px] border-green-600 p-7 shadow-lg">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-extrabold text-amber-950">
              MOST POPULAR
            </span>
            <h3 className="text-lg font-extrabold text-green-900">Premium</h3>
            <div className="my-2 text-3xl font-extrabold text-green-900">
              €7.99<span className="text-base font-semibold text-ink-soft">/month</span>
            </div>
            <ul className="mb-6 space-y-1.5 text-sm">
              {[
                'Unlimited AI meal plans',
                'Personalized calorie targets',
                'Macro tracking',
                'Pantry management',
                'Grocery list optimization',
                'Family planning tools',
                'Ingredient substitutions',
                'Save unlimited recipes',
              ].map((f) => (
                <li key={f} className="flex gap-2"><span className="font-bold text-green-600">✓</span>{f}</li>
              ))}
            </ul>
            {isPremium ? (
              <button
                onClick={manageSubscription}
                disabled={loading}
                className="w-full rounded-full bg-green-100 py-2.5 text-sm font-bold text-green-700"
              >
                Manage subscription
              </button>
            ) : (
              <button
                onClick={goPremium}
                disabled={loading}
                className="w-full rounded-full bg-green-600 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {loading ? 'Redirecting…' : 'Go Premium — €7.99/mo'}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
