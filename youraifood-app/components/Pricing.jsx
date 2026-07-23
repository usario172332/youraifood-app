'use client';

import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';

const MONTHLY_PRICE = 7.77;
const YEARLY_PRICE = 76;
const YEARLY_MONTHLY_EQUIVALENT = (YEARLY_PRICE / 12).toFixed(2);
const YEARLY_SAVINGS_PCT = Math.round((1 - YEARLY_PRICE / (MONTHLY_PRICE * 12)) * 100);

const FREE_FEATURES = [
  'Access to 24 free recipes',
  '5 personalised weekly meal plans every month',
  'Full grocery lists for every plan',
  'No credit card required',
];

const PREMIUM_FEATURES = [
  {
    title: 'Plan every week without limits',
    text: 'A new personalised week whenever your goals or schedule change — no monthly cap.',
  },
  {
    title: 'Change your mind without starting over',
    text: "Swap out any meal or regenerate a single day without rebuilding the rest of your week.",
  },
  {
    title: 'Unlock the full recipe library',
    text: 'All 235 recipes whenever you need inspiration, not just the 24 free ones.',
  },
  {
    title: 'Fine-tune your targets anytime',
    text: 'Adjust your calorie and protein targets whenever your goals change.',
  },
];

export default function Pricing({ session, isPremium }) {
  const { requestSignIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [yearly, setYearly] = useState(false);

  function scrollToPlanner() {
    document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth' });
  }

  async function goPremium() {
    if (!session) {
      requestSignIn();
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
        <p className="mb-9 text-center text-ink-soft">
          Start free. Upgrade for flexibility — a new plan whenever your week changes, no limits, no waiting.
        </p>

        <div className="mb-9 flex flex-nowrap items-center justify-center gap-3">
          <span className={`shrink-0 whitespace-nowrap text-sm font-semibold ${!yearly ? 'text-green-900' : 'text-ink-soft'}`}>Monthly</span>
          <button
            type="button"
            role="switch"
            aria-checked={yearly}
            aria-label="Toggle yearly billing"
            onClick={() => setYearly((v) => !v)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 ${yearly ? 'bg-green-600' : 'bg-gray-300'}`}
          >
            <span
              className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                yearly ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`shrink-0 whitespace-nowrap text-sm font-semibold ${yearly ? 'text-green-900' : 'text-ink-soft'}`}>Yearly</span>
          <span className="shrink-0 whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-extrabold text-amber-800">
            Save {YEARLY_SAVINGS_PCT}%
          </span>
        </div>

        <div className="mx-auto grid max-w-[760px] grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex flex-col rounded-2xl border-[1.5px] border-gray-200 p-7">
            <h3 className="text-lg font-extrabold text-green-900">Free</h3>
            <div className="my-2 text-3xl font-extrabold text-green-900">
              €0<span className="text-base font-semibold text-ink-soft">/month</span>
            </div>
            <ul className="mb-3 flex-1 space-y-1.5 text-sm">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex gap-2"><span className="font-bold text-green-600">✓</span>{f}</li>
              ))}
            </ul>
            <p className="mb-6 text-[11px] text-ink-soft">
              Each new weekly plan you generate — including regenerating a full week — counts as one of your 5
              monthly plans. Replacing a single day doesn't count against this limit.
            </p>
            <a
              href="#planner"
              onClick={(e) => {
                e.preventDefault();
                scrollToPlanner();
              }}
              className="block w-full rounded-full bg-green-600 py-2.5 text-center text-sm font-bold text-white transition duration-200 hover:-translate-y-px hover:bg-green-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
            >
              Create My Free Meal Plan →
            </a>
          </div>
          <div className="relative flex flex-col rounded-2xl border-[1.5px] border-green-600 p-7 shadow-lg">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-extrabold text-amber-950">
              MOST POPULAR
            </span>
            <span className="text-xs font-extrabold uppercase tracking-wide text-green-600">Premium</span>
            <h3 className="text-lg font-extrabold text-green-900">Plan every week without limits</h3>
            <p className="mb-1 mt-0.5 text-xs font-bold text-green-700">
              Change your goals, replace meals, generate new weeks and access the complete recipe library whenever you need it.
            </p>
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
            <ul className="mb-6 flex-1 space-y-3 text-sm">
              {PREMIUM_FEATURES.map((f) => (
                <li key={f.title} className="flex gap-2">
                  <span className="mt-0.5 font-bold text-green-600">✓</span>
                  <span>
                    <span className="block font-extrabold text-green-900">{f.title}</span>
                    <span className="text-ink-soft">{f.text}</span>
                  </span>
                </li>
              ))}
            </ul>
            {isPremium ? (
              <>
                <button
                  onClick={manageSubscription}
                  disabled={loading}
                  className="w-full rounded-full bg-green-100 py-2.5 text-sm font-bold text-green-700 transition duration-200 hover:bg-green-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                >
                  Manage subscription
                </button>
                <p className="mt-2 text-center text-[11px] text-ink-soft">
                  Cancel anytime from the billing portal — no fees, no phone calls.
                </p>
              </>
            ) : (
              <>
                {!yearly && (
                  <p className="mb-2 text-center text-xs font-bold text-amber-700">
                    🔓 Unlock every Premium feature free for seven days.
                  </p>
                )}
                <button
                  onClick={goPremium}
                  disabled={loading}
                  className="w-full rounded-full border-[1.5px] border-green-600 bg-white py-2.5 text-sm font-bold text-green-700 transition duration-200 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:opacity-60"
                >
                  {loading
                    ? 'Redirecting…'
                    : yearly
                    ? `Upgrade to Premium — €${YEARLY_PRICE.toFixed(2)}/yr`
                    : `Start free trial — then €${MONTHLY_PRICE}/mo`}
                </button>
                <p className="mt-2 text-center text-[11px] font-semibold text-ink">
                  {yearly
                    ? `Payment details required — yearly bills €${YEARLY_PRICE.toFixed(2)} today. Cancel anytime.`
                    : 'Payment details required. You will not be charged until the 7-day trial ends — cancel anytime before then and pay nothing.'}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
