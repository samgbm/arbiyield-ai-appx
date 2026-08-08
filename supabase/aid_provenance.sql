-- Off-chain readable aid logistics details.
-- On-chain Stylus stores only checkpoint hashes (notary).
-- Run in the Supabase SQL editor once per project (or via MCP apply_migration).

create table if not exists public.aid_shipments (
  id uuid primary key default gen_random_uuid(),
  trail_code text not null unique,
  product_name text not null,
  origin_farm text not null,
  tip_hash text not null,
  tip_tx_hash text,
  is_flagged boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists aid_shipments_tip_hash_idx
  on public.aid_shipments (tip_hash);

create table if not exists public.aid_checkpoints (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.aid_shipments (id) on delete cascade,
  step_index integer not null check (step_index >= 0),
  step_type text not null check (step_type in ('farm', 'factory', 'depot', 'store')),
  location_name text not null,
  facility_id text,
  farm_name text,
  batch_weight_kg numeric,
  temperature_c numeric,
  sensor_id text,
  handler_name text,
  arrived_at timestamptz not null,
  departed_at timestamptz,
  parent_hash text,
  step_hash text not null unique,
  tx_hash text,
  created_at timestamptz not null default now(),
  unique (shipment_id, step_index)
);

create index if not exists aid_checkpoints_shipment_idx
  on public.aid_checkpoints (shipment_id, step_index);

create index if not exists aid_checkpoints_step_hash_idx
  on public.aid_checkpoints (step_hash);

alter table public.aid_shipments enable row level security;
alter table public.aid_checkpoints enable row level security;

create policy "Allow public read aid_shipments"
  on public.aid_shipments for select
  using (true);

create policy "Allow public insert aid_shipments"
  on public.aid_shipments for insert
  with check (true);

create policy "Allow public update aid_shipments"
  on public.aid_shipments for update
  using (true)
  with check (true);

create policy "Allow public read aid_checkpoints"
  on public.aid_checkpoints for select
  using (true);

create policy "Allow public insert aid_checkpoints"
  on public.aid_checkpoints for insert
  with check (true);

create policy "Allow public update aid_checkpoints"
  on public.aid_checkpoints for update
  using (true)
  with check (true);
