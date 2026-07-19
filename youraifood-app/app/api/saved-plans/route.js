import { NextResponse } from 'next/server';
import { getUserFromToken, supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function GET(req) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const user = await getUserFromToken(token);
  if (!user) {
    return NextResponse.json({ error: 'Sign in to view past plans.' }, { status: 401 });
  }

  const admin = supabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Supabase is not configured on the server yet.' }, { status: 500 });
  }

  const { data, error } = await admin
    .from('saved_plans')
    .select('id, inputs, plan_days, coach_note, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ plans: data });
}
