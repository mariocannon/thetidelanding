-- Reconstructed from the live database: this migration was applied remotely
-- (version 20260719053241) before the file was tracked in the repo.
create table public.question_answers (
  id uuid primary key default gen_random_uuid(),
  question text not null check (char_length(question) <= 500),
  answer boolean not null,
  comment text check (char_length(comment) <= 2000),
  created_at timestamptz not null default now()
);

alter table public.question_answers enable row level security;

-- Anonymous visitors may submit answers, but cannot read, change, or delete rows.
create policy "anyone can answer"
  on public.question_answers
  for insert
  to anon
  with check (true);
