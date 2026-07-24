create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at timestamptz not null default now()
);

create unique index subscribers_email_unique on public.subscribers (lower(email));

alter table public.subscribers enable row level security;

-- Anonymous visitors may sign up, but cannot read, change, or delete rows.
create policy "anyone can subscribe"
  on public.subscribers
  for insert
  to anon
  with check (true);
