-- Avanth Studio · estadísticas del sitio
-- Pegá todo este archivo en Supabase → SQL Editor → New query → Run.

-- 1. Eventos: cada visita, sección vista y clic
create table if not exists public.events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  type text not null check (type in ('pageview', 'section', 'click')),
  label text check (char_length(label) <= 120),
  section text check (char_length(section) <= 60),
  path text check (char_length(path) <= 200),
  referrer text check (char_length(referrer) <= 200),
  visitor text check (char_length(visitor) <= 40),
  device text check (device in ('mobile', 'desktop'))
);
create index if not exists events_created_at_idx on public.events (created_at);

alter table public.events enable row level security;

-- El sitio solo puede agregar eventos, nunca leerlos
grant insert on public.events to anon;
drop policy if exists "sitio puede registrar eventos" on public.events;
create policy "sitio puede registrar eventos" on public.events
  for insert to anon with check (true);

-- 2. Quién puede ver el panel (emails de las cuentas creadas en Authentication → Users)
create table if not exists public.admins (email text primary key);
alter table public.admins enable row level security;
insert into public.admins (email) values ('avanth.studio@gmail.com') on conflict do nothing;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where email = auth.jwt() ->> 'email');
$$;

-- 3. Resumen para el panel (solo para admins)
create or replace function public.admin_stats(days int default 30) returns json
language plpgsql stable security definer set search_path = public as $$
declare
  since timestamptz := date_trunc('day', now() at time zone 'America/Argentina/Buenos_Aires')
                       at time zone 'America/Argentina/Buenos_Aires' - make_interval(days => days - 1);
  result json;
begin
  if not is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  with ev as (select * from events where created_at >= since)
  select json_build_object(
    'pageviews', (select count(*) from ev where type = 'pageview'),
    'visitors',  (select count(distinct visitor) from ev where type = 'pageview'),
    'clicks',    (select count(*) from ev where type = 'click'),
    'whatsapp',  (select count(*) from ev where type = 'click' and label ilike '%whatsapp%'),
    'daily', (
      select json_agg(json_build_object('day', d::date, 'pageviews', coalesce(c.n, 0), 'visitors', coalesce(c.v, 0)) order by d)
      from generate_series((since at time zone 'America/Argentina/Buenos_Aires')::date,
                           (now() at time zone 'America/Argentina/Buenos_Aires')::date, interval '1 day') d
      left join (
        select (created_at at time zone 'America/Argentina/Buenos_Aires')::date as day,
               count(*) as n, count(distinct visitor) as v
        from ev where type = 'pageview' group by 1
      ) c on c.day = d::date
    ),
    'top_clicks', (
      select coalesce(json_agg(t), '[]') from (
        select label, section, count(*) as n from ev where type = 'click'
        group by label, section order by n desc limit 15
      ) t
    ),
    'sections', (
      select coalesce(json_agg(t), '[]') from (
        select section, count(*) as n from ev where type = 'section'
        group by section order by n desc
      ) t
    ),
    'referrers', (
      select coalesce(json_agg(t), '[]') from (
        select coalesce(nullif(referrer, ''), 'Directo') as referrer, count(*) as n from ev where type = 'pageview'
        group by 1 order by n desc limit 8
      ) t
    ),
    'devices', (
      select coalesce(json_agg(t), '[]') from (
        select device, count(*) as n from ev where type = 'pageview' group by device order by n desc
      ) t
    )
  ) into result;
  return result;
end;
$$;

revoke all on function public.admin_stats(int) from public, anon;
grant execute on function public.admin_stats(int) to authenticated;
