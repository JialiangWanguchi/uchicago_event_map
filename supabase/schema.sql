create extension if not exists pgcrypto;
create extension if not exists vector;

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
  geocode_source text,
  categories text[] not null default '{}',
  tags text[] not null default '{}',
  raw_payload jsonb not null default '{}'::jsonb,
  source_updated_at timestamptz,
  imported_at timestamptz not null default now()
);

alter table public.events add column if not exists embedding vector(1536);
alter table public.events add column if not exists embed_hash text;
alter table public.events add column if not exists geocode_source text;

create index if not exists events_embedding_idx on public.events using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create or replace function match_events(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  exclude_id text default null
)
returns table (
  id text,
  slug text,
  title text,
  start_at timestamptz,
  end_at timestamptz,
  venue_name text,
  location_text text,
  categories text[],
  similarity float
)
language sql stable
as $$
  select
    events.id,
    events.slug,
    events.title,
    events.start_at,
    events.end_at,
    events.venue_name,
    events.location_text,
    events.categories,
    1 - (events.embedding <=> query_embedding) as similarity
  from events
  where events.embedding is not null
    and events.start_at >= now()
    and 1 - (events.embedding <=> query_embedding) > match_threshold
    and (exclude_id is null or events.id != exclude_id)
  order by events.embedding <=> query_embedding
  limit match_count;
$$;

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
