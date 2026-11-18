-- Miftah AI: signed-in workspace + official knowledge library (RAG)
-- Run in Supabase: SQL Editor → paste → Run, or `npm run db:setup`. Safe to run more than once.
-- Seed data (sources, knowledge, districts, stats) is loaded by scripts/db-setup.mts.

-- ───────────────────────── Official knowledge (read-only, public) ─────────────────────────

create table if not exists public.official_sources (
  id          text primary key,
  name        text not null,
  name_ar     text,
  publisher   text,
  url         text not null,
  kind        text check (kind in ('regulator','ministry','platform','gazette','open-data')),
  description text,
  updated_at  timestamptz not null default now()
);

create table if not exists public.knowledge_documents (
  id         text primary key,
  title      text not null,
  title_ar   text,
  category   text not null,
  source_id  text references public.official_sources(id),
  url        text not null,
  effective  text,
  checked    date,
  status     text not null default 'needs_review' check (status in ('verified','needs_review','guidance')),
  summary    text,
  keywords   text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_chunks (
  id          bigint generated always as identity primary key,
  document_id text not null references public.knowledge_documents(id) on delete cascade,
  ord         int not null,
  content     text not null,
  -- document title + keywords (English and Arabic), so short questions still find the right chunk
  context     text not null default '',
  -- English stemming + a 'simple' pass so Arabic and other scripts still match word-for-word.
  fts         tsvector generated always as (
                setweight(to_tsvector('english', context), 'B') || setweight(to_tsvector('simple', context), 'B') ||
                setweight(to_tsvector('english', content), 'A') || setweight(to_tsvector('simple', content), 'A')
              ) stored,
  -- Optional semantic vector (e.g. 1024-dim); search works on fts alone when it is null.
  embedding   vector(1024),
  unique (document_id, ord)
);
create index if not exists knowledge_chunks_fts_idx on public.knowledge_chunks using gin (fts);

-- Ranked full-text search over the library. `terms` is an OR list such as 'rett | foreigner | jeddah'
-- built by the app from the user's question (only letters/digits, so it is safe for to_tsquery).
create or replace function public.search_knowledge(terms text, match_count int default 6)
returns table (
  chunk_id bigint, document_id text, ord int, content text, rank real,
  title text, category text, url text, status text, source_name text
)
language sql stable
set search_path = public
as $$
  with q as (
    select to_tsquery('english', terms) || to_tsquery('simple', terms) as tsq
  )
  select c.id, c.document_id, c.ord, c.content,
         ts_rank(c.fts, q.tsq) as rank,
         d.title, d.category, d.url, d.status, s.name
  from public.knowledge_chunks c
  join public.knowledge_documents d on d.id = c.document_id
  left join public.official_sources s on s.id = d.source_id
  cross join q
  where c.fts @@ q.tsq
  order by rank desc, c.document_id, c.ord
  limit greatest(1, least(match_count, 20));
$$;

create table if not exists public.fee_rules (
  id         text primary key,
  label      text not null,
  rate       numeric not null,
  applies_to text not null check (applies_to in ('buy','sell','both')),
  source_id  text references public.official_sources(id),
  url        text,
  status     text not null default 'needs_review' check (status in ('verified','needs_review','guidance')),
  updated_at timestamptz not null default now()
);

-- Districts gain a map position and a sample flag for statistics.
alter table public.districts add column if not exists lat double precision;
alter table public.districts add column if not exists lng double precision;
alter table public.district_stats add column if not exists source text not null default 'MOJ';
alter table public.district_stats add column if not exists is_sample boolean not null default false;

alter table public.official_sources    enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks    enable row level security;
alter table public.fee_rules           enable row level security;

drop policy if exists "sources are public" on public.official_sources;
create policy "sources are public" on public.official_sources for select using (true);
drop policy if exists "knowledge is public" on public.knowledge_documents;
create policy "knowledge is public" on public.knowledge_documents for select using (true);
drop policy if exists "chunks are public" on public.knowledge_chunks;
create policy "chunks are public" on public.knowledge_chunks for select using (true);
drop policy if exists "fees are public" on public.fee_rules;
create policy "fees are public" on public.fee_rules for select using (true);

-- ───────────────────────── Per-user workspace ─────────────────────────

-- Every meaningful action (search, map view, AI question, report, calculation).
-- Drives the dashboard counters and "pick up where you left off".
create table if not exists public.activity (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('search','map_view','chat','report','calc')),
  title      text not null,
  href       text,
  meta       jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists activity_user_idx on public.activity (user_id, created_at desc);

create table if not exists public.chat_threads (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists chat_threads_user_idx on public.chat_threads (user_id, updated_at desc);

create table if not exists public.chat_messages (
  id         bigint generated always as identity primary key,
  thread_id  uuid not null references public.chat_threads(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('user','assistant')),
  content    text not null,
  sources    jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_thread_idx on public.chat_messages (thread_id, id);

create table if not exists public.user_reports (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  type          text not null check (type in ('district','due_diligence','cost')),
  title         text not null,
  district_slug text,
  params        jsonb not null default '{}',
  created_at    timestamptz not null default now()
);
create index if not exists user_reports_user_idx on public.user_reports (user_id, created_at desc);

alter table public.activity      enable row level security;
alter table public.chat_threads  enable row level security;
alter table public.chat_messages enable row level security;
alter table public.user_reports  enable row level security;

do $$
declare t text;
begin
  foreach t in array array['activity','chat_threads','chat_messages','user_reports'] loop
    execute format('drop policy if exists "own select" on public.%I', t);
    execute format('create policy "own select" on public.%I for select using (auth.uid() = user_id)', t);
    execute format('drop policy if exists "own insert" on public.%I', t);
    execute format('create policy "own insert" on public.%I for insert with check (auth.uid() = user_id)', t);
    execute format('drop policy if exists "own update" on public.%I', t);
    execute format('create policy "own update" on public.%I for update using (auth.uid() = user_id)', t);
    execute format('drop policy if exists "own delete" on public.%I', t);
    execute format('create policy "own delete" on public.%I for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;
