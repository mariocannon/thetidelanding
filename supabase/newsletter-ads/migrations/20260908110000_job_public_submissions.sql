-- Lets /hibiscus-coast-jobs/post on the landing site file an employer's role
-- straight into public."Job"'s review queue, the same way /submit-classified
-- and /submit-listing already file into public."Classified" / "DirectoryListing".
--
-- public."Job" lives in the **Newsletter ad management** project
-- (tlderdsxnonhemkdxqns), not in the-tide project that supabase/migrations
-- belongs to. Prisma owns the table shape
-- (bizdata/prisma/migrations/20260908000000_add_jobs); this migration adds only
-- what a browser needs to insert a row, and nothing Prisma would want to drop.
--
-- A submission just waits at status='DRAFT', source='PUBLIC', paid='UNPAID'
-- until the operator approves it from the ad manager's /jobs page and settles
-- the fee against the Stripe dashboard. The sibling migration
-- 20260908100000_jobs_public_read.sql lets anon read every row regardless of
-- status — unchanged by this one. What keeps a DRAFT (or a closed) row off the
-- public site is thetidelanding's own build query
-- (src/pages/hibiscus-coast-jobs.astro's status=eq.PUBLISHED + closesAt filter),
-- not RLS; this migration only has to stop a submitter landing a row that
-- claims to be anything other than an unpaid, unplaced draft, priced at a real
-- tier price.

-- Prisma generates the cuid in application code and stamps updatedAt there
-- too; PostgREST does neither and both columns are NOT NULL, so give them
-- database defaults — the same fix every other public-submission table on this
-- project makes. Prisma keeps sending its own values, so nothing changes for
-- it. `createdAt` already has DEFAULT CURRENT_TIMESTAMP from Prisma's own
-- CreateTable migration.
alter table public."Job"
  alter column id set default gen_random_uuid()::text;

alter table public."Job"
  alter column "updatedAt" set default now();

-- Insert-only. No update or delete policy: a submitter can post a role and can
-- never edit or remove one, not even the one they just sent. Select is covered
-- separately by the blanket read policy. The ad manager connects as postgres,
-- which bypasses RLS, so nothing here touches the operator's own tooling.
--
-- The WITH CHECK is publicJobSchema from the ad manager (lib/validation.ts)
-- restated in SQL, plus the pieces the server would otherwise set: an employer
-- reaches this form from a paid Stripe link for a tier, but the money is
-- settled by the operator against the Stripe dashboard, so the row always
-- lands UNPAID, DRAFT, unplaced, priced from the tier.
drop policy if exists "Public job submissions" on public."Job";

create policy "Public job submissions"
  on public."Job"
  for insert
  to anon
  with check (
    -- Not negotiable from outside: submissions are unpaid, unplaced drafts,
    -- with no operator-only fields set.
    source = 'PUBLIC'
    and status = 'DRAFT'
    and paid = 'UNPAID'
    and "issueId" is null
    and notes is null
    -- No public logo upload in v1 — the operator adds a Featured listing's
    -- logo when moderating.
    and "logoUrl" is null

    and length(btrim(title)) between 1 and 120
    and length(btrim(employer)) between 1 and 120
    and length(btrim(body)) between 1 and 2000
    -- countWords() from lib/classifieds.ts: whitespace-separated tokens with a
    -- letter or a digit in them. The 70-word cap is the format — several
    -- listings have to fit in one issue.
    and (
      select count(*)
      from unnest(regexp_split_to_array(btrim(body), '\s+')) as token
      where token ~ '[[:alnum:]]'
    ) <= 70

    -- JOB_CATEGORIES, lib/enums.ts in the ad manager. No childcare /
    -- babysitting / in-home-care bucket, by design — those roles are excluded
    -- from the board and moderation catches strays filed under OTHER or HEALTH.
    and category in (
      'HOSPITALITY',
      'RETAIL',
      'TRADES',
      'CONSTRUCTION',
      'OFFICE_ADMIN',
      'HEALTH',
      'EDUCATION',
      'DRIVING_LOGISTICS',
      'PROFESSIONAL',
      'OTHER'
    )

    -- JOB_TYPES, same file.
    and "jobType" in (
      'CASUAL',
      'PART_TIME',
      'FULL_TIME',
      'FIXED_TERM',
      'CONTRACT'
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

    -- pay and applyUrl are optional free text / link.
    and (pay is null or length(btrim(pay)) <= 60)
    and (
      "applyUrl" is null
      or ("applyUrl" ~* '^https?://.+' and length("applyUrl") <= 500)
    )

    -- The tier the employer picked, and the price pinned to it. priceForTier()
    -- in lib/jobs.ts: Standard is the $19.99 launch price until 28 Jan 2027 and
    -- $49 after; Featured $89; Community $14.99. Both Standard prices are
    -- allowed here so this policy doesn't have to know the date — the operator
    -- reconciles the amount against the Stripe payment anyway.
    and tier in ('STANDARD', 'FEATURED', 'COMMUNITY')
    and (
      (tier = 'STANDARD' and price in (19.99, 49))
      or (tier = 'FEATURED' and price = 89)
      or (tier = 'COMMUNITY' and price = 14.99)
    )

    -- A 30-day run (lib/jobs.ts defaultClosesAt), with a little slack either
    -- side for clock skew: the listing must close in the future and inside
    -- roughly a month.
    and "closesAt" > now()
    and "closesAt" < now() + interval '32 days'

    -- A listing nobody can reply to is not worth printing.
    and "contactName" is not null
    and length(btrim("contactName")) between 1 and 120
    and ("contactEmail" is not null or "contactPhone" is not null)
    and (
      "contactEmail" is null
      or ("contactEmail" like '%_@_%._%' and length("contactEmail") <= 200)
    )
    and ("contactPhone" is null or length(btrim("contactPhone")) between 1 and 40)
  );
