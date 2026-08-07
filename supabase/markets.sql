-- Off-chain market metadata (titles / descriptions / category).
-- Financial state stays on MeleePMM (Arbitrum Stylus).
-- Run in the Supabase SQL editor once per project.

create table if not exists public.markets (
  id bigint primary key,
  title text not null,
  description text not null,
  category text not null,
  creator_address text not null,
  created_at timestamptz not null default now()
);

create index if not exists markets_created_at_idx
  on public.markets (created_at desc);

-- Demo / hackathon: allow anon read + insert via the public API route.
alter table public.markets enable row level security;

create policy "Allow public read markets"
  on public.markets for select
  using (true);

create policy "Allow public insert markets"
  on public.markets for insert
  with check (true);

create policy "Allow public upsert update markets"
  on public.markets for update
  using (true)
  with check (true);
