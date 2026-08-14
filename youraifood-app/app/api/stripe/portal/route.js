import { NextResponse } from 'next/server';
import { getStripe } from '../../../../lib/stripe';
import { getUserFromToken, supabaseAdmin } from '../../../../lib/supabaseAdmin';

// Lets a subscribed user manage or cancel their subscription via Stripe's
// hosted Customer Portal, instead of you building cancellation UI yourself.
export async function POST(req) {
  try {
    const stripe = getStripe();
    const admin = supabaseAdmin();
    if (!stripe || !admin) {
      return NextResponse.json({ error: 'Stripe is not configured on the server yet.' }, { status: 500 });
    }

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'No active subscription found.' }, { status: 400 });
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL;
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error('stripe portal error:', err);
    return NextResponse.json({ error: err.message || 'Could not open billing portal.' }, { status: 500 });
  }
}
