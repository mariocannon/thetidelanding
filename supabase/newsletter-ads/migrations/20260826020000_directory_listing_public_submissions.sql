-- Lets /submit-listing on the landing site file a business straight into
-- public."DirectoryListing"'s review queue, the same way /submit-event and
-- /submit-classified already file into public."Event"/public."Classified".
--
-- public."DirectoryListing" lives in the **Newsletter ad management** project
-- (tlderdsxnonhemkdxqns), not in the-tide project that supabase/migrations
-- belongs to. Prisma owns the table shape; this migration adds only what a
-- browser needs to insert a row, and nothing Prisma would want to drop.
--
-- Unlike Event/Classified this table has no fee, no photo upload and no
-- issue/newsletter lifecycle — a submission just waits at status='PENDING'
-- until the operator approves it from the ad manager's /directory page (see
-- bizdata-coder's 26 Aug handoff on agent-comms/BOARD.md). The sibling
-- migration 20260826010000_directory_listings_public_read.sql already lets
-- `anon` read every row regardless of status — that policy is unchanged by
-- this one. What keeps a PENDING row off the public site is
-- thetidelanding's own build query (src/data/directory/index.js's
-- `&status=eq.PUBLISHED`), not RLS; this migration only has to stop a
-- submitter landing a row that claims to be anything other than PENDING.

-- Prisma generates the cuid in application code and stamps updatedAt there
-- too; PostgREST does neither and both columns are NOT NULL, so give them
-- database defaults, the same fix 20260806090000_event_public_submissions.sql
-- made for public."Event". Prisma keeps sending its own values, so nothing
-- changes for it. `createdAt` already has DEFAULT CURRENT_TIMESTAMP from
-- Prisma's own CreateTable migration, so it needs nothing here.
alter table public."DirectoryListing"
  alter column id set default gen_random_uuid()::text;

alter table public."DirectoryListing"
  alter column "updatedAt" set default now();

-- Insert-only. There is deliberately no update or delete policy here, so a
-- submitter can post a listing and can never edit or remove one — not even
-- the one they just sent. (Select is covered separately, by the blanket read
-- policy every row already has.) The ad manager connects as postgres, which
-- bypasses RLS, so nothing here touches the operator's own tooling.
--
-- The WITH CHECK is directoryListingSchema from the ad manager
-- (lib/validation.ts) plus the contact-details rule Event/Classified's public
-- policies already enforce, restated in SQL: the landing page is a second
-- front door onto the same table, and the rules that make a listing
-- printable have to hold at the door nobody signs in at. The page shows the
-- errors; this is what enforces them.
drop policy if exists "Public directory listing submissions" on public."DirectoryListing";

create policy "Public directory listing submissions"
  on public."DirectoryListing"
  for insert
  to anon
  with check (
    -- Not negotiable from outside: a public submission always lands
    -- unpublished, unfeatured and tagged with where it came from.
    source = 'PUBLIC'
    and status = 'PENDING'
    and featured = false

    and length(btrim(name)) between 1 and 160

    -- DIRECTORY_CATEGORIES, lib/enums.ts in the ad manager — all 19, the same
    -- list the operator's own /directory page offers, not just the four
    -- thetidelanding has a built page for today.
    and category in (
      'cafes',
      'plumbers',
      'electricians',
      'mechanics',
      'hairdressers',
      'restaurants',
      'builders',
      'painters',
      'landscaping',
      'real-estate',
      'dentists',
      'beauty',
      'physio',
      'vets',
      'gyms',
      'childcare',
      'cleaners',
      'movers',
      'accountants'
    )

    -- DIRECTORY_TOWNS, same file — matches src/data/directory/index.js's
    -- `towns` export exactly.
    and town in (
      'Orewa',
      'Whangaparāoa',
      'Silverdale',
      'Red Beach',
      'Millwater',
      'Stanmore Bay',
      'Manly',
      'Gulf Harbour',
      'Arkles Bay',
      'Hatfields Beach'
    )

    -- directoryListingSchema's 61-character floor: shorter reads as too thin
    -- to be a recommendation. thetidelanding's own Playwright suite enforces
    -- the same floor on every listing it renders (tests/directory.spec.js),
    -- so a submission that clears this door can never fail that build once
    -- it's approved.
    and length(btrim(blurb)) between 61 and 600

    -- A phone number people can actually dial, the same shape
    -- tests/directory.spec.js checks every rendered listing against.
    and (
      phone is null
      or (
        length(btrim(phone)) between 7 and 40
        and phone ~ '^[0-9 +()-]+$'
      )
    )

    and (
      url is null
      or (url ~* '^https?://.+' and length(url) <= 500)
    )

    -- A submission nobody can follow up on is not worth reviewing.
    and "contactName" is not null
    and length(btrim("contactName")) between 1 and 120
    and ("contactEmail" is not null or "contactPhone" is not null)
    and (
      "contactEmail" is null
      or ("contactEmail" like '%_@_%._%' and length("contactEmail") <= 200)
    )
    and ("contactPhone" is null or length(btrim("contactPhone")) between 1 and 40)
  );
