-- Lets /submit-event ask for the featured upgrade — a photo above the copy for
-- a flat $4.99 — the same way /submit/event does in the ad manager.
--
-- Two doors have to open for that, and both are here:
--   1. public."Event" has to accept the four featured columns, and only in the
--      shapes the ad manager means by them.
--   2. The photo has to reach storage, which means the browser uploading it
--      with the publishable key.
--
-- As with 20260806090000, Prisma owns the table shape and this migration adds
-- only what a browser needs.

-- ---------------------------------------------------------------------------
-- 1. The listing
-- ---------------------------------------------------------------------------

-- Restated in full rather than amended: a policy is replaced whole, and the
-- rules from 20260806090000 still hold word for word. What is new is the block
-- at the end.
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

    -- The featured upgrade. Asking for it is the submitter's to do; pricing it
    -- and settling it are not, so the fee is pinned to FEATURED_EVENT_FEE and
    -- the listing always arrives unpaid for the operator to invoice.
    and "featuredPaid" = 'UNPAID'
    and (
      (featured = false and "imageUrl" is null and "featuredFee" = 0)
      or (
        featured = true
        and "featuredFee" = 4.99
        -- A featured listing with no photo is just a charge, and the photo has
        -- to be one of ours: only an object this policy's storage half let in
        -- can be named here, so a listing can't point the newsletter at
        -- somebody else's server.
        and "imageUrl" is not null
        and "imageUrl" ~ ('^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/creative/public-events/'
                          || '[0-9a-f-]{36}\.(png|jpg|jpeg|webp|gif)$')
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 2. The photo
-- ---------------------------------------------------------------------------

-- The bucket the ad manager already uploads booking creative to, so one
-- deleteFile() in lib/upload.ts still cleans up after a listing that is
-- un-featured or deleted. Reader photos live under their own prefix.
--
-- The limits are lib/upload.ts's own rules moved down a layer, where they hold
-- for an uploader who never went through it: 5MB, images only.
update storage.buckets
   set file_size_limit = 5242880,
       allowed_mime_types = array[
         'image/png',
         'image/jpeg',
         'image/gif',
         'image/webp',
         'image/svg+xml'
       ]
 where id = 'creative';

-- Insert-only, like every other door on this site: a submitter can send a
-- photo and can never read the bucket, replace an object or remove one — not
-- even the one they just sent.
--
-- The name is pinned to a flat prefix, a generated UUID and a raster
-- extension. That rules out traversal, collisions with the operator's own
-- creative at the bucket root, overwriting somebody else's photo, and SVG —
-- which is a document that can carry script, and not something to accept from
-- a stranger on a public bucket. The operator's own uploads still may: they
-- come through the ad manager, not through here.
drop policy if exists "Public event photos" on storage.objects;

create policy "Public event photos"
  on storage.objects
  for insert
  to anon
  with check (
    bucket_id = 'creative'
    and name ~ '^public-events/[0-9a-f-]{36}\.(png|jpg|jpeg|webp|gif)$'
  );
