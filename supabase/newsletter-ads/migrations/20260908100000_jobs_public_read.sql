-- Lets thetidelanding's /hibiscus-coast-jobs page read `Job` at build time, the
-- same way the business-directory pages read `DirectoryListing` and the two
-- submission forms write to `Event` / `Classified`.
--
-- public."Job" lives in the **Newsletter ad management** project
-- (tlderdsxnonhemkdxqns), not in the-tide project that supabase/migrations
-- belongs to. Prisma's own migration
-- (bizdata/prisma/migrations/20260908000000_add_jobs) created the table and
-- enabled row-level security on it with no policies — the convention this
-- project follows for a table with no legitimate PostgREST caller — which held
-- right up until this build depended on one. RLS-on with no policy doesn't
-- error for the `anon` key; it silently returns zero rows, so without this the
-- jobs page would build empty rather than fail or show anything.
--
-- Deliberately status-blind, exactly like
-- 20260826010000_directory_listings_public_read.sql: it stays `using (true)`
-- because SELECT is not the layer that hides a DRAFT or a closed listing.
-- thetidelanding's own build query does that — `status=eq.PUBLISHED` and
-- `closesAt=gt.<now>` in src/pages/hibiscus-coast-jobs.astro, and the
-- featured-then-closesAt sort on top — so a build that dropped those filters
-- would leak an unreviewed or expired row onto the live site with this policy
-- unchanged. Don't "fix" this into a status-aware policy as a substitute for
-- the build-side filter; RLS can't tell a build's fetch apart from anyone
-- else's, and the two aren't equivalent.
create policy "Public jobs"
  on public."Job"
  for select
  to anon
  using (true);
