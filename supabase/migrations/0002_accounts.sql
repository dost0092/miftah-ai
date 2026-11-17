-- Miftah AI: user accounts (profiles + saved districts)
-- Run in Supabase: SQL Editor → paste → Run. Safe to run more than once.

create table if not exists public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  full_name          text,
  nationality        text,
  city               text check (city in ('riyadh','jeddah','makkah','madinah','other')),
  preferred_language text check (preferred_language in ('en','ar','ur','hi','zh')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.saved_districts (
  user_id       uuid not null references auth.users(id) on delete cascade,
  district_slug text not null,
  created_at    timestamptz not null default now(),
  primary key (user_id, district_slug)
);

alter table public.profiles        enable row level security;
alter table public.saved_districts enable row level security;

-- Each user can only see and change their own rows.
drop policy if exists "own profile select" on public.profiles;
create policy "own profile select" on public.profiles for select using (auth.uid() = id);
drop policy if exists "own profile insert" on public.profiles;
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

drop policy if exists "own saved select" on public.saved_districts;
create policy "own saved select" on public.saved_districts for select using (auth.uid() = user_id);
drop policy if exists "own saved insert" on public.saved_districts;
create policy "own saved insert" on public.saved_districts for insert with check (auth.uid() = user_id);
drop policy if exists "own saved delete" on public.saved_districts;
create policy "own saved delete" on public.saved_districts for delete using (auth.uid() = user_id);

-- Create a profile automatically when someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, preferred_language)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    case when new.raw_user_meta_data ->> 'preferred_language' in ('en','ar','ur','hi','zh')
         then new.raw_user_meta_data ->> 'preferred_language' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
