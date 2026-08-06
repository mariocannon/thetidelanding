-- Q4. What readers do with their weekends is the one thing the survey asked
-- nothing about, and it is what most local sponsors actually buy against — the
-- golf club, the gym, the garden centre, the boat ramp. One dropdown, ten
-- hobbies that fit the 35-65 middle of the list, plus 'Other' with a box.
alter table public.survey_responses
  add column hobby text check (
    hobby in (
      'Gardening',
      'Exercising (gym, running, yoga)',
      'Golf',
      'Fishing or boating',
      'Walking or hiking',
      'Cooking or baking',
      'Reading',
      'Travel',
      'DIY and home projects',
      'Photography, art or craft',
      'Other'
    )
  ),
  add column hobby_other text;

-- Free text, and only alongside 'Other': anything else would let a second,
-- uncounted answer in beside a listed hobby. Two columns, so it is a table
-- constraint rather than one hanging off the column above.
alter table public.survey_responses
  add constraint survey_responses_hobby_other_check check (
    hobby_other is null or (
      hobby = 'Other' and char_length(hobby_other) <= 100
    )
  );
