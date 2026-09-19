-- ============================================================================
-- Forecourt — used-car inventory & reconditioning dashboard
-- Migration 0001: schema, RLS policies, analytics view, RPC functions
--
-- Idempotent: safe to run more than once in the Supabase SQL editor.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. ENUMS
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.vehicle_status as enum ('sourcing', 'reconditioning', 'listed', 'sold');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.recon_category as enum
    ('mechanical', 'bodywork', 'detailing', 'tyres', 'electrical', 'paperwork');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. TABLES
-- ---------------------------------------------------------------------------

-- One profile per authenticated user. Created automatically on signup (see §6).
create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  display_name    text not null default 'Dealer',
  dealership_name text not null default 'My Dealership',
  created_at      timestamptz not null default now()
);

-- Main entity: a car in the dealer's inventory.
create table if not exists public.vehicles (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null default auth.uid()
                       references auth.users (id) on delete cascade,
  make               text not null,
  model              text not null,
  year               smallint not null check (year between 1950 and 2100),
  mileage_km         integer not null default 0 check (mileage_km >= 0),
  body_type          text,
  acquisition_price  numeric(12, 2) not null check (acquisition_price >= 0),
  asking_price       numeric(12, 2) check (asking_price >= 0),
  sold_price         numeric(12, 2) check (sold_price >= 0),
  status             public.vehicle_status not null default 'sourcing',
  acquired_on        date not null default current_date,
  sold_on            date,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  -- A car can only be sold if we know what it sold for, and vice versa.
  constraint sold_fields_consistent check (
    (status = 'sold' and sold_price is not null and sold_on is not null)
    or (status <> 'sold' and sold_price is null and sold_on is null)
  ),
  constraint sold_after_acquired check (sold_on is null or sold_on >= acquired_on)
);

-- Related entity: money spent preparing a specific car for sale.
create table if not exists public.reconditioning_jobs (
  id            uuid primary key default gen_random_uuid(),
  vehicle_id    uuid not null references public.vehicles (id) on delete cascade,
  owner_id      uuid not null default auth.uid()
                  references auth.users (id) on delete cascade,
  category      public.recon_category not null,
  description   text not null,
  cost          numeric(12, 2) not null check (cost >= 0),
  vendor        text,
  completed     boolean not null default false,
  performed_on  date not null default current_date,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. INDEXES
-- Every RLS policy filters on owner_id, so it leads each index: the planner
-- can then satisfy both the policy and the query from one index.
-- ---------------------------------------------------------------------------
create index if not exists vehicles_owner_status_idx
  on public.vehicles (owner_id, status);
create index if not exists vehicles_owner_acquired_idx
  on public.vehicles (owner_id, acquired_on desc);
create index if not exists recon_owner_vehicle_idx
  on public.reconditioning_jobs (owner_id, vehicle_id);
create index if not exists recon_vehicle_idx
  on public.reconditioning_jobs (vehicle_id);

-- ---------------------------------------------------------------------------
-- 4. updated_at MAINTENANCE
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists vehicles_touch_updated_at on public.vehicles;
create trigger vehicles_touch_updated_at
  before update on public.vehicles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
--
-- This is the security boundary for the whole application. The browser holds
-- the public anon key, so anyone can call the REST API directly — Postgres,
-- not the UI, is what refuses to return another dealer's rows.
--
-- auth.uid() is wrapped in a scalar subquery so Postgres evaluates it once per
-- statement (an InitPlan) instead of once per row.
-- ---------------------------------------------------------------------------
alter table public.profiles             enable row level security;
alter table public.vehicles             enable row level security;
alter table public.reconditioning_jobs  enable row level security;

-- profiles: a user sees and edits exactly one row — their own.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = (select auth.uid()));

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- vehicles: full CRUD, scoped to the owner.
drop policy if exists vehicles_select_own on public.vehicles;
create policy vehicles_select_own on public.vehicles
  for select to authenticated using (owner_id = (select auth.uid()));

drop policy if exists vehicles_insert_own on public.vehicles;
create policy vehicles_insert_own on public.vehicles
  for insert to authenticated with check (owner_id = (select auth.uid()));

-- USING guards which rows may be updated; WITH CHECK guards what they may
-- become — without the latter a user could hand their car to another owner_id.
drop policy if exists vehicles_update_own on public.vehicles;
create policy vehicles_update_own on public.vehicles
  for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

drop policy if exists vehicles_delete_own on public.vehicles;
create policy vehicles_delete_own on public.vehicles
  for delete to authenticated using (owner_id = (select auth.uid()));

-- reconditioning_jobs: same ownership rule, plus the parent vehicle must also
-- belong to the caller — otherwise a user could attach costs to a stranger's car.
drop policy if exists recon_select_own on public.reconditioning_jobs;
create policy recon_select_own on public.reconditioning_jobs
  for select to authenticated using (owner_id = (select auth.uid()));

drop policy if exists recon_insert_own on public.reconditioning_jobs;
create policy recon_insert_own on public.reconditioning_jobs
  for insert to authenticated with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id and v.owner_id = (select auth.uid())
    )
  );

drop policy if exists recon_update_own on public.reconditioning_jobs;
create policy recon_update_own on public.reconditioning_jobs
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id and v.owner_id = (select auth.uid())
    )
  );

drop policy if exists recon_delete_own on public.reconditioning_jobs;
create policy recon_delete_own on public.reconditioning_jobs
  for delete to authenticated using (owner_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- 6. SIGNUP HOOK
-- Runs as the definer because it writes to public.profiles on behalf of the
-- auth system, before the new user has a session of their own. search_path is
-- pinned to '' so a malicious schema on the caller's path cannot hijack it.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, dealership_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'dealership_name', 'My Dealership')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 7. ANALYTICS VIEW  (advanced option: server-computed analytics)
--
-- security_invoker = on is load-bearing. A Postgres view defaults to running
-- with the privileges of whoever CREATED it, which would bypass RLS entirely
-- and leak every dealership's economics through this one view. With
-- security_invoker the view executes as the CALLER, so the policies in §5
-- still apply to the underlying tables.
-- ---------------------------------------------------------------------------
create or replace view public.vehicle_economics
with (security_invoker = on) as
select
  v.id,
  v.owner_id,
  v.make,
  v.model,
  v.year,
  v.mileage_km,
  v.body_type,
  v.notes,
  v.status,
  v.acquired_on,
  v.sold_on,
  v.acquisition_price,
  v.asking_price,
  v.sold_price,
  coalesce(r.recon_total, 0)::numeric(12, 2)                        as recon_total,
  (v.acquisition_price + coalesce(r.recon_total, 0))::numeric(12, 2) as cost_basis,
  case
    when v.sold_price is not null
      then (v.sold_price - v.acquisition_price - coalesce(r.recon_total, 0))::numeric(12, 2)
  end                                                                as realised_margin,
  case
    when v.sold_price is null and v.asking_price is not null
      then (v.asking_price - v.acquisition_price - coalesce(r.recon_total, 0))::numeric(12, 2)
  end                                                                as projected_margin,
  case
    when v.sold_on is not null then (v.sold_on - v.acquired_on)
    else (current_date - v.acquired_on)
  end                                                                as days_in_stock
from public.vehicles v
left join (
  select vehicle_id, sum(cost) as recon_total
  from public.reconditioning_jobs
  group by vehicle_id
) r on r.vehicle_id = v.id;

-- ---------------------------------------------------------------------------
-- 8. RPC FUNCTIONS  (advanced option: server-computed analytics)
--
-- These aggregate inside Postgres and return a handful of rows. The browser
-- never downloads the raw inventory to add it up, which keeps the payload flat
-- as the dataset grows. All are security INVOKER, so RLS still scopes them.
-- ---------------------------------------------------------------------------

-- KPI tiles at the top of the dashboard.
create or replace function public.dashboard_stats()
returns table (
  fleet_count           bigint,
  capital_deployed      numeric,
  recon_spend_total     numeric,
  realised_margin_total numeric,
  sold_count            bigint,
  avg_days_in_stock     numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    count(*) filter (where status <> 'sold'),
    coalesce(sum(cost_basis) filter (where status <> 'sold'), 0),
    coalesce(sum(recon_total), 0),
    coalesce(sum(realised_margin) filter (where status = 'sold'), 0),
    count(*) filter (where status = 'sold'),
    coalesce(round(avg(days_in_stock) filter (where status <> 'sold'), 1), 0)
  from public.vehicle_economics;
$$;

-- Chart 1: cars sold and margin realised, by month.
create or replace function public.monthly_performance(months_back integer default 6)
returns table (
  month          date,
  acquired_count bigint,
  sold_count     bigint,
  realised_margin numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  with span as (
    select generate_series(
      date_trunc('month', current_date) - make_interval(months => greatest(months_back, 1) - 1),
      date_trunc('month', current_date),
      interval '1 month'
    )::date as month
  ),
  bought as (
    select date_trunc('month', acquired_on)::date as month, count(*) as n
    from public.vehicle_economics group by 1
  ),
  sold as (
    select date_trunc('month', sold_on)::date as month,
           count(*) as n, sum(realised_margin) as margin
    from public.vehicle_economics where status = 'sold' group by 1
  )
  select s.month,
         coalesce(b.n,0) as acquired_count,
         coalesce(x.n,0) as sold_count,
         coalesce(x.margin,0) as realised_margin
  from span s
  left join bought b on b.month = s.month
  left join sold   x on x.month = s.month
  order by s.month;
$$;

-- Chart 2: where reconditioning money actually goes.
create or replace function public.recon_by_category()
returns table (
  category   public.recon_category,
  total_cost numeric,
  job_count  bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select category, coalesce(sum(cost), 0) as total_cost, count(*) as job_count
  from public.reconditioning_jobs
  group by category
  order by total_cost desc;
$$;

-- ---------------------------------------------------------------------------
-- 9. REALTIME  (advanced option: real-time updates)
-- Adds the two mutable tables to Supabase's replication publication. Realtime
-- respects RLS, so a subscriber is only sent changes to rows they could read.
-- ---------------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.vehicles;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.reconditioning_jobs;
exception when duplicate_object then null; end $$;
