-- Хуучин schema.sql-ийг ажиллуулсан DB дээр нэмэлтээр ажиллуулна (аюулгүй дахин ажиллуулж болно)
alter table public.movies add column if not exists updated_at timestamptz not null default now();

do $$ begin
  alter table public.movies add constraint movies_rating_range check (rating is null or (rating >= 0 and rating <= 10));
exception when duplicate_object then null; end $$;

create or replace function public.set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

drop trigger if exists movies_set_updated_at on public.movies;
create trigger movies_set_updated_at before update on public.movies
  for each row execute function public.set_updated_at();

create index if not exists movies_published_created_idx on public.movies (published, created_at desc);
create index if not exists movies_genres_gin on public.movies using gin (genres);
create extension if not exists pg_trgm;
create index if not exists movies_title_trgm on public.movies using gin (title gin_trgm_ops);
