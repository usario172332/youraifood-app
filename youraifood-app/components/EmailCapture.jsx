'use client';

import { useState } from 'react';
import { buildFreePlanExport } from '../lib/freePlan';

export default function EmailCapture() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | done
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    setError('');
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'homepage_free_plan' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Something went wrong — please try again.');
        setStatus('idle');
        return;
      }
      const { downloadPlanPdf } = await import('../lib/pdfExport');
      await downloadPlanPdf(buildFreePlanExport());
      setStatus('done');
    } catch (err) {
      setError('Network error — please try again.');
      setStatus('idle');
    }
  }

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-[720px] rounded-[24px] border border-green-100 bg-green-50 p-8 text-center sm:p-10">
        <span className="mb-3 inline-block rounded-full bg-white px-3.5 py-1.5 text-[13px] font-bold text-green-700">
          Free download
        </span>
        <h2 className="mb-2 text-2xl font-extrabold text-green-900">Get a free 7-day high-protein meal plan</h2>
        <p className="mx-auto mb-5 max-w-md text-ink-soft">
          See exactly what's inside before you enter your email — delivered instantly as a PDF, no account needed.
        </p>

        <div className="mx-auto mb-2 max-w-sm rounded-2xl border border-green-200 bg-white p-4 text-left shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wide text-green-700">📄 Your 7-Day Plan</span>
            <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">PDF preview</span>
          </div>
          <div className="mb-3 grid grid-cols-7 gap-1">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} className="rounded-md bg-green-50 py-1.5 text-center text-[10px] font-bold text-green-700">
                {d}
              </div>
            ))}
          </div>
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-gray-50 p-2">
            <span className="text-lg">🍽️</span>
            <div className="flex-1">
              <div className="h-2 w-3/4 rounded bg-gray-200" />
              <div className="mt-1 h-2 w-1/2 rounded bg-gray-100" />
            </div>
            <span className="whitespace-nowrap rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              450 kcal
            </span>
          </div>
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-gray-50 p-2">
            <span className="text-lg">🛒</span>
            <div className="flex-1 space-y-1">
              <div className="h-1.5 w-full rounded bg-gray-200" />
              <div className="h-1.5 w-5/6 rounded bg-gray-200" />
              <div className="h-1.5 w-2/3 rounded bg-gray-200" />
            </div>
          </div>
          <div className="flex gap-2">
            <span className="flex-1 rounded-lg bg-green-50 py-1.5 text-center text-[10px] font-bold text-green-700">
              🔥 Calories
            </span>
            <span className="flex-1 rounded-lg bg-green-50 py-1.5 text-center text-[10px] font-bold text-green-700">
              💪 Macros
            </span>
          </div>
        </div>
        <p className="mb-6 text-xs font-semibold text-ink-soft">Preview of your personalised weekly meal plan.</p>

        {status === 'done' ? (
          <p className="font-bold text-green-800">
            ✓ Your plan is downloading now. Want one built around your own goals? Try the planner above.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mx-auto flex max-w-sm flex-col gap-2.5 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-full border-[1.5px] border-gray-200 px-4 py-2.5 text-sm"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="whitespace-nowrap rounded-full bg-green-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {status === 'loading' ? 'Sending…' : 'Send me the plan →'}
            </button>
          </form>
        )}
        {error && <p className="mt-3 text-sm font-semibold text-amber-700">{error}</p>}
        <p className="mt-4 text-xs text-ink-soft">
          We'll only use your email for meal-planning tips and product updates. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}
