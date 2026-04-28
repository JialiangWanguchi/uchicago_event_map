create extension if not exists pgcrypto;

create table if not exists public.events (
  id text primary key,
  slug text not null unique,
  title text not null,
  summary text,
  description text,
  start_at timestamptz not null,
  end_at timestamptz,
  timezone text,
  source_url text not null,
  image_url text,
  venue_name text,
  address text,
  location_text text,
  latitude double precision,
  longitude double precision,
  categories text[] not null default '{}',
  tags text[] not null default '{}',
  raw_payload jsonb not null default '{}'::jsonb,
  source_updated_at timestamptz,
  imported_at timestamptz not null default now()
);

create index if not exists events_start_at_idx on public.events (start_at);
create index if not exists events_slug_idx on public.events (slug);
create index if not exists events_categories_gin_idx on public.events using gin (categories);

create table if not exists public.saved_events (
  user_id text not null,
  event_id text not null references public.events(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

create index if not exists saved_events_user_id_idx on public.saved_events (user_id);

alter table public.events enable row level security;
alter table public.saved_events enable row level security;

drop policy if exists "public can read events" on public.events;
create policy "public can read events"
on public.events
for select
to anon, authenticated
using (true);

drop policy if exists "service role manages saved events" on public.saved_events;
create policy "service role manages saved events"
on public.saved_events
for all
to service_role
using (true)
with check (true);
