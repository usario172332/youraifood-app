'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthWidget from './AuthWidget';
import { useAuth } from '../lib/AuthContext';

// Logged-out visitors see Recipes / How It Works / Pricing / Create Free Plan,
// with Sign In available via the AuthWidget below the nav. "My Profile" only
// appears once someone is actually signed in.
function getLinks(user) {
  const base = [
    { href: '/recipes', label: '🍽️ Recipes' },
    { href: '/tips', label: '🧰 Useful Tips' },
    { href: '/#how-it-works', label: '📋 How It Works' },
    { href: '/#pricing', label: '💳 Pricing' },
  ];
  if (user) {
    return [{ href: '/profile', label: '👤 My Profile' }, ...base, { href: '/#planner', label: '📅 Plan my week' }];
  }
  return [...base, { href: '/#planner', label: '✨ Create Free Plan' }];
}

export default function Sidebar() {
  const { user, isPremium, signInPrompt } = useAuth();
  const LINKS = getLinks(user);
  const [mobileOpen, setMobileOpen] = useState(false);

  // When something elsewhere on the site asks the visitor to sign in (e.g. an
  // unauthenticated "Go Premium" click), open the mobile menu if it's
  // collapsed and scroll the sign-in box into view so it's obvious where to go.
  useEffect(() => {
    if (!signInPrompt) return;
    setMobileOpen(true);
    requestAnimationFrame(() => {
      document.getElementById('auth-widget')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [signInPrompt]);

  return (
    <>
      {/* Mobile top bar with a toggle — the sidebar itself is hidden on small screens */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold text-green-900">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
          YourAiFood
        </Link>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-green-900 transition duration-200 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
        >
          {mobileOpen ? 'Close' : 'Menu'}
        </button>
      </div>

      <aside
        id="mobile-nav"
        className={`z-30 w-64 shrink-0 border-r border-gray-100 bg-white px-5 py-6 md:sticky md:top-0 md:block md:h-screen ${
          mobileOpen ? 'block' : 'hidden'
        }`}
      >
        <Link href="/" className="mb-8 hidden items-center gap-2 text-xl font-extrabold text-green-900 md:flex">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
          YourAiFood
        </Link>

        <nav className="flex flex-col gap-1" aria-label="Main navigation">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => {
                              setMobileOpen(false);
                              if (l.href.startsWith('/#') && window.location.pathname === '/') {
                                                const targetId = l.href.slice(2);
                                                const targetEl = document.getElementById(targetId);
                                                if (targetEl) {
                                                                    e.preventDefault();
                                                                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                                    window.history.pushState(null, '', l.href);
                                                }
                              }
              }}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-ink transition duration-200 hover:bg-green-50 hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {isPremium && (
          <span className="mt-4 inline-block rounded-full bg-amber-100 px-3 py-1 text-[11px] font-extrabold text-amber-700">
            ⭐ Premium
          </span>
        )}

        <div id="auth-widget" className="mt-8 border-t border-gray-100 pt-5">
          <AuthWidget compact openSignal={signInPrompt} />
        </div>
      </aside>
    </>
  );
}
