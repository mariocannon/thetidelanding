create extension if not exists pg_net;

-- Fire-and-forget call to the beehiiv-sync edge function on each signup.
-- The bearer token is the project's public anon key (safe to store here);
-- the Beehiiv API key itself lives only in Edge Function secrets.
create or replace function public.sync_subscriber_to_beehiiv()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform net.http_post(
    url := 'https://jykpoupjvcmvoihujfkc.supabase.co/functions/v1/beehiiv-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5a3BvdXBqdmNtdm9paHVqZmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMzk5NzAsImV4cCI6MjA5OTgxNTk3MH0.Dp6L0HvbU4MMfPyYn08sVsths5Hio_XkSGUv9s6qh90'
    ),
    body := jsonb_build_object('record', jsonb_build_object('email', new.email))
  );
  return new;
end;
$$;

create trigger subscribers_sync_beehiiv
after insert on public.subscribers
for each row execute function public.sync_subscriber_to_beehiiv();
