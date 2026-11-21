-- Parsel Haritası: bulut arşivi (bir kez çalıştırılır)
-- Supabase > SQL Editor > yapıştır > Run. Mevcut tablolara dokunmaz; yeni bir tablo ekler.
-- Her kullanıcı yalnızca KENDİ kayıtlarını görür/değiştirir (RLS).
begin;
create table if not exists public.parsel_arsiv (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  title text,
  n integer not null default 0,
  miss integer not null default 0,
  client_ts bigint,
  data text not null check (char_length(data) <= 8000000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, name)
);
alter table public.parsel_arsiv enable row level security;
drop policy if exists parsel_arsiv_select on public.parsel_arsiv;
drop policy if exists parsel_arsiv_insert on public.parsel_arsiv;
drop policy if exists parsel_arsiv_update on public.parsel_arsiv;
drop policy if exists parsel_arsiv_delete on public.parsel_arsiv;
create policy parsel_arsiv_select on public.parsel_arsiv for select to authenticated using (owner_id = auth.uid());
create policy parsel_arsiv_insert on public.parsel_arsiv for insert to authenticated with check (owner_id = auth.uid());
create policy parsel_arsiv_update on public.parsel_arsiv for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy parsel_arsiv_delete on public.parsel_arsiv for delete to authenticated using (owner_id = auth.uid());
grant select, insert, update, delete on public.parsel_arsiv to authenticated;
create or replace function public.parsel_arsiv_touch() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists parsel_arsiv_touch on public.parsel_arsiv;
create trigger parsel_arsiv_touch before update on public.parsel_arsiv for each row execute function public.parsel_arsiv_touch();
commit;
