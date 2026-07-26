# Supabase — The Tide

Source of truth for the **the-tide** Supabase project
(`jykpoupjvcmvoihujfkc`, ap-southeast-2). These files document and version the
database + edge function that back newsletter signups.

## Two paths into Beehiiv

Every signup ends up in Beehiiv via the `beehiiv-sync` edge function, but the
home page and the other pages reach it differently.

**Home page form — direct.** It POSTs the email straight to the function from
the browser; the function subscribes it to Beehiiv. Nothing is stored in
Supabase for these signups.

```
home form (browser)
  → POST /functions/v1/beehiiv-sync   { "email": "..." }
  → POST https://api.beehiiv.com/v2/publications/{pub}/subscriptions
```

**Other pages (e.g. Questions) — via the subscribers table.** They insert into
`public.subscribers`; a trigger then calls the same function with the row.

```
INSERT into public.subscribers
  → trigger  subscribers_sync_beehiiv
  → function sync_subscriber_to_beehiiv()   (pg_net http_post, fire-and-forget)
  → edge function  beehiiv-sync             { "record": { "email": "..." } }
  → POST https://api.beehiiv.com/v2/publications/{pub}/subscriptions
```

The function accepts both payload shapes (`{ email }` and `{ record: { email } }`).

- `migrations/20260717025238_create_subscribers.sql` — the table, unique index
  on `lower(email)`, and anon-insert-only RLS.
- `migrations/20260717045106_sync_to_beehiiv.sql` — the trigger + function.
- `functions/beehiiv-sync/index.ts` — validates the email, handles CORS, and
  calls Beehiiv. Public (`verify_jwt = false`) so the browser can reach it
  without a key; the Beehiiv API key stays server-side in the function secrets.

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
