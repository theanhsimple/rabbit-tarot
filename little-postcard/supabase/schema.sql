-- Little Postcard — DRAFT content schema (not yet applied to any project).
-- Matches src/lib/content/supabase-repository.ts. Review before use.

create table public.moods (
  slug        text primary key,
  label       text not null,
  description text not null default '',
  sort_order  int  not null default 0
);

create table public.categories (
  slug        text primary key,
  label       text not null,
  description text not null default '',
  sort_order  int  not null default 0
);

create table public.videos (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  title             text not null,
  description       text not null default '',
  short_description text not null default '',
  thumbnail_url     text not null,
  duration_seconds  int  not null check (duration_seconds > 0),
  category_slug     text not null references public.categories (slug),
  mood_slugs        text[] not null default '{}',
  published_at      timestamptz not null default now(),
  is_featured       boolean not null default false,
  status            text not null default 'draft' check (status in ('draft', 'published'))
);

create index videos_published_at_idx on public.videos (published_at desc) where status = 'published';
create index videos_mood_slugs_idx on public.videos using gin (mood_slugs);

-- Public read access to published content only.
alter table public.moods enable row level security;
alter table public.categories enable row level security;
alter table public.videos enable row level security;

create policy "public read moods" on public.moods for select using (true);
create policy "public read categories" on public.categories for select using (true);
create policy "public read published videos" on public.videos for select using (status = 'published');
