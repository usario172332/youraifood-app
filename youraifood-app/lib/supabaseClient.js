'use client';

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Browser client — used for sign up / sign in / session in client components.
// Safe to expose: the anon key only grants what your Row Level Security
// policies (see supabase/schema.sql) allow.
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
