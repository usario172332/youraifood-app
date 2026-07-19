import { NextResponse } from 'next/server';
import { getUserFromToken, supabaseAdmin } from '../../../lib/supabaseAdmin';

async function authedUser(req) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  return getUserFromToken(token);
}

export async function GET(req) {
  const user = await authedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Sign in to view your weight diary.' }, { status: 401 });
  }
  const admin = supabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Supabase is not configured on the server yet.' }, { status: 500 });
  }

  const { data, error } = await admin
    .from('weight_logs')
    .select('id, weight, logged_at')
    .eq('user_id', user.id)
    .order('logged_at', { ascending: false })
    .limit(90);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries: data });
}

export async function POST(req) {
  const user = await authedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Sign in to log your weight.' }, { status: 401 });
  }
  const admin = supabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Supabase is not configured on the server yet.' }, { status: 500 });
  }

  const { weight, loggedAt } = await req.json();
  const weightNum = Number(weight);
  if (!weightNum || weightNum <= 0 || weightNum > 500) {
    return NextResponse.json({ error: 'Enter a valid weight in kg.' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('weight_logs')
    .insert({ user_id: user.id, weight: weightNum, logged_at: loggedAt || new Date().toISOString() })
    .select('id, weight, logged_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entry: data });
}

export async function DELETE(req) {
  const user = await authedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Sign in to manage your weight diary.' }, { status: 401 });
  }
  const admin = supabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Supabase is not configured on the server yet.' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id.' }, { status: 400 });
  }

  const { error } = await admin.from('weight_logs').delete().eq('id', id).eq('user_id', user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
