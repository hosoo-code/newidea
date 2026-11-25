create table if not exists public.movies (
  id bigint generated always as identity primary key,
  title text not null,
  original_title text,
  overview text,
  poster_url text,
  backdrop_url text,
  release_year int,
  rating numeric(3,1) default 0,
  runtime int,
  genres text[] default '{}',
  video_url text,            -- iframe embed URL эсвэл шууд .mp4 / .m3u8
  tmdb_id int,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.movies enable row level security;

-- Зөвхөн нийтлэгдсэн киног нийтэд унших эрхтэй. Бичих нь service role-оор (admin API) хийгдэнэ.
create policy "public read published" on public.movies
  for select using (published = true);
