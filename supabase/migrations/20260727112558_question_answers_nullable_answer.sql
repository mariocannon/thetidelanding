-- Polls page collects free-text responses only, so a yes/no answer
-- is no longer required on every row.
alter table public.question_answers alter column answer drop not null;
