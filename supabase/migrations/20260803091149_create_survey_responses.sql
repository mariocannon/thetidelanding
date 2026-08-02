-- Reader demographics survey — the first-party data behind the media kit.
-- The questions follow the Life of Scoop "Data is power" survey, adapted for
-- the Coast: postcodes instead of ZIP codes. One column per question so answers
-- can be counted with plain SQL. Rows are NOT anonymous: email is required so a
-- response can be matched back to the subscriber. Only postcode, topics and
-- email are required; every other column is nullable.
create table public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Q1. The page owns the list of covered postcodes; only shape is enforced.
  postcode text not null check (
    postcode ~ '^[0-9]{4}$' or postcode = 'None of the above'
  ),

  -- Q2. The only other required question.
  topics text[] not null check (
    cardinality(topics) between 1 and 8
    and topics <@ array[
      'Event coverage',
      'Restaurant news',
      'Government updates',
      'School news',
      'Real estate'
    ]::text[]
  ),

  -- Q3. Free text: "retired" is a valid and common answer.
  occupation text check (char_length(occupation) <= 200),

  -- Q4.
  education text check (
    education in (
      'Did not finish high school',
      'Finished high school (Year 12)',
      'Certificate I-IV or trade qualification',
      'Diploma or advanced diploma',
      'Bachelor degree',
      'Master degree',
      'Professional degree (MD, JD, etc.)',
      'Doctorate (PhD, EdD, etc.)',
      'Prefer not to say'
    )
  ),

  -- Q5.
  age_range text check (
    age_range in (
      'Under 18',
      '18-24',
      '25-34',
      '35-44',
      '45-54',
      '55-64',
      '65-74',
      '75+',
      'Prefer not to say'
    )
  ),

  -- Q6.
  gender text check (gender in ('Female', 'Male', 'Prefer not to say')),

  -- Q7.
  relationship_status text check (
    relationship_status in (
      'Single',
      'In a relationship',
      'Engaged',
      'Married',
      'Separated',
      'Divorced',
      'Widowed',
      'Prefer not to say'
    )
  ),

  -- Q8. "and moving soon" is deliberate: it is the highest-value segment a real
  -- estate or removalist sponsor can be sold.
  home_ownership text check (
    home_ownership in (
      'I own my home',
      'I own my home and am moving soon',
      'I own more than one home',
      'I rent my home',
      'I rent my home and am moving soon',
      'Other',
      'Prefer not to say'
    )
  ),

  -- Q9.
  home_value text check (
    home_value in (
      'Under $400,000',
      '$400,000-$599,999',
      '$600,000-$799,999',
      '$800,000-$999,999',
      '$1M-$1.49M',
      '$1.5M-$2.99M',
      'Over $3 million',
      'Not sure or prefer not to say'
    )
  ),

  -- Q10.
  household_income text check (
    household_income in (
      'Under $50,000',
      '$50,000-$74,999',
      '$75,000-$99,999',
      '$100,000-$149,999',
      '$150,000-$199,999',
      '$200,000-$299,999',
      '$300,000-$499,999',
      '$500,000-$749,999',
      '$750,000-$999,999',
      'Over $1 million',
      'Prefer not to say'
    )
  ),

  -- Q11. Excludes the home, so it can be read alongside home_value.
  investments text check (
    investments in (
      'Under $100,000',
      '$100,000-$249,999',
      '$250,000-$499,999',
      '$500,000-$999,999',
      '$1M-$2.9M',
      '$3M-$4.9M',
      '$5M-$9.9M',
      'Over $10 million',
      'I am not sure',
      'Prefer not to say'
    )
  ),

  -- Q12.
  children_at_home text check (
    children_at_home in ('Yes', 'No', 'Prefer not to say')
  ),

  -- Q13. Only asked when Q12 is Yes.
  children_ages text[] check (
    children_ages is null or (
      cardinality(children_ages) between 1 and 7
      and children_ages <@ array[
        '0-2',
        '3-5',
        '6-10',
        '11-13',
        '14-18',
        '18+ living at home',
        'Prefer not to say'
      ]::text[]
    )
  ),

  -- Q14.
  pets text[] check (
    pets is null or (
      cardinality(pets) between 1 and 8
      and pets <@ array[
        'I do not have pets',
        'Yes, a dog or dogs',
        'Yes, a cat or cats',
        'Yes, fish',
        'Yes, a bird or birds',
        'Yes, a reptile or reptiles',
        'Yes, a small mammal (guinea pig, rabbit, etc.)',
        'Other'
      ]::text[]
    )
  ),

  -- Required: this is what makes the answers first-party rather than a chart.
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

-- One response per reader.
create unique index survey_responses_email_unique
  on public.survey_responses (lower(email));

-- Answers are read in the dashboard, not by the site, so there is no read
-- policy — the publishable key cannot pull anybody's income back out.
alter table public.survey_responses enable row level security;

-- Visitors may submit a survey, but cannot read, change, or delete responses.
create policy "anyone can answer the survey"
  on public.survey_responses
  for insert
  to anon
  with check (true);
