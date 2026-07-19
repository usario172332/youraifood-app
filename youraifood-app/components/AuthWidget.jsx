'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';

export default function AuthWidget({ compact }) {
  const { user, handleAuthChange, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!supabase) {
    return (
      <span className="text-xs text-ink-soft">Auth not configured</span>
    );
  }

  if (user) {
    return (
      <div className={`flex ${compact ? 'flex-col items-start' : 'items-center'} gap-2 text-sm`}>
        <span className="truncate text-ink-soft">{user.email}</span>
        <button
          onClick={signOut}
          className="font-semibold text-green-700 hover:text-green-900"
        >
          Sign out
        </button>
      </div>
    );
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error: authError } =
        mode === 'signup'
          ? await supabase.auth.signUp({ email, password })
          : await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      if (data.user) {
        handleAuthChange(data.user, data.session);
        setOpen(false);
      } else if (mode === 'signup') {
        setError('Check your email to confirm your account, then sign in.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`rounded-full bg-green-600 px-4 py-2 text-sm font-bold text-white hover:-translate-y-px transition ${compact ? 'w-full' : ''}`}
      >
        Sign in
      </button>
      {open && (
        <div
          className={`absolute mt-2 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-xl z-50 ${
            compact ? 'left-0' : 'right-0'
          }`}
        >
          <div className="flex gap-2 mb-3 text-sm font-semibold">
            <button
              className={mode === 'signin' ? 'text-green-700' : 'text-ink-soft'}
              onClick={() => setMode('signin')}
            >
              Sign in
            </button>
            <span className="text-gray-300">|</span>
            <button
              className={mode === 'signup' ? 'text-green-700' : 'text-ink-soft'}
              onClick={() => setMode('signup')}
            >
              Create account
            </button>
          </div>
          <form onSubmit={submit} className="flex flex-col gap-2">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-full bg-green-600 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
