# Supabase — The Tide

Source of truth for the **the-tide** Supabase project
(`jykpoupjvcmvoihujfkc`, ap-southeast-2). These files document and version the
database + edge function that back newsletter signups.

## One path into Beehiiv

Every signup form — the home page and the other pages (e.g. Questions) —
inserts into `public.subscribers`; a trigger then calls the `beehiiv-sync`
function with the row. The browser never talks to Beehiiv directly.

```
INSERT into public.subscribers
  → trigger  subscribers_sync_beehiiv
  → function sync_subscriber_to_beehiiv()   (pg_net http_post, fire-and-forget)
  → edge function  beehiiv-sync             { "record": { "email": "..." } }
  → POST https://api.beehiiv.com/v2/publications/{pub}/subscriptions
```

The function still accepts a bare `{ email }` payload too — a leftover from when
the home page called it directly — but nothing uses that path now; the DB
trigger always sends `{ record: { email } }`.

- `migrations/20260717025238_create_subscribers.sql` — the table, unique index
  on `lower(email)`, and anon-insert-only RLS.
- `migrations/20260717045106_sync_to_beehiiv.sql` — the trigger + function.
- `migrations/20260719053241_create_question_answers.sql` — Questions-page
  answers table (reconstructed from the live DB; originally applied remotely).
- `migrations/20260721202917_create_customer_details.sql` — order form
  name/address/email table (reconstructed from the live DB).
- `migrations/20260723123509_create_giveaway_entries.sql` — giveaway entries
  table (reconstructed from the live DB).
- `migrations/20260727063837_harden_data_security.sql` — length/format
  constraints on `customer_details`, unique email per giveaway entry, revokes
  client EXECUTE on the sync trigger function, moves `pg_net` to the
  `extensions` schema.
- `functions/beehiiv-sync/index.ts` — validates the email, handles CORS, and
  calls Beehiiv. The Beehiiv API key stays server-side in the function secrets.

All tables are insert-only for anonymous visitors: RLS is enabled everywhere
with a single anon INSERT policy per table, so the collected emails and
addresses are never readable through the public API.

### Required secrets

The function needs two secrets. Without them it returns HTTP 500 and no
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
