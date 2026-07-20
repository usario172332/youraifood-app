-- Run this once in your Supabase project's SQL editor (Project > SQL Editor > New query).

-- One row per user, mirroring auth.users, tracking plan/usage/billing state.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  is_premium boolean not null default false,
  plans_generated_this_month int not null default 0,
  usage_month text not null default to_char(now(), 'YYYY-MM'),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now()
);

-- History of generated plans, so users can revisit past weeks.
create table if not exists public.saved_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  inputs jsonb not null,
  plan_days jsonb not null,
  coach_note text,
  created_at timestamptz not null default now()
);

-- Recipes a user has favorited/saved. recipe_id refers to an id in the
-- static lib/recipes.js catalog, not a database row, so no foreign key here.
create table if not exists public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  recipe_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

-- Personal weight diary entries shown on the profile page.
create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  weight numeric not null,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Ratings & written reviews users leave on individual recipes, shown on the
-- recipe cards and modal as social proof. recipe_id refers to an id in the
-- static lib/recipes.js catalog, not a database row, so no foreign key here.
create table if not exists public.recipe_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  recipe_id text not null,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, recipe_id)
);

alter table public.profiles enable row level security;
alter table public.saved_plans enable row level security;
alter table public.favorites enable row level security;
alter table public.weight_logs enable row level security;
alter table public.recipe_reviews enable row level security;

-- Users can read/update only their own profile. The server API routes use
-- the service role key (which bypasses RLS) for the usage-limit checks and
-- Stripe webhook updates, so these policies only govern direct browser access.
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can view their own saved plans"
  on public.saved_plans for select
  using (auth.uid() = user_id);

create policy "Users can view their own favorites"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "Users can add their own favorites"
  on public.favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can remove their own favorites"
  on public.favorites for delete
  using (auth.uid() = user_id);

create policy "Users can view their own weight logs"
  on public.weight_logs for select
  using (auth.uid() = user_id);

create policy "Users can add their own weight logs"
  on public.weight_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own weight logs"
  on public.weight_logs for delete
  using (auth.uid() = user_id);

-- Reviews are public (they're the whole point — social proof for visitors
-- who aren't signed in yet), but only the author can write/edit/delete theirs.
create policy "Anyone can view recipe reviews"
  on public.recipe_reviews for select
  using (true);

create policy "Users can add their own reviews"
  on public.recipe_reviews for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own reviews"
  on public.recipe_reviews for update
  using (auth.uid() = user_id);

create policy "Users can delete their own reviews"
  on public.recipe_reviews for delete
  using (auth.uid() = user_id);

-- Aggregated per-recipe rating stats, used for star badges on cards without
-- pulling every individual review row.
create or replace view public.recipe_review_stats as
select recipe_id, count(*)::int as review_count, round(avg(rating)::numeric, 2) as average_rating
from public.recipe_reviews
group by recipe_id;

alter view public.recipe_review_stats set (security_invoker = true);

-- Keep a profile row's email in sync and auto-create one on signup.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
