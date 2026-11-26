-- 6 сарын (half) багц нэмнэ. Аюулгүй дахин ажиллуулж болно.
alter table public.plans drop constraint if exists plans_id_check;
alter table public.plans add constraint plans_id_check check (id in ('month','quarter','half','year'));

insert into public.plans (id, label, days, amount, sort_order) values
  ('half', '6 сар', 180, 27000, 3)
on conflict (id) do nothing;

update public.plans set sort_order = 4 where id = 'year';
