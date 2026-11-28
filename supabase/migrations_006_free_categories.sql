-- "Үнэгүй" ангилал: энэ ангиллын кино Premium-гүй (нэвтрээгүй ч) хүнд үзэгдэнэ. Аюулгүй дахин ажиллуулж болно.
-- migrations_005_categories.sql-ийн дараа Supabase SQL Editor дээр ажиллуулна.
alter table public.categories add column if not exists is_free boolean not null default false;
update public.categories set is_free = true where name = 'Үнэгүй кино';
