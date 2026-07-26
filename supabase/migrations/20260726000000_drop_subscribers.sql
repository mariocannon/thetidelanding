-- The signup form now subscribes users directly to Beehiiv via the
-- beehiiv-sync edge function; Beehiiv is the sole source of truth. Tear down
-- the old Supabase store and its trigger-based sync chain.
drop trigger if exists subscribers_sync_beehiiv on public.subscribers;
drop function if exists public.sync_subscriber_to_beehiiv();
drop table if exists public.subscribers;
