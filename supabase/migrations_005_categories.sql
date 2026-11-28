-- Киноны ангиллыг admin-аас үүсгэдэг болгох. Аюулгүй дахин ажиллуулж болно.
-- Supabase Dashboard → SQL Editor дээр ажиллуулна.

create table if not exists public.categories (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 40),
  sort_order int not null default 0,
  show_on_home boolean not null default true,   -- нүүр хуудсанд мөр болгон харуулах
  is_hero boolean not null default false,       -- нүүрний том баннерт энэ ангиллын кино гарна
  created_at timestamptz not null default now()
);
create unique index if not exists categories_name_key on public.categories (lower(name));

alter table public.categories enable row level security;
drop policy if exists "categories read" on public.categories;
create policy "categories read" on public.categories for select using (true);
-- Бичих нь зөвхөн сервер (service role / admin API)

-- Кино бүр хэд хэдэн ангилалд орж болно
alter table public.movies add column if not exists category_ids bigint[] not null default '{}';
create index if not exists movies_category_ids_idx on public.movies using gin (category_ids);

-- Ангилал устгахад кинонуудаас автоматаар хасна
create or replace function public.categories_cleanup() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.movies set category_ids = array_remove(category_ids, old.id) where old.id = any(category_ids);
  return old;
end $$;
drop trigger if exists categories_cleanup on public.categories;
create trigger categories_cleanup after delete on public.categories
  for each row execute function public.categories_cleanup();

-- Анхны ангиллууд
insert into public.categories (name, sort_order, is_hero) values
  ('Онцлох',      1, true),
  ('Үнэгүй кино', 2, false),
  ('AI кино',     3, false),
  ('Хадмал',      4, false),
  ('Гадаад',      5, false)
on conflict do nothing;
