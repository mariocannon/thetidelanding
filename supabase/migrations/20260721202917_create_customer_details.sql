-- Reconstructed from the live database: this migration was applied remotely
-- (version 20260721202917) before the file was tracked in the repo.
-- Length/format constraints were added later in 20260727063837_harden_data_security.
create table public.customer_details (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  address text not null,
  email text not null
);

alter table public.customer_details enable row level security;

-- Anonymous visitors may submit their details, but cannot read, change, or
-- delete rows.
create policy "Allow anonymous inserts"
  on public.customer_details
  for insert
  to anon
  with check (true);
