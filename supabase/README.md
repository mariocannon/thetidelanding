# Supabase — The Tide

Source of truth for the **the-tide** Supabase project
(`jykpoupjvcmvoihujfkc`, ap-southeast-2). All that lives here now is one edge
function that subscribes signups directly to Beehiiv.

## Signup → Beehiiv

The landing page form calls the `beehiiv-sync` edge function directly from the
browser; the function subscribes the email to Beehiiv. Beehiiv is the source of
truth — no subscriber data is stored in Supabase.

```
signup form (browser)
  → POST /functions/v1/beehiiv-sync   { "email": "..." }
  → POST https://api.beehiiv.com/v2/publications/{pub}/subscriptions
```

- `functions/beehiiv-sync/index.ts` — validates the email, handles CORS, and
  calls Beehiiv. Public (`verify_jwt = false`), so the browser can reach it
  without a key; the Beehiiv API key stays server-side in the function secrets.
- `migrations/20260717025238_create_subscribers.sql` /
  `migrations/20260717045106_sync_to_beehiiv.sql` — the original table + trigger
  sync chain (historical).
- `migrations/20260726000000_drop_subscribers.sql` — tears that chain back down
  now that the form subscribes directly.

### Required secrets

The function needs two secrets. Without them it returns HTTP 500 and no
subscriber reaches Beehiiv. Set them in **Dashboard → Edge Functions → Secrets**
(or `supabase secrets set`):

| Secret | Where to find it |
| --- | --- |
| `BEEHIIV_API_KEY` | Beehiiv → Settings → Integrations → API keys |
| `BEEHIIV_PUBLICATION_ID` | Same page; starts with `pub_` |

## Deploying changes

```sh
supabase link --project-ref jykpoupjvcmvoihujfkc
supabase db push                      # apply migrations (drops the old table)
supabase functions deploy beehiiv-sync
```
