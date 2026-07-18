# YourAiFood — production app

This replaces the static demo with a real Next.js app: real Claude-generated meal
plans, Supabase accounts, and Stripe subscriptions.

## What's here

- `app/page.js` + `components/` — the UI (planner, recipe gallery, pricing)
- `app/api/generate-plan` — calls Claude to pick a 7-day plan from the recipe
  catalog (the model only returns recipe ids; this app computes every number
  itself, so nutrition/cost is never hallucinated)
- `app/api/stripe/*` — checkout, billing portal, and webhook for the €7.99/mo plan
- `lib/recipes.js` — the same 20-recipe catalog from the demo
- `supabase/schema.sql` — the database schema (run this once in Supabase)

## 1. Create the accounts you need

You'll need three free accounts (this app has none of them yet — I can't create
accounts or enter payment details on your behalf):

1. **Supabase** — [supabase.com](https://supabase.com) → New Project. Once created,
   go to the SQL Editor and run everything in `supabase/schema.sql`. Then go to
   Project Settings → API to get your URL, `anon` key, and `service_role` key.
2. **Anthropic** — [console.anthropic.com](https://console.anthropic.com) → API Keys
   → Create Key. Add a small amount of credit (a few euros covers thousands of
   plan generations at Sonnet pricing).
3. **Stripe** — [dashboard.stripe.com](https://dashboard.stripe.com) → Product
   catalog → add a product "YourAiFood Premium" with a recurring price of €7.99/month.
   Copy the Price ID (`price_...`). Then get your Secret key from Developers → API keys.
   You'll add the webhook secret after deploying (step 3 below).

## 2. Set environment variables

Copy `.env.example` to `.env.local` for local testing, and add the same
variables in Vercel under Project → Settings → Environment Variables for
production.

## 3. Deploy

This is a full framework app now (not a single HTML file), so push it to a
GitHub repo and connect that repo to Vercel — that gives you automatic
redeploys every time you make a change, and is the standard way to run a
Next.js app. In Vercel: New Project → Import Git Repository → select this repo.

Once deployed, go to Stripe → Developers → Webhooks → Add endpoint, point it
at `https://youraifood.com/api/stripe/webhook`, select the
`checkout.session.completed`, `customer.subscription.updated`, and
`customer.subscription.deleted` events, and copy the signing secret into
`STRIPE_WEBHOOK_SECRET` in Vercel.

## 4. Local development

```
npm install
npm run dev
```

Note: this sandbox's network is locked down (no access to the npm registry),
so `npm install` could not be run or verified here — every file was checked
for correct syntax individually, but the actual build will run for the first
time either on your machine or on Vercel, which has full registry access.
If it fails there, send me the error and I'll fix it.
