-- Supabase Auth admin + Premium (Wire/QPay) – аюулгүй дахин ажиллуулж болно.
-- Supabase Dashboard → SQL Editor дээр ажиллуулна.

-- 1) Профайл (auth.users-тэй 1:1). role-ийг ЗӨВХӨН энд хадгална (user_metadata биш – түүнийг хэрэглэгч өөрөө засаж чадна).
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('user','admin')),
  premium_until timestamptz,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Хэрэглэгч зөвхөн өөрийн мөрийг УНШИНА. Insert/update/delete policy ОГТ байхгүй → role/premium-ийг
-- клиентээс өөрчлөх боломжгүй (зөвхөн service role / SQL Editor).
drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles for select using (auth.uid() = id);

-- Шинэ хэрэглэгч бүртгүүлэхэд профайл автоматаар үүсгэнэ
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email) on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Өмнө бүртгэгдсэн хэрэглэгчдийг нөхөж оруулна
insert into public.profiles (id, email)
select id, email from auth.users on conflict (id) do nothing;

-- 2) Admin шалгах функц (RLS policy-д ашиглана)
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

drop policy if exists "admin read all movies" on public.movies;
create policy "admin read all movies" on public.movies for select using (public.is_admin());

-- 3) Төлбөрүүд (Wire PaymentIntent бүрт нэг мөр)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null,
  amount bigint not null,
  currency text not null default 'MNT',
  status text not null default 'pending' check (status in ('pending','succeeded','failed','canceled')),
  wire_payment_intent_id text unique,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists payments_user_idx on public.payments (user_id, created_at desc);
alter table public.payments enable row level security;
drop policy if exists "payments read own" on public.payments;
create policy "payments read own" on public.payments for select using (auth.uid() = user_id);
-- Бичих policy байхгүй: зөвхөн сервер (service role) бичнэ.

-- 4) Төлбөр баталгаажихад Premium сунгах. Нэг төлбөрт ЗӨВХӨН нэг удаа (webhook давхар ирсэн ч аюулгүй).
create or replace function public.fulfill_payment(p_payment_id uuid, p_days int) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_user uuid;
begin
  update public.payments set status = 'succeeded', paid_at = now()
   where id = p_payment_id and status <> 'succeeded'
  returning user_id into v_user;
  if v_user is null then return false; end if;
  update public.profiles
     set premium_until = greatest(coalesce(premium_until, now()), now()) + make_interval(days => p_days)
   where id = v_user;
  return true;
end; $$;
revoke all on function public.fulfill_payment(uuid, int) from public, anon, authenticated;
grant execute on function public.fulfill_payment(uuid, int) to service_role;

-- 5) Эхний admin-аа томилох (өөрийн имэйлээр солиод ажиллуул):
-- update public.profiles set role = 'admin' where email = 'you@example.com';
