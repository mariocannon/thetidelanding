-- Q15 is now optional, so the column has to accept a response without one.
--
-- The trade: a row with no email is an anonymous data point. It still counts
-- toward "62% of readers own their home", but it can't be matched to a
-- subscriber, so it can't be segmented or sold against — the thing that made
-- this survey first-party data in the first place. The unique index on
-- lower(email) keeps doing its job for the rows that do carry one; Postgres
-- lets any number of nulls past a unique index.
alter table public.survey_responses alter column email drop not null;
