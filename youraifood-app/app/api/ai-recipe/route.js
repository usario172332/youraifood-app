import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getUserFromToken, supabaseAdmin } from '../../../lib/supabaseAdmin';
import { AI_RECIPE_CONFIG, currentQuotaMonth, limitsFor } from '../../../lib/aiRecipeConfig';
import {
  sanitizeInput, checkFeasibility, runPipeline, buildResult, estimateCostUsd, RecipeValidationError,
} from '../../../lib/aiRecipeEngine';
import { makeGenerator } from '../../../lib/aiRecipeProvider';

export const maxDuration = 60;

async function authenticate(req) {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const user = await getUserFromToken(token);
  return user;
}

async function getPremium(admin, user) {
  const { data } = await admin.from('profiles').select('is_premium').eq('id', user.id).maybeSingle();
  return !!(data && data.is_premium);
}

async function getUsage(admin, userId, month) {
  const { data } = await admin.from('ai_recipe_usage').select('used').eq('user_id', userId).eq('month', month).maybeSingle();
  return data ? data.used : 0;
}

function usagePayload(used, isPremium) {
  const lim = limitsFor(isPremium);
  return {
    used,
    limit: lim.generationsPerMonth,
    remaining: Math.max(0, lim.generationsPerMonth - used),
    savedLimit: lim.savedRecipes,
    isPremium,
    resetsOn: 'first day of next month (UTC)',
  };
}

// GET: quota + the signed-in user's saved AI recipes
export async function GET(req) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: 'Sign in to use the recipe generator.' }, { status: 401 });
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Server is not configured.' }, { status: 500 });

  const isPremium = await getPremium(admin, user);
  const used = await getUsage(admin, user.id, currentQuotaMonth());
  const { data: saved, error } = await admin
    .from('saved_recipes')
    .select('id, title, description, recipe_json, nutrition_per_serving, servings, dietary_tags, source_type, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: 'Could not load saved recipes.' }, { status: 500 });
  return NextResponse.json({ usage: usagePayload(used, isPremium), saved: saved || [] });
}

// DELETE ?id=<uuid>: remove one of the user's saved recipes
export async function DELETE(req) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Server is not configured.' }, { status: 500 });
  const id = new URL(req.url).searchParams.get('id') || '';
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });
  const { error } = await admin.from('saved_recipes').delete().eq('id', id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: 'Could not delete recipe.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// POST: generate a recipe (quota-metered)
export async function POST(req) {
  const cfg = AI_RECIPE_CONFIG;
  let reservedKey = null;
  let admin = null;
  let user = null;
  try {
    user = await authenticate(req);
    if (!user) return NextResponse.json({ error: 'Sign in to generate a recipe.' }, { status: 401 });
    admin = supabaseAdmin();
    if (!admin) return NextResponse.json({ error: 'Server is not configured.' }, { status: 500 });

    let body;
    try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }

    const key = String(body.idempotencyKey || '');
    if (!/^[A-Za-z0-9_-]{16,64}$/.test(key)) return NextResponse.json({ error: 'Invalid request key.' }, { status: 400 });

    const parsed = sanitizeInput(body);
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const input = parsed.input;
    const feasibility = checkFeasibility(input);
    if (feasibility) return NextResponse.json({ error: feasibility, code: 'infeasible' }, { status: 422 });

    const isPremium = await getPremium(admin, user);
    const month = currentQuotaMonth();
    const lim = limitsFor(isPremium);
    const requestHash = createHash('sha256').update(JSON.stringify(input)).digest('hex');

    // Idempotent replay: same key already completed -> return stored result, no new quota.
    const { data: existing } = await admin
      .from('ai_recipe_requests').select('status, result_json, month')
      .eq('user_id', user.id).eq('idempotency_key', key).maybeSingle();
    if (existing) {
      if (existing.status === 'completed' && existing.result_json) {
        const used = await getUsage(admin, user.id, month);
        return NextResponse.json({ ...existing.result_json, requestKey: key, usage: usagePayload(used, isPremium), replayed: true });
      }
      return NextResponse.json({ error: 'This request is already being processed.' }, { status: 409 });
    }

    // Cache: identical request by the same user within the window (not for "regenerate").
    if (!body.regenerate) {
      const since = new Date(Date.now() - cfg.cacheHours * 3600 * 1000).toISOString();
      const { data: cached } = await admin
        .from('ai_recipe_requests').select('idempotency_key, result_json')
        .eq('user_id', user.id).eq('request_hash', requestHash).eq('status', 'completed').gte('created_at', since)
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (cached && cached.result_json) {
        const used = await getUsage(admin, user.id, month);
        return NextResponse.json({ ...cached.result_json, requestKey: cached.idempotency_key, usage: usagePayload(used, isPremium), cached: true });
      }
    }

    // Rate limit (DB-backed so it holds across serverless instances)
    const minuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { count } = await admin
      .from('ai_recipe_requests').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).gte('created_at', minuteAgo);
    if ((count || 0) >= cfg.rateLimitPerMinute) {
      return NextResponse.json({ error: 'Too many requests. Please wait a minute and try again.', code: 'rate_limited' }, { status: 429 });
    }

    // Atomic quota reservation
    const { data: rows, error: rpcError } = await admin.rpc('reserve_ai_recipe', {
      p_user_id: user.id, p_key: key, p_limit: lim.generationsPerMonth, p_month: month,
    });
    if (rpcError) throw rpcError;
    const reservation = Array.isArray(rows) ? rows[0] : rows;
    if (!reservation || reservation.outcome === 'limit') {
      return NextResponse.json({
        error: isPremium ? "You've used all your AI recipes for this month." : "You've used your free AI recipes for this month.",
        code: 'limit_reached',
        limitReached: true,
        usage: usagePayload(reservation ? reservation.used : lim.generationsPerMonth, isPremium),
      }, { status: 402 });
    }
    if (reservation.outcome === 'duplicate') {
      return NextResponse.json({ error: 'This request is already being processed.' }, { status: 409 });
    }
    reservedKey = key;

    // Generate -> normalise -> compute -> validate (provider injected)
    const generate = makeGenerator(cfg);
    const outcome = await runPipeline({ input, generate, cfg });
    const result = buildResult(outcome, input);
    const cost = estimateCostUsd(outcome.usage, cfg);

    await admin.from('ai_recipe_requests').update({
      status: 'completed',
      model: cfg.model,
      input_tokens: outcome.usage.inputTokens,
      output_tokens: outcome.usage.outputTokens,
      cost_usd: cost,
      attempts: outcome.usage.attempts,
      result_json: result,
      request_hash: requestHash,
    }).eq('user_id', user.id).eq('idempotency_key', key);
    reservedKey = null;

    console.log('ai-recipe ok', { model: cfg.model, attempts: outcome.usage.attempts, in: outcome.usage.inputTokens, out: outcome.usage.outputTokens, costUsd: Number(cost.toFixed(5)), status: result.validation.status });

    return NextResponse.json({ ...result, requestKey: key, usage: usagePayload(reservation.used, isPremium) });
  } catch (err) {
    // Refund the reserved generation on ANY failure.
    if (reservedKey && admin && user) {
      try { await admin.rpc('release_ai_recipe', { p_user_id: user.id, p_key: reservedKey }); } catch { /* best effort */ }
    }
    if (err instanceof RecipeValidationError) {
      console.warn('ai-recipe validation failed:', err.details.slice(0, 5));
      return NextResponse.json({ error: err.message, code: 'validation_failed', details: err.details.slice(0, 5), refunded: true }, { status: 422 });
    }
    console.error('ai-recipe error:', err && err.message);
    return NextResponse.json({ error: 'Recipe generation failed. You were not charged a generation — please try again.', code: 'generation_failed', refunded: true }, { status: 502 });
  }
}
