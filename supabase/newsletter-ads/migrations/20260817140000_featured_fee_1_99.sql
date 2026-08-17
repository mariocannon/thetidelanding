-- The featured upgrade drops from $4.99 to $1.99.
--
-- The two insert policies pin the fee exactly — that is what stops a submitter
-- pricing their own listing — so a price change has to be a migration, and both
-- policies have to be restated whole. 20260817000000 and 20260817130000 stay as
-- they were written: they are what was true when they ran.
--
-- Rows already sold keep the fee snapshotted on them. That is the point of the
-- column: a listing sold at $4.99 is still owed $4.99, and the desk's totals
-- add up what each listing was actually charged rather than today's price.
--
-- Only the `"featuredFee" = ...` line differs from the policy each one replaces.

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------

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
    -- letter or a digit in them.
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

    -- Coast wall-clock time, not UTC. Midnight means "no time given", which is
    -- why an event counts as upcoming for the whole of its last day.
    and coalesce("endsAt", "startsAt")
        >= date_trunc('day', now() at time zone 'Pacific/Auckland')
    and "startsAt" < (now() at time zone 'Pacific/Auckland') + interval '2 years'
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

    -- The featured upgrade, now at $1.99.
    and "featuredPaid" = 'UNPAID'
    and (
      (featured = false and "imageUrl" is null and "featuredFee" = 0)
      or (
        featured = true
        and "featuredFee" = 1.99
        and "imageUrl" is not null
        and "imageUrl" ~ ('^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/creative/public-events/'
                          || '[0-9a-f-]{36}\.(png|jpg|jpeg|webp|gif)$')
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Classifieds
-- ---------------------------------------------------------------------------

drop policy if exists "Public classified submissions" on public."Classified";

create policy "Public classified submissions"
  on public."Classified"
  for insert
  to anon
  with check (
    source = 'PUBLIC'
    and status = 'DRAFT'
    and "issueId" is null
    and notes is null

    and length(btrim(headline)) between 1 and 80
    and length(btrim(body)) between 1 and 2000
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

    and "contactName" is not null
    and length(btrim("contactName")) between 1 and 120
    and ("contactEmail" is not null or "contactPhone" is not null)
    and (
      "contactEmail" is null
      or ("contactEmail" like '%_@_%._%' and length("contactEmail") <= 200)
    )
    and ("contactPhone" is null or length(btrim("contactPhone")) between 1 and 40)

    -- The featured upgrade, now at $1.99.
    and "featuredPaid" = 'UNPAID'
    and (
      (featured = false and "imageUrl" is null and "featuredFee" = 0)
      or (
        featured = true
        and "featuredFee" = 1.99
        and "imageUrl" is not null
        and "imageUrl" ~ ('^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/creative/public-classifieds/'
                          || '[0-9a-f-]{36}\.(png|jpg|jpeg|webp|gif)$')
      )
    )
  );
