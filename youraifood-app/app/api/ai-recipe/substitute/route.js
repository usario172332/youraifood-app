import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getUserFromToken, supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { currentQuotaMonth, limitsFor } from '../../../../lib/aiRecipeConfig';
import { suggestSubstitutes, applySubstitution } from '../../../../lib/ingredientSwap';
import { INGREDIENTS } from '../../../../lib/ingredientNutrition';

// Ingredient substitution: deterministic (no LLM, no quota). The recipe is loaded
// from our own stored result, never from the client.
export async function POST(req) {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Server is not configured.' }, { status: 500 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
  const key = String(body.requestKey || '');
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(key)) return NextResponse.json({ error: 'Invalid request key.' }, { status: 400 });
  const action = body.action;
  const fromKey = String(body.fromKey || '');
  if (!INGREDIENTS[fromKey]) return NextResponse.json({ error: 'Unknown ingredient.' }, { status: 400 });
  const excluded = (Array.isArray(body.excluded) ? body.excluded : []).slice(0, 20).map((x) => String(x).slice(0, 40));

  const { data: row } = await admin
    .from('ai_recipe_requests').select('status, result_json')
    .eq('user_id', user.id).eq('idempotency_key', key).maybeSingle();
  if (!row || row.status !== 'completed' || !row.result_json) {
    return NextResponse.json({ error: 'Recipe not found. Generate it again.' }, { status: 404 });
  }
  const stored = row.result_json;

  if (action === 'suggest') {
    return NextResponse.json({ suggestions: suggestSubstitutes(stored, fromKey, excluded) });
  }

  if (action === 'apply') {
    const toKey = String(body.toKey || '');
    const { result, error } = applySubstitution(stored, fromKey, toKey, excluded);
    if (error) return NextResponse.json({ error }, { status: 422 });

    // Store as a NEW completed request row so it can be saved like any generated recipe.
    const newKey = randomBytes(18).toString('base64url');
    const { error: insErr } = await admin.from('ai_recipe_requests').insert({
      user_id: user.id,
      idempotency_key: newKey,
      month: currentQuotaMonth(),
      status: 'completed',
      model: 'substitution',
      result_json: result,
    });
    if (insErr) {
      console.error('substitute insert error:', insErr.message);
      return NextResponse.json({ error: 'Could not apply the substitution.' }, { status: 500 });
    }
    const { data: profile } = await admin.from('profiles').select('is_premium').eq('id', user.id).maybeSingle();
    const isPremium = !!(profile && profile.is_premium);
    const lim = limitsFor(isPremium);
    const { data: u } = await admin.from('ai_recipe_usage').select('used').eq('user_id', user.id).eq('month', currentQuotaMonth()).maybeSingle();
    const used = u ? u.used : 0;
    return NextResponse.json({
      ...result,
      requestKey: newKey,
      usage: { used, limit: lim.generationsPerMonth, remaining: Math.max(0, lim.generationsPerMonth - used), savedLimit: lim.savedRecipes, isPremium, resetsOn: 'first day of next month (UTC)' },
    });
  }

  return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
}
