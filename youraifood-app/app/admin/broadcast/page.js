'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

// Admin-only control panel for the update email. The API route rejects anyone
// who is not the admin account, so this page is harmless to other visitors.
export default function BroadcastAdmin() {
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState('');
  const [armed, setArmed] = useState(false);

  async function run(mode) {
    if (mode === 'all' && !armed) { setArmed(true); return; }
    setArmed(false);
    setBusy(true);
    setOut('Working...');
    try {
      const { data } = await supabase.auth.getSession();
      const token = data && data.session ? data.session.access_token : null;
      if (!token) { setOut('Sign in as the admin account first.'); return; }
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ mode }),
      });
      setOut(`${res.status}\n${JSON.stringify(await res.json(), null, 2)}`);
    } catch (e) {
      setOut(`Error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  const btn = 'rounded-full px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50';
  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <h1 className="text-2xl font-extrabold text-green-900">Update email</h1>
      <p className="mt-2 text-sm text-ink-soft">Preview the audience, send yourself a test, then send to everyone. Each account is emailed at most once per campaign.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" disabled={busy} onClick={() => run('preview')} className={`${btn} bg-gray-600`}>Preview audience</button>
        <button type="button" disabled={busy} onClick={() => run('test')} className={`${btn} bg-green-600`}>Send test to me</button>
        <button type="button" disabled={busy} onClick={() => run('all')} className={`${btn} bg-red-600`}>{armed ? 'Click again to confirm: send to all' : 'Send to all'}</button>
      </div>
      <pre className="mt-6 whitespace-pre-wrap rounded-xl bg-gray-50 p-4 text-xs text-gray-800">{out}</pre>
    </div>
  );
}
