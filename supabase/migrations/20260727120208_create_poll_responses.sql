-- Free-text poll responses get their own table so they're easy to browse,
-- instead of sharing question_answers with the yes/no questions page.
create table public.poll_responses (
  id uuid primary key default gen_random_uuid(),
  question text not null check (char_length(question) <= 500),
  response text not null check (char_length(response) <= 2000),
  created_at timestamptz not null default now()
);

alter table public.poll_responses enable row level security;

-- Visitors may submit responses, but cannot read, change, or delete them.
create policy "anyone can respond"
  on public.poll_responses
  for insert
  to anon
  with check (true);

-- Move the poll rows that already landed in question_answers (text-only rows
-- have answer null), then restore the original not-null rule on answer now
-- that only the yes/no questions page writes there.
insert into public.poll_responses (question, response, created_at)
select question, comment, created_at
from public.question_answers
where answer is null and comment is not null;

delete from public.question_answers where answer is null;

alter table public.question_answers alter column answer set not null;
