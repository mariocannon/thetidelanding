-- Reconstructed from the live database: this migration was applied remotely
-- (version 20260723123509) before the file was tracked in the repo.
create table public.giveaway_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) <= 200),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  location text not null check (char_length(location) <= 100)
);

alter table public.giveaway_entries enable row level security;

-- Anonymous visitors may enter the giveaway, but cannot read, change, or
-- delete rows.
create policy "Allow anonymous inserts"
  on public.giveaway_entries
  for insert
  to anon
  with check (true);
