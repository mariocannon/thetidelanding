-- Lets /submit-classified ask for the featured upgrade — a photo above the copy
-- and the top of the classifieds block, for a flat $4.99 — the same way
-- /submit-event already can, and the same way the ad manager's own forms do.
--
-- Two halves again, and the second one widens what 20260817000000 opened:
--   1. public."Classified" has to accept the four featured columns.
--   2. The storage policy has to take a classified's photo as well as an
--      event's, each under its own prefix.

-- ---------------------------------------------------------------------------
-- 1. The listing
-- ---------------------------------------------------------------------------

-- Restated in full rather than amended: a policy is replaced whole, and the
-- rules from 20260808090000 still hold word for word. What is new is the block
-- at the end, which is character for character the one on public."Event".
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
    -- letter or a digit in them. The 70-word cap is the format — several
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

    -- The featured upgrade. Asking for it is the submitter's to do; pricing it
    -- and settling it are not, so the fee is pinned to FEATURED_FEE and the
    -- listing always arrives unpaid for the operator to invoice.
    and "featuredPaid" = 'UNPAID'
    and (
      (featured = false and "imageUrl" is null and "featuredFee" = 0)
      or (
        featured = true
        and "featuredFee" = 4.99
        -- A featured listing with no photo is just a charge, and the photo has
        -- to be one of ours: only an object this project's storage let in can
        -- be named here, so a listing can't point the newsletter at somebody
        -- else's server.
        and "imageUrl" is not null
        and "imageUrl" ~ ('^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/creative/public-classifieds/'
                          || '[0-9a-f-]{36}\.(png|jpg|jpeg|webp|gif)$')
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 2. The photo
-- ---------------------------------------------------------------------------

-- One policy for both forms, one prefix each, so a listing type's photos can be
-- told apart at a glance in the bucket. Everything else is as
-- 20260817000000 set it: insert-only, a generated UUID for a name, a raster
-- extension, and no SVG from a stranger on a public bucket.
drop policy if exists "Public event photos" on storage.objects;
drop policy if exists "Public listing photos" on storage.objects;

create policy "Public listing photos"
  on storage.objects
  for insert
  to anon
  with check (
    bucket_id = 'creative'
    and name ~ '^public-(events|classifieds)/[0-9a-f-]{36}\.(png|jpg|jpeg|webp|gif)$'
  );
