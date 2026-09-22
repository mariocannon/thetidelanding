-- Lets thetidelanding's /events page read `Event` at build time, the same way
-- /hibiscus-coast-jobs reads `Job` and the business-directory pages read
-- `DirectoryListing`.
--
-- public."Event" lives in the **Newsletter ad management** project
-- (tlderdsxnonhemkdxqns), not in the-tide project that supabase/migrations
-- belongs to. RLS was already enabled on it with no SELECT policy — the
-- convention this project follows for a table with no legitimate PostgREST
-- caller — which held right up until the events page depended on one.
-- RLS-on with no policy doesn't error for the `anon` key; it silently returns
-- zero rows, so without this the events page would build empty rather than
-- fail or show anything.
--
-- Deliberately status-blind, exactly like
-- 20260908100000_jobs_public_read.sql and
-- 20260826010000_directory_listings_public_read.sql: it stays `using (true)`
-- because SELECT is not the layer that hides a DRAFT or an archived event.
-- thetidelanding's own build query does that — `status=eq.PUBLISHED` and an
-- upcoming-window filter on `startsAt` in src/pages/events.astro — so a build
-- that dropped those filters would leak an unreviewed row onto the live site
-- with this policy unchanged. Don't "fix" this into a status-aware policy as
-- a substitute for the build-side filter; RLS can't tell a build's fetch
-- apart from anyone else's, and the two aren't equivalent.
create policy "Public events"
  on public."Event"
  for select
  to anon
  using (true);
