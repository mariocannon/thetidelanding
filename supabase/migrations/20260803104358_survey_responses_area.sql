-- Postcodes don't describe the Coast the way readers do. 0932 alone covers
-- Silverdale, Millwater and Red Beach, and nobody thinks of themselves as
-- living in a number — they live in Manly, or Ōrewa, or up the top of the
-- Peninsula. Advertisers buy suburbs too. So Q1 asks for the suburb, and the
-- column holds the name.
alter table public.survey_responses rename column postcode to area;

-- The old check tested for a four-digit string; existing rows carry one.
-- Nothing has been collected through the site yet, so the only rows here are
-- test inserts — park them on the catch-all rather than dropping them.
update public.survey_responses set area = 'None of the above' where area ~ '^[0-9]{4}$';

alter table public.survey_responses
  drop constraint survey_responses_postcode_check,
  add constraint survey_responses_area_check check (
    area in (
      -- North to south, the way you'd drive it.
      'Puhoi',
      'Waiwera',
      'Hatfields Beach',
      'Ōrewa',
      'Wainui',
      'Millwater',
      'Silverdale',
      'Red Beach',
      -- Down the Peninsula. "Whangaparāoa" stays alongside its suburbs because
      -- plenty of people answer with the peninsula, not the bay they live on.
      'Whangaparāoa',
      'Stanmore Bay',
      'Tindalls Beach',
      'Matakatia',
      'Arkles Bay',
      'Little Manly',
      'Manly',
      'Army Bay',
      'Gulf Harbour',
      -- The southern edge of what The Tide covers.
      'Stillwater',
      'Dairy Flat',
      'Ōkura',
      'None of the above'
    )
  );
