'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthWidget from './AuthWidget';
import { useAuth } from '../lib/AuthContext';

const LINKS = [
  { href: '/profile', label: '👤 My Profile' },
  { href: '/recipes', label: '🍽️ Recipes' },
  { href: '/#planner', label: '📅 Plan my week' },
  { href: '/#pricing', label: '💳 Pricing' },
];

export default function Sidebar() {
  const { isPremium } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

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
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-green-900"
        >
          {mobileOpen ? 'Close' : 'Menu'}
        </button>
      </div>

      <aside
        className={`z-30 w-64 shrink-0 border-r border-gray-100 bg-white px-5 py-6 md:sticky md:top-0 md:block md:h-screen ${
          mobileOpen ? 'block' : 'hidden'
        }`}
      >
        <Link href="/" className="mb-8 hidden items-center gap-2 text-xl font-extrabold text-green-900 md:flex">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
          YourAiFood
        </Link>

        <nav className="flex flex-col gap-1">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-ink hover:bg-green-50 hover:text-green-700"
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

        <div className="mt-8 border-t border-gray-100 pt-5">
          <AuthWidget compact />
        </div>
      </aside>
    </>
  );
}
