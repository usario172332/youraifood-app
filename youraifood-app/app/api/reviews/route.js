import { NextResponse } from 'next/server';
import { getUserFromToken, supabaseAdmin } from '../../../lib/supabaseAdmin';

async function authedUser(req) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  return getUserFromToken(token);
}

// GET /api/reviews?summary=1            -> { summaries: { [recipeId]: { average, count } } } for all recipes
// GET /api/reviews?recipeId=nr1         -> { reviews, average, count, myReview }
export async function GET(req) {
  const admin = supabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Supabase is not configured on the server yet.' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const summary = searchParams.get('summary');
  const recipeId = searchParams.get('recipeId');

  if (summary) {
    const { data, error } = await admin
      .from('recipe_review_stats')
      .select('recipe_id, review_count, average_rating');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const summaries = {};
    for (const row of data) {
      summaries[row.recipe_id] = { average: Number(row.average_rating), count: row.review_count };
    }
    return NextResponse.json({ summaries });
  }

  if (!recipeId) {
    return NextResponse.json({ error: 'Missing recipeId.' }, { status: 400 });
  }

  const { data: reviews, error } = await admin
    .from('recipe_reviews')
    .select('id, rating, comment, created_at, user_id')
    .eq('recipe_id', recipeId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const count = reviews.length;
  const average = count ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10 : 0;

  const user = await authedUser(req);
  const mine = user ? reviews.find((r) => r.user_id === user.id) : null;

  // Strip user_id before sending to the client — reviewers stay anonymous.
  const publicReviews = reviews.map(({ id, rating, comment, created_at }) => ({ id, rating, comment, created_at }));

  return NextResponse.json({
    reviews: publicReviews,
    average,
    count,
    myReview: mine ? { rating: mine.rating, comment: mine.comment } : null,
  });
}

// POST /api/reviews  { recipeId, rating, comment } -> upsert the caller's own review
export async function POST(req) {
  const user = await authedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Sign in to leave a review.' }, { status: 401 });
  }
  const admin = supabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Supabase is not configured on the server yet.' }, { status: 500 });
  }

  const { recipeId, rating, comment } = await req.json();
  const ratingNum = Number(rating);
  if (!recipeId || !Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return NextResponse.json({ error: 'Provide a recipeId and a rating from 1-5.' }, { status: 400 });
  }
  const trimmedComment = typeof comment === 'string' ? comment.trim().slice(0, 500) : null;

  const { error } = await admin.from('recipe_reviews').upsert(
    {
      user_id: user.id,
      recipe_id: recipeId,
      rating: ratingNum,
      comment: trimmedComment || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,recipe_id' }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/reviews?recipeId=nr1 -> remove the caller's own review
export async function DELETE(req) {
  const user = await authedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Sign in to manage your review.' }, { status: 401 });
  }
  const admin = supabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Supabase is not configured on the server yet.' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const recipeId = searchParams.get('recipeId');
  if (!recipeId) return NextResponse.json({ error: 'Missing recipeId.' }, { status: 400 });

  const { error } = await admin.from('recipe_reviews').delete().eq('user_id', user.id).eq('recipe_id', recipeId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
