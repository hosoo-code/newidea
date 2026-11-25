-- Premium багцуудыг admin-аас засдаг болгох (сар / улирал / жил). Аюулгүй дахин ажиллуулж болно.
-- Supabase Dashboard → SQL Editor дээр ажиллуулна.

create table if not exists public.plans (
  id text primary key check (id in ('month','quarter','year')),
  label text not null,
  days int not null check (days > 0),
  amount bigint not null check (amount > 0),
  active boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.plans enable row level security;

-- Идэвхтэй багцыг бүгд унших эрхтэй; admin идэвхгүйг ч харна. Бичих нь зөвхөн сервер (service role).
drop policy if exists "plans read active" on public.plans;
create policy "plans read active" on public.plans for select using (active = true or public.is_admin());

insert into public.plans (id, label, days, amount, sort_order) values
  ('month',   '1 сар',    30,  9900,  1),
  ('quarter', '3 сар',    90,  26900, 2),
  ('year',    '1 жил',    365, 99000, 3)
on conflict (id) do nothing;

-- Төлбөр үүсэх үед олгох хоногийг хадгална (дараа нь admin үнэ/хоног солиход өмнөх төлбөр өөрчлөгдөхгүй)
alter table public.payments add column if not exists days int;
