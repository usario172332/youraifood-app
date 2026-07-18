import { createClient } from '@supabase/supabase-js';

// Server-only client using the service role key — bypasses Row Level
// Security, so this file must NEVER be imported from a 'use client' file
// or have its key exposed with a NEXT_PUBLIC_ prefix.
let cached = null;

export function supabaseAdmin() {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  cached = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}

// Verifies a user's access token (sent from the browser as a Bearer token)
// and returns the Supabase user object, or null if invalid.
export async function getUserFromToken(token) {
  const admin = supabaseAdmin();
  if (!admin || !token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error) return null;
  return data.user;
}
