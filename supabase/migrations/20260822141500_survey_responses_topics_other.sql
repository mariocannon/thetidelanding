-- Q2 is the one required question with a fixed list, and a fixed list is a
-- guess about what readers want. 'Other' plus a box is how we find out we
-- guessed wrong — the answer that names a section The Tide doesn't run yet.
alter table public.survey_responses
  drop constraint survey_responses_topics_check,
  add constraint survey_responses_topics_check check (
    cardinality(topics) between 1 and 8
    and topics <@ array[
      'Event coverage',
      'Restaurant news',
      'Government updates',
      'School news',
      'Real estate',
      'Other'
    ]::text[]
  );

alter table public.survey_responses add column topics_other text;

-- Same rule the hobby box follows: free text only alongside 'Other', so a
-- second uncounted answer can't ride in beside the five listed topics. Two
-- columns, so it hangs off the table rather than the column.
alter table public.survey_responses
  add constraint survey_responses_topics_other_check check (
    topics_other is null or (
      'Other' = any (topics) and char_length(topics_other) <= 100
    )
  );
