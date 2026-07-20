'use client';

import { useState } from 'react';

const MONTHLY_PRICE = 7.77;
const YEARLY_PRICE = 76;
const YEARLY_MONTHLY_EQUIVALENT = (YEARLY_PRICE / 12).toFixed(2);
const YEARLY_SAVINGS_PCT = Math.round((1 - YEARLY_PRICE / (MONTHLY_PRICE * 12)) * 100);

export default function Pricing({ session, isPremium }) {
  const [loading, setLoading] = useState(false);
  const [yearly, setYearly] = useState(false);

  async function goPremium() {
    if (!session) {
      alert('Sign in first, then hit Go Premium again.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ plan: yearly ? 'yearly' : 'monthly' }),
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
        <p className="mb-6 text-center text-ink-soft">
          Start free. Upgrade when you want the AI doing the heavy lifting every week — first 7 days on us.
        </p>

        <div className="mb-9 flex items-center justify-center gap-3">
          <span className={`text-sm font-semibold ${!yearly ? 'text-green-900' : 'text-ink-soft'}`}>Monthly</span>
          <button
            type="button"
            role="switch"
            aria-checked={yearly}
            onClick={() => setYearly((v) => !v)}
            className={`relative h-7 w-12 rounded-full transition-colors ${yearly ? 'bg-green-600' : 'bg-gray-300'}`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                yearly ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm font-semibold ${yearly ? 'text-green-900' : 'text-ink-soft'}`}>Yearly</span>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-extrabold text-amber-800">
            Save {YEARLY_SAVINGS_PCT}%
          </span>
        </div>

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
            {yearly ? (
              <>
                <div className="my-2 text-3xl font-extrabold text-green-900">
                  €{YEARLY_MONTHLY_EQUIVALENT}<span className="text-base font-semibold text-ink-soft">/month</span>
                </div>
                <div className="mb-2 text-xs font-semibold text-ink-soft">
                  Billed €{YEARLY_PRICE.toFixed(2)} once a year
                </div>
              </>
            ) : (
              <div className="my-2 text-3xl font-extrabold text-green-900">
                €{MONTHLY_PRICE}<span className="text-base font-semibold text-ink-soft">/month</span>
              </div>
            )}
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
              <>
                <button
                  onClick={goPremium}
                  disabled={loading}
                  className="w-full rounded-full bg-green-600 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                >
                  {loading
                    ? 'Redirecting…'
                    : yearly
                    ? `Go Premium — €${YEARLY_PRICE.toFixed(2)}/yr`
                    : `Start free trial — then €${MONTHLY_PRICE}/mo`}
                </button>
                <p className="mt-2 text-center text-[11px] text-ink-soft">
                  {yearly
                    ? `7-day free trial on monthly only — yearly bills €${YEARLY_PRICE.toFixed(2)} today. Cancel anytime.`
                    : '7 days free, then billed monthly. Cancel anytime before the trial ends and you won’t be charged.'}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
