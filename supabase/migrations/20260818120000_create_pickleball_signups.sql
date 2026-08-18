-- Signups for Orewa Pickleball Club's intro group lesson, taken on
-- /orewapickleball. The club runs the lesson; The Tide only takes the booking
-- and hands the list over, so this holds the four things the club asked for --
-- name, location, age, whether they have played before -- plus the contact
-- details needed to confirm a spot. No money moves here: the $75 is settled
-- with the club, which is what the page says.
create table public.pickleball_signups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  name text not null check (char_length(btrim(name)) between 1 and 200),

  -- Required: a spot that cannot be confirmed is not a booking.
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),

  -- Optional second way to reach them on the morning.
  phone text check (char_length(btrim(phone)) between 1 and 40),

  -- The same suburb list /local-giveaway offers, Orewa first because that is
  -- where the lesson is. The page renders these; this is what enforces them.
  location text not null check (
    location in (
      'Orewa',
      'Hatfields Beach',
      'Millwater',
      'Silverdale',
      'Red Beach',
      'Whangaparaoa',
      'Stanmore Bay',
      'Manly',
      'Tindalls Bay',
      'Matakatia',
      'Arkles Bay',
      'Army Bay',
      'Gulf Harbour',
      'Other'
    )
  ),

  -- A real number rather than a bracket: the coach splits the group by it, and
  -- under-fives cannot hold a paddle.
  age smallint not null check (age between 5 and 100),

  -- The one question that decides which drill someone starts on.
  played_before text not null check (
    played_before in (
      'Never played',
      'Played once or twice',
      'I play socially',
      'I play regularly'
    )
  )
);

-- The list is read in the dashboard and passed to the club, never by the site,
-- so there is no read policy -- the publishable key cannot pull anybody's
-- details back out.
alter table public.pickleball_signups enable row level security;

-- Visitors may sign up, but cannot read, change, or delete a signup -- not even
-- the one they just sent.
create policy "anyone can sign up for a lesson"
  on public.pickleball_signups
  for insert
  to anon
  with check (true);
