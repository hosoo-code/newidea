-- Нэг киног тусад нь худалдаж авах ("4K" = 4,000₮). Supabase → SQL Editor дээр ажиллуул. Deploy хийхээс ӨМНӨ.
-- Аюулгүй дахин ажиллуулж болно.

create table if not exists public.movie_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id bigint not null references public.movies(id) on delete cascade,
  payment_id uuid references public.payments(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, movie_id)
);
alter table public.movie_purchases enable row level security;
drop policy if exists "movie_purchases read own" on public.movie_purchases;
create policy "movie_purchases read own" on public.movie_purchases for select using (auth.uid() = user_id);
-- Бичих policy байхгүй: зөвхөн сервер (service role) бичнэ.

alter table public.payments add column if not exists movie_id bigint references public.movies(id) on delete set null;

-- Киноны төлбөр баталгаажихад эрх олгоно. Нэг төлбөрт ЗӨВХӨН нэг удаа (webhook давхар ирсэн ч аюулгүй).
create or replace function public.fulfill_movie_payment(p_payment_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_user uuid; v_movie bigint;
begin
  update public.payments set status = 'succeeded', paid_at = now()
   where id = p_payment_id and status <> 'succeeded' and movie_id is not null
  returning user_id, movie_id into v_user, v_movie;
  if v_user is null then return false; end if;
  insert into public.movie_purchases (user_id, movie_id, payment_id)
  values (v_user, v_movie, p_payment_id)
  on conflict (user_id, movie_id) do nothing;
  return true;
end; $$;
revoke all on function public.fulfill_movie_payment(uuid) from public, anon, authenticated;
grant execute on function public.fulfill_movie_payment(uuid) to service_role;
