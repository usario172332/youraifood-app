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
        <p className="mx-auto mb-6 max-w-md text-ink-soft">
          Real recipes, a grocery list, and macros — as a PDF, instantly. No account needed.
        </p>
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
          Meal tips and product updates only. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}
