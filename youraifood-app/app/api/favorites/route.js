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
    return NextResponse.json({ error: 'Sign in to view favorites.' }, { status: 401 });
  }
  const admin = supabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Supabase is not configured on the server yet.' }, { status: 500 });
  }

  const { data, error } = await admin
    .from('favorites')
    .select('recipe_id')
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ recipeIds: data.map((row) => row.recipe_id) });
}

export async function POST(req) {
  const user = await authedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Sign in to save favorites.' }, { status: 401 });
  }
  const admin = supabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Supabase is not configured on the server yet.' }, { status: 500 });
  }

  const { recipeId } = await req.json();
  if (!recipeId) {
    return NextResponse.json({ error: 'Missing recipeId.' }, { status: 400 });
  }

  const { error } = await admin
    .from('favorites')
    .upsert({ user_id: user.id, recipe_id: recipeId }, { onConflict: 'user_id,recipe_id' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const user = await authedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Sign in to manage favorites.' }, { status: 401 });
  }
  const admin = supabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Supabase is not configured on the server yet.' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const recipeId = searchParams.get('recipeId');
  if (!recipeId) {
    return NextResponse.json({ error: 'Missing recipeId.' }, { status: 400 });
  }

  const { error } = await admin
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('recipe_id', recipeId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
