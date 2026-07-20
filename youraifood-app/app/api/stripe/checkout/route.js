import { NextResponse } from 'next/server';
import { getStripe } from '../../../../lib/stripe';
import { getUserFromToken, supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function POST(req) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured on the server yet.' }, { status: 500 });
    }

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
    }

    let { plan } = {};
    try {
      const body = await req.json();
      plan = body?.plan;
    } catch {
      // No JSON body sent — default to monthly for backwards compatibility.
    }
    const isYearly = plan === 'yearly';

    const priceId = isYearly ? process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID : process.env.STRIPE_PREMIUM_PRICE_ID;
    if (!priceId) {
      return NextResponse.json(
        { error: `${isYearly ? 'STRIPE_PREMIUM_YEARLY_PRICE_ID' : 'STRIPE_PREMIUM_PRICE_ID'} is not set.` },
        { status: 500 }
      );
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL;

    // Reuse an existing Stripe customer if we already created one for this user.
    const admin = supabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle();

    // 7-day free trial on the monthly plan only — yearly is a bigger up-front
    // commitment already, so it starts billing immediately.
    const subscriptionData = isYearly ? undefined : { trial_period_days: 7 };

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer: profile?.stripe_customer_id || undefined,
      customer_email: profile?.stripe_customer_id ? undefined : user.email,
      client_reference_id: user.id,
      success_url: `${origin}/?upgraded=1`,
      cancel_url: `${origin}/?upgrade_cancelled=1`,
      metadata: { supabase_user_id: user.id, plan: isYearly ? 'yearly' : 'monthly' },
      subscription_data: subscriptionData,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('stripe checkout error:', err);
    return NextResponse.json({ error: err.message || 'Could not start checkout.' }, { status: 500 });
  }
}
