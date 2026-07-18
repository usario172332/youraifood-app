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

alter table public.profiles enable row level security;
alter table public.saved_plans enable row level security;

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
