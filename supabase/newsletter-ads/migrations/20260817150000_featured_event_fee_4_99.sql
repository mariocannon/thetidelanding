-- The two upgrades are priced separately from here on: $4.99 to feature an
-- event, $1.99 to feature a classified.
--
-- 20260817140000 moved both to $1.99. This puts the event back to $4.99 and
-- leaves the classified where it is, so only the event policy is restated —
-- the classified one from that migration still says exactly what we mean.
--
-- Same product, different products to price: the top of What's On is worth
-- more than the top of the classifieds. Nothing else about the upgrade differs,
-- and the fee arithmetic in the ad manager reads neither number — it totals
-- what each row was actually charged, which is why one list can hold listings
-- sold at $4.99, $1.99 and whatever comes next.

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

    -- FEATURED_EVENT_FEE.
    and "featuredPaid" = 'UNPAID'
    and (
      (featured = false and "imageUrl" is null and "featuredFee" = 0)
      or (
        featured = true
        and "featuredFee" = 4.99
        and "imageUrl" is not null
        and "imageUrl" ~ ('^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/creative/public-events/'
                          || '[0-9a-f-]{36}\.(png|jpg|jpeg|webp|gif)$')
      )
    )
  );
