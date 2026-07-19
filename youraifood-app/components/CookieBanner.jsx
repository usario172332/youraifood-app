'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'yaf-cookie-consent';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable (e.g. private browsing edge cases) — just skip the banner.
    }
  }, []);

  function respond(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[200] border-t border-gray-200 bg-white/95 backdrop-blur px-6 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex max-w-[1120px] flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-ink-soft">
          We use cookies to keep you signed in and to run this site. Some are required for the app to
          work (like staying logged in); others help us understand usage. See our{' '}
          <a href="/privacy" className="font-semibold text-green-700 underline">
            Privacy Policy
          </a>{' '}
          for details.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => respond('essential-only')}
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-ink-soft"
          >
            Essential only
          </button>
          <button
            onClick={() => respond('accepted')}
            className="rounded-full bg-green-600 px-4 py-2 text-sm font-bold text-white"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
