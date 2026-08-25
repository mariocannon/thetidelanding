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
-- Unlike `Event`/`Classified`, `DirectoryListing` has no `status` or `source`
-- column and no draft/approval workflow — everything the operator adds here
-- is meant to be public the moment it's saved. A blanket read-all policy is
-- therefore correct: nothing on this table is ever hidden from the anon key
-- by row state, only by which categories thetidelanding chooses to publish a
-- page for (`published: true` in src/data/directory/index.js).
create policy "Public directory listings"
  on public."DirectoryListing"
  for select
  to anon
  using (true);
