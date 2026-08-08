-- Off-chain yield strategy metadata for /strategies hub.
-- Matched to on-chain / demo strategies by `id` (text primary key).

create table if not exists public.strategies (
  id text primary key,
  name text not null,
  description text not null,
  protocol text not null,
  risk_level text not null check (risk_level in ('low', 'medium', 'high')),
  apy_pct numeric not null default 0,
  tvl_usd numeric not null default 0,
  sharpe numeric,
  utilization_pct numeric,
  health_factor numeric,
  weekly_pnl_pct numeric,
  tags text[] not null default '{}',
  narrative text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists strategies_protocol_idx on public.strategies (protocol);
create index if not exists strategies_risk_idx on public.strategies (risk_level);

alter table public.strategies enable row level security;

create policy "Allow public read strategies"
  on public.strategies for select
  using (true);

create policy "Allow public insert strategies"
  on public.strategies for insert
  with check (true);

create policy "Allow public update strategies"
  on public.strategies for update
  using (true)
  with check (true);
