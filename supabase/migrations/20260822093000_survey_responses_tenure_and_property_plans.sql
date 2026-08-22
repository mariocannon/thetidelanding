-- Two questions the survey was missing, both of them what a real estate
-- sponsor — the biggest spender on the Coast — actually wants to buy against.
--
-- How long somebody has lived here separates the reader who still calls
-- Auckland home from the one who has watched Ōrewa change for a decade, and
-- it is the number that says whether The Tide is read by newcomers or locals.
alter table public.survey_responses
  add column years_on_coast text check (
    years_on_coast in (
      'Less than a year',
      '1 year',
      '2 years',
      '3 years',
      '4 years',
      '5 years',
      '6 years',
      '7 years',
      '8 years',
      '9 years',
      '10+ years',
      'Prefer not to say'
    )
  ),

  -- home_ownership already catches "and am moving soon", but only for people
  -- who have decided. This asks the ones still thinking about it, and splits
  -- them the way an agent's listing does: buying, selling, or both.
  add column property_plans text check (
    property_plans in (
      'Buying',
      'Selling',
      'Both',
      'Not right now',
      'Prefer not to say'
    )
  );
