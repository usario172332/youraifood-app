import Stripe from 'stripe';

let client = null;
export function getStripe() {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  client = new Stripe(key, { apiVersion: '2024-06-20' });
  return client;
}
