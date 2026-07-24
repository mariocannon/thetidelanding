# Supabase — The Tide

Source of truth for the **the-tide** Supabase project
(`jykpoupjvcmvoihujfkc`, ap-southeast-2). These files document and version the
database + edge function that back newsletter signups.

## Subscriber → Beehiiv sync

Every insert into `public.subscribers` is automatically pushed to the Beehiiv
list. The chain:

```
INSERT into public.subscribers
  → trigger  subscribers_sync_beehiiv
  → function sync_subscriber_to_beehiiv()   (pg_net http_post, fire-and-forget)
  → edge function  beehiiv-sync
  → POST https://api.beehiiv.com/v2/publications/{pub}/subscriptions
```

- `migrations/20260717025238_create_subscribers.sql` — the table, unique index
  on `lower(email)`, and anon-insert-only RLS.
- `migrations/20260717045106_sync_to_beehiiv.sql` — the trigger + function.
- `functions/beehiiv-sync/index.ts` — the edge function that calls Beehiiv.

### Required secrets

The edge function needs two secrets. Without them it returns HTTP 500 and no
subscriber reaches Beehiiv. Set them in **Dashboard → Edge Functions → Secrets**
(or `supabase secrets set`):

| Secret | Where to find it |
| --- | --- |
| `BEEHIIV_API_KEY` | Beehiiv → Settings → Integrations → API keys |
| `BEEHIIV_PUBLICATION_ID` | Same page; starts with `pub_` |

The trigger only fires on **new** inserts — existing rows are not backfilled.

## Deploying changes

```sh
supabase link --project-ref jykpoupjvcmvoihujfkc
supabase db push                      # apply migrations
supabase functions deploy beehiiv-sync
```
