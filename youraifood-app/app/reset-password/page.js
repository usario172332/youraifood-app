'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

// Landing page for the password-reset email link. Supabase puts a recovery
// session in the URL; once it is picked up we let the user choose a new password.
export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [checked, setChecked] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) { setChecked(true); return; }
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data && data.session) setReady(true);
      setTimeout(() => setChecked(true), 1500);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    if (password.length < 6) { setMsg('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setMsg('Passwords do not match.'); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setMsg(error.message);
    else setDone(true);
  }

  const input = 'rounded-lg border border-gray-200 px-3 py-2 text-sm';
  return (
    <div className="mx-auto max-w-sm px-5 py-16">
      <h1 className="text-2xl font-extrabold text-green-900">Reset your password</h1>
      {done ? (
        <div className="mt-4">
          <p className="text-sm text-ink-soft">Your password has been updated. You are signed in.</p>
          <a href="/" className="mt-4 inline-block rounded-full bg-green-600 px-5 py-2.5 text-sm font-bold text-white">Go to YourAiFood</a>
        </div>
      ) : ready ? (
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          <input type="password" required minLength={6} placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
          <input type="password" required minLength={6} placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} />
          {msg && <p className="text-xs text-red-600">{msg}</p>}
          <button type="submit" disabled={busy} className="rounded-full bg-green-600 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            {busy ? 'Please wait…' : 'Set new password'}
          </button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-ink-soft">
          {checked
            ? 'This reset link is invalid or has expired. Use "Forgot password?" in the sign-in box to get a new one.'
            : 'Checking your reset link…'}
        </p>
      )}
    </div>
  );
}
