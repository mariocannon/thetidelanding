-- Lets /submit-classified on the landing site file a listing straight into the
-- classifieds queue, the same way /submit does in the ad manager.
--
-- public."Classified" lives in the **Newsletter ad management** project
-- (tlderdsxnonhemkdxqns), not in the-tide project that supabase/migrations
-- belongs to. Prisma owns the table shape; this migration adds only what a
-- browser needs to insert a row, and nothing Prisma would want to drop.
--
-- The sibling migration 20260806090000_event_public_submissions.sql does the
-- same job for public."Event"; this is that door, cut for classifieds.

-- Prisma generates the cuid and stamps updatedAt in application code.
-- PostgREST does neither and both columns are NOT NULL, so give them database
-- defaults. Prisma keeps sending its own values, so nothing changes for it.
alter table public."Classified"
  alter column id set default gen_random_uuid()::text;

alter table public."Classified"
  alter column "updatedAt" set default now();

-- Insert-only. There is deliberately no select, update or delete policy, so a
-- submitter can post a listing and can never read, edit or remove one — not
-- even the one they just sent. The ad manager connects as postgres, which
-- bypasses RLS, so nothing here touches the operator's own tooling.
--
-- The WITH CHECK is publicClassifiedSchema from the ad manager
-- (lib/validation.ts), restated in SQL: the landing page is a second front
-- door onto the same table, and the rules that make a listing printable have
-- to hold at the door nobody signs in at. The page shows the errors; this is
-- what enforces them.
drop policy if exists "Public classified submissions" on public."Classified";

create policy "Public classified submissions"
  on public."Classified"
  for insert
  to anon
  with check (
    -- Not negotiable from outside: submissions are unassigned drafts.
    source = 'PUBLIC'
    and status = 'DRAFT'
    and "issueId" is null
    and notes is null

    and length(btrim(headline)) between 1 and 80
    and length(btrim(body)) between 1 and 2000
    -- countWords() from lib/classifieds.ts: whitespace-separated tokens with a
    -- letter or a digit in them. CLASSIFIED_WORD_MAX is the format — several
    -- listings have to fit in one issue.
    and (
      select count(*)
      from unnest(regexp_split_to_array(btrim(body), '\s+')) as token
      where token ~ '[[:alnum:]]'
    ) <= 70

    and category in (
      'FOR_SALE',
      'WANTED',
      'SERVICES',
      'JOBS',
      'PROPERTY',
      'COMMUNITY',
      'OTHER'
    )

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
