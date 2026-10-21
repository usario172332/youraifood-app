import { NextResponse } from 'next/server';
import { getUserFromToken, supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { AI_RECIPE_CONFIG, limitsFor } from '../../../../lib/aiRecipeConfig';

// Saves a previously generated recipe. The client sends ONLY the request key;
// the recipe + nutrition are loaded from our own stored result, so a client
// cannot tamper with calories/macros before saving.
export async function POST(req) {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: 'Sign in to save recipes.' }, { status: 401 });
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Server is not configured.' }, { status: 500 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
  const key = String(body.requestKey || '');
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(key)) return NextResponse.json({ error: 'Invalid request key.' }, { status: 400 });

  const { data: reqRow } = await admin
    .from('ai_recipe_requests').select('status, result_json')
    .eq('user_id', user.id).eq('idempotency_key', key).maybeSingle();
  if (!reqRow || reqRow.status !== 'completed' || !reqRow.result_json) {
    return NextResponse.json({ error: 'Recipe not found. Generate it again.' }, { status: 404 });
  }

  // Already saved? (idempotent)
  const { data: dupe } = await admin
    .from('saved_recipes').select('id')
    .eq('user_id', user.id).contains('recipe_json', { meta: { requestKey: key } }).limit(1).maybeSingle();
  if (dupe) return NextResponse.json({ ok: true, id: dupe.id, alreadySaved: true });

  const { data: profile } = await admin.from('profiles').select('is_premium').eq('id', user.id).maybeSingle();
  const lim = limitsFor(!!(profile && profile.is_premium));

  const { recipe, nutrition, validation } = reqRow.result_json;
  const recipeJson = {
    ...recipe,
    nutrition,
    validation,
    meta: { requestKey: key, source: 'ai_generated', generatorVersion: AI_RECIPE_CONFIG.generatorVersion },
  };

  const { data: rows, error } = await admin.rpc('save_ai_recipe', {
    p_user_id: user.id,
    p_limit: lim.savedRecipes,
    p_title: recipe.title,
    p_description: recipe.description || null,
    p_recipe_json: recipeJson,
    p_normalized: recipe.ingredients,
    p_nutrition: nutrition.perServing,
    p_servings: recipe.servings,
    p_tags: recipe.dietaryTags || [],
    p_version: AI_RECIPE_CONFIG.generatorVersion,
  });
  if (error) {
    console.error('save_ai_recipe error:', error.message);
    return NextResponse.json({ error: 'Could not save the recipe.' }, { status: 500 });
  }
  const out = Array.isArray(rows) ? rows[0] : rows;
  if (out.outcome === 'limit') {
    return NextResponse.json({
      error: `Free accounts can save up to ${lim.savedRecipes} AI recipes. Delete one or go Premium for unlimited saves.`,
      code: 'save_limit', savedLimit: lim.savedRecipes,
    }, { status: 402 });
  }
  if (out.outcome === 'storage') {
    return NextResponse.json({ error: 'You have reached the storage safeguard for saved recipes. Delete some to save more.' }, { status: 409 });
  }
  return NextResponse.json({ ok: true, id: out.recipe_id, savedCount: out.saved_count });
}
