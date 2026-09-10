-- Security hardening across the signup/order tables.

-- 1. customer_details previously had no length or format constraints, unlike
--    every other table — and it holds the most sensitive data (postal
--    addresses). Table is empty at time of writing, so no backfill concerns.
alter table public.customer_details
  add constraint customer_details_name_len check (char_length(name) <= 200),
  add constraint customer_details_address_len check (char_length(address) <= 500),
  add constraint customer_details_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

-- 2. One giveaway entry per email, same rule subscribers already has.
--    Verified no duplicate lower(email) rows exist before adding.
create unique index giveaway_entries_email_unique
  on public.giveaway_entries (lower(email));

-- 3. The Beehiiv sync trigger function is SECURITY DEFINER and was callable
--    by anon/authenticated via PostgREST RPC. Only the subscribers trigger
--    should ever run it.
revoke execute on function public.sync_subscriber_to_beehiiv() from public, anon, authenticated;

-- 4. Move pg_net out of the public schema (Supabase lint 0014). pg_net is not
--    relocatable, so drop and recreate; its functions live in the `net`
--    schema either way, so the trigger's net.http_post call is unaffected.
--    The extension only holds transient request/response queue rows.
drop extension if exists pg_net;
create extension pg_net schema extensions;
