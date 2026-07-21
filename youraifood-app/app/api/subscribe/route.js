import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

// POST /api/subscribe  { email, source } -> store a lead-magnet email signup.
// No auth required — this is a public marketing capture, not a user account.
export async function POST(req) {
  const admin = supabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Supabase is not configured on the server yet.' }, { status: 500 });
  }

  const { email, source } = await req.json();
  const trimmed = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  if (!validEmail) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  const { error } = await admin
    .from('email_subscribers')
    .upsert(
      { email: trimmed, source: typeof source === 'string' ? source.slice(0, 100) : 'homepage_lead_magnet' },
      { onConflict: 'email', ignoreDuplicates: true }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
