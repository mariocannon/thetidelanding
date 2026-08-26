-- Lets thetidelanding's business-directory pages read `DirectoryListing` at
-- build time, the same way `/submit-event` and `/submit-classified` write to
-- this project's `Event` and `Classified` tables.
--
-- public."DirectoryListing" lives in the **Newsletter ad management** project
-- (tlderdsxnonhemkdxqns), not in the-tide project that supabase/migrations
-- belongs to. Prisma's own migration
-- (bizdata/prisma/migrations/20260826000000_add_directory_listings) enabled
-- row-level security on this table with no policies — the convention this
-- project already follows for a table with no legitimate PostgREST caller —
-- which was true right up until this build depended on one. RLS-on with no
-- policy doesn't error for the `anon` key; it silently returns zero rows, so
-- without this the directory pages would build empty rather than fail loudly
-- or show anything.
--
-- Written when `DirectoryListing` had no `status` or `source` column and no
-- draft/approval workflow. Both landed a day later (bizdata-coder's 26 Aug
-- handoff, migration 20260826010000_directory_listing_workflow on the ad
-- manager's side) to back the public submission form at /submit-listing —
-- so this blanket read-all policy is now deliberately status-blind, not
-- status-unaware: it stays `using (true)` because select isn't the layer
-- that hides a `PENDING` row. thetidelanding's own build query does that
-- (`&status=eq.PUBLISHED` in src/data/directory/index.js's `fetchListings`,
-- proved by tests/directory-status-filter.spec.js) — a build that forgot
-- that filter would leak a pending submission onto the live site with this
-- policy unchanged, so don't "fix" this into a status-aware policy as a
-- substitute for that build-side filter; the two aren't equivalent (RLS
-- can't tell a build's fetch apart from anyone else's).
create policy "Public directory listings"
  on public."DirectoryListing"
  for select
  to anon
  using (true);
