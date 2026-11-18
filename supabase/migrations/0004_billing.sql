-- Plans, Stripe subscriptions and metered usage.
-- Users can read their own rows; only the server (service role) writes, so usage cannot be reset from the browser.

create table if not exists public.subscriptions (
  user_id                uuid primary key references auth.users(id) on delete cascade,
  plan                   text not null default 'free' check (plan in ('free', 'pro')),
  status                 text not null default 'inactive',
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  updated_at             timestamptz not null default now()
);

create table if not exists public.usage_events (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('chat', 'report')),
  created_at timestamptz not null default now()
);
create index if not exists usage_events_user_kind_time on public.usage_events (user_id, kind, created_at desc);

alter table public.subscriptions enable row level security;
alter table public.usage_events enable row level security;

drop policy if exists "own select" on public.subscriptions;
create policy "own select" on public.subscriptions for select using (auth.uid() = user_id);
drop policy if exists "own select" on public.usage_events;
create policy "own select" on public.usage_events for select using (auth.uid() = user_id);
