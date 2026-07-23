import { NextResponse } from 'next/server';
import { getStripe } from '../../../../lib/stripe';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { sendEmail, premiumConfirmationSubject, premiumConfirmationEmail, formatRenewalDate } from '../../../../lib/email';

// Stripe needs the raw, unparsed request body to verify the signature.
export async function POST(req) {
  const stripe = getStripe();
  const admin = supabaseAdmin();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !admin || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe/Supabase not fully configured.' }, { status: 500 });
  }

  const signature = req.headers.get('stripe-signature');
  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id || session.metadata?.supabase_user_id;
        if (userId) {
          await admin
            .from('profiles')
            .update({
              is_premium: true,
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription,
            })
            .eq('id', userId);
      if (userId && session.subscription) {
                try {
                            const subscription = await stripe.subscriptions.retrieve(session.subscription);
                            const { data: userData } = await admin.auth.admin.getUserById(userId);
                            const email = userData?.user?.email;
                            const priceItem = subscription.items.data[0];
                            const planInterval = priceItem?.price?.recurring?.interval || 'month';
                            const unitAmount = priceItem?.price?.unit_amount || 0;
                            const currency = priceItem?.price?.currency || 'eur';
                            const isTrial = subscription.status === 'trialing';
                            const renewalDateLabel = formatRenewalDate(subscription.current_period_end);
                            if (email) {
                                          await sendEmail({
                                                          to: email,
                                                          subject: premiumConfirmationSubject(),
                                                          ...premiumConfirmationEmail({ planInterval, unitAmount, currency, renewalDateLabel, isTrial }),
                                          });
                            }
                } catch (emailErr) {
                            console.error('Premium confirmation email failed:', emailErr);
                }
      }
        }
        break;
      }
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused': {
        const subscription = event.data.object;
        await admin
          .from('profiles')
          .update({ is_premium: false })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const isActive = subscription.status === 'active' || subscription.status === 'trialing';
        await admin
          .from('profiles')
          .update({ is_premium: isActive })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }
      default:
        break;
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook handling error:', err);
    return NextResponse.json({ error: 'Webhook handler failed.' }, { status: 500 });
  }
}
