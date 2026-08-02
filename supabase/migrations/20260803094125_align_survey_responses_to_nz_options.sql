-- The survey is for the Hibiscus Coast, not Australia: NCEA rather than Year 12
-- and the AQF certificate levels, and home-value brackets that split the range
-- Auckland readers actually sit in instead of bunching them at the top.
alter table public.survey_responses
  drop constraint survey_responses_education_check,
  add constraint survey_responses_education_check check (
    education in (
      'Did not finish high school',
      'Finished high school (NCEA Level 2 or 3)',
      'Certificate or trade qualification (Levels 1-4)',
      'Diploma or advanced diploma',
      'Bachelor degree',
      'Master degree',
      'Professional degree (MD, JD, etc.)',
      'Doctorate (PhD, EdD, etc.)',
      'Prefer not to say'
    )
  );

alter table public.survey_responses
  drop constraint survey_responses_home_value_check,
  add constraint survey_responses_home_value_check check (
    home_value in (
      'Under $600,000',
      '$600,000-$799,999',
      '$800,000-$999,999',
      '$1M-$1.24M',
      '$1.25M-$1.49M',
      '$1.5M-$1.99M',
      '$2M-$2.99M',
      'Over $3 million',
      'Not sure or prefer not to say'
    )
  );
