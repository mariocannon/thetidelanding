-- Lets /submit-event on the landing site file an event straight into the
-- noticeboard, the same way /submit/event does in the ad manager.
--
-- public."Event" lives in the **Newsletter ad management** project
-- (tlderdsxnonhemkdxqns), not in the-tide project that supabase/migrations
-- belongs to. Prisma owns the table shape; this migration adds only what a
-- browser needs to insert a row, and nothing Prisma would want to drop.

-- Prisma generates the cuid and stamps updatedAt in application code.
-- PostgREST does neither and both columns are NOT NULL, so give them database
-- defaults. Prisma keeps sending its own values, so nothing changes for it.
alter table public."Event"
  alter column id set default gen_random_uuid()::text;

alter table public."Event"
  alter column "updatedAt" set default now();

-- Insert-only. There is deliberately no select, update or delete policy, so a
-- submitter can post an event and can never read, edit or remove one — not
-- even the one they just sent. The ad manager connects as postgres, which
-- bypasses RLS, so nothing here touches the operator's own tooling.
--
-- The WITH CHECK is publicEventSchema from the ad manager (lib/validation.ts),
-- restated in SQL: the landing page is a second front door onto the same
-- table, and the rules that make a listing printable have to hold at the door
-- nobody signs in at. The page shows the errors; this is what enforces them.
drop policy if exists "Public event submissions" on public."Event";

create policy "Public event submissions"
  on public."Event"
  for insert
  to anon
  with check (
    -- Not negotiable from outside: submissions are unassigned drafts.
    source = 'PUBLIC'
    and status = 'DRAFT'
    and "issueId" is null
    and notes is null

    and length(btrim(title)) between 1 and 120
    and length(btrim(body)) between 1 and 2000
    -- countWords() from lib/classifieds.ts: whitespace-separated tokens with a
    -- letter or a digit in them. The 70-word cap is the format — several
    -- listings have to fit in one issue.
    and (
      select count(*)
      from unnest(regexp_split_to_array(btrim(body), '\s+')) as token
      where token ~ '[[:alnum:]]'
    ) <= 70

    and location is not null
    and length(btrim(location)) between 1 and 160

    and category in (
      'MUSIC',
      'MARKET',
      'SPORT',
      'ARTS',
      'FOOD',
      'FUNDRAISER',
      'FAMILY',
      'COMMUNITY',
      'OTHER'
    )

    -- startsAt is a naive timestamp holding Coast wall-clock time — what the
    -- submitter typed and what the desk prints — so compare it against the NZ
    -- clock, not UTC. Midnight means "no time given", which is why an event
    -- counts as upcoming for the whole of its last day.
    and coalesce("endsAt", "startsAt")
        >= date_trunc('day', now() at time zone 'Pacific/Auckland')
    and "startsAt" < (now() at time zone 'Pacific/Auckland') + interval '2 years'
    -- Same-day ordering is the form's job; the door only refuses an end that
    -- lands on an earlier day than the start.
    and ("endsAt" is null or "endsAt" >= date_trunc('day', "startsAt"))

    -- A listing nobody can reply to is not worth printing.
    and "contactName" is not null
    and length(btrim("contactName")) between 1 and 120
    and ("contactEmail" is not null or "contactPhone" is not null)
    and (
      "contactEmail" is null
      or ("contactEmail" like '%_@_%._%' and length("contactEmail") <= 200)
    )
    and ("contactPhone" is null or length(btrim("contactPhone")) between 1 and 40)

    and (
      "ticketUrl" is null
      or ("ticketUrl" ~* '^https?://.+' and length("ticketUrl") <= 500)
    )
  );
