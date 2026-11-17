-- Miftah AI — initial schema
-- Run in Supabase: SQL Editor → paste → Run  (or `supabase db push` with the Supabase CLI)

create extension if not exists postgis;
create extension if not exists vector;

-- ───────────────────────── Marketing / business ─────────────────────────

create table if not exists public.waitlist (
  id          bigint generated always as identity primary key,
  email       text not null unique,
  nationality text,
  city        text check (city in ('riyadh','jeddah','makkah','madinah','other')),
  role        text check (role in ('expat','investor','broker','business','other')),
  language    text check (language in ('en','ar','ur','hi','zh')),
  question    text,
  source      text,
  created_at  timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id         bigint generated always as identity primary key,
  name       text not null,
  email      text not null,
  company    text,
  topic      text check (topic in ('general','broker','data','press','other')),
  message    text not null,
  language   text,
  handled    boolean not null default false,
  created_at timestamptz not null default now()
);

-- ───────────────────────── Core data (from the build guide) ─────────────────────────

create table if not exists public.districts (
  id              serial primary key,
  slug            text unique not null,
  city            text not null,                 -- 'riyadh', 'jeddah'
  name_ar         text not null,
  name_en         text not null,                 -- our translation (key asset)
  geom            geometry(MultiPolygon, 4326),
  foreign_zone    text not null default 'unknown' check (foreign_zone in ('yes','no','conditional','unknown')),
  zone_source_url text,
  zone_checked_at date
);

create table if not exists public.transactions (
  id            bigserial primary key,
  source        text,                            -- 'MOJ', 'REGA'
  deal_date     date,
  city          text,
  district_id   int references public.districts(id),
  property_type text,                            -- apartment, villa, land, commercial
  area_sqm      numeric,
  price_sar     numeric,
  price_per_sqm numeric generated always as (price_sar / nullif(area_sqm, 0)) stored,
  quarter       text                             -- '2026-Q3'
);
create index if not exists transactions_district_quarter_idx on public.transactions (district_id, quarter, property_type);

create table if not exists public.district_stats (
  district_id   int references public.districts(id),
  quarter       text,
  property_type text,
  n_deals       int,
  median_ppsqm  numeric,
  p25_ppsqm     numeric,
  p75_ppsqm     numeric,
  data_until    date,
  primary key (district_id, quarter, property_type)
);

create table if not exists public.rules (
  id         serial primary key,
  title      text,
  source_url text,
  published  date,
  checked    date,
  chunk      text,
  embedding  vector(1024)
);

create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id),
  district_id int references public.districts(id),
  created_at  timestamptz default now(),
  pdf_path    text,
  paid        boolean default false
);

create table if not exists public.chat_logs (
  id         bigserial primary key,
  user_id    uuid references auth.users(id),
  lang       text,
  question   text,
  tools_used jsonb,
  answer     text,
  flagged    boolean default false,
  created_at timestamptz default now()
);

-- ───────────────────────── Row Level Security ─────────────────────────
-- Writes to waitlist / contact go through the server API (service role), so no public policies are needed.
alter table public.waitlist         enable row level security;
alter table public.contact_messages enable row level security;
alter table public.transactions     enable row level security;
alter table public.rules            enable row level security;
alter table public.reports          enable row level security;
alter table public.chat_logs        enable row level security;
alter table public.districts        enable row level security;
alter table public.district_stats   enable row level security;

-- Public, read-only aggregated data
drop policy if exists "districts are public" on public.districts;
create policy "districts are public" on public.districts for select using (true);
drop policy if exists "district stats are public" on public.district_stats;
create policy "district stats are public" on public.district_stats for select using (true);

-- Users can see their own reports
drop policy if exists "own reports" on public.reports;
create policy "own reports" on public.reports for select using (auth.uid() = user_id);
