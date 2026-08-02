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
- `functions/beehiiv-sync/index.ts` — validates the email, handles CORS, and
  calls Beehiiv. The Beehiiv API key stays server-side in the function secrets.

## Reader survey

`/reader-survey` writes one row per reader to `public.survey_responses` — the
first-party demographic data behind the media kit. Same shape as every other
form on the site: the browser POSTs to PostgREST with the publishable key, and
an anon `insert`-only policy means nobody can read an answer back out. There is
deliberately **no** read policy and no Beehiiv sync; the survey does not
subscribe anyone.

Only two answers are required — `area` and `topics`. Everything else is
nullable, and every personal question offers "Prefer not to say", which is what
keeps people from bailing halfway down the page.

Email is optional too, which is worth knowing when you read the numbers: a row
without one still counts toward a percentage, but it can't be matched to a
subscriber, so it can't be segmented or sold against. The `home_value` and
`investments` columns are still on the table but no longer asked; they hold no
data.

- `migrations/20260803091149_create_survey_responses.sql` — the table, one
  column per question, unique index on `lower(email)` (one response per reader).
- `migrations/20260803094125_align_survey_responses_to_nz_options.sql` — NCEA
  and NZ home-value brackets.
- `migrations/20260803104358_survey_responses_area.sql` — `postcode` became
  `area`, checked against the list of Hibiscus Coast suburbs.
- `migrations/20260803114829_survey_responses_optional_email.sql` — email is no
  longer required.

Every option in `src/pages/reader-survey.astro` has to match a CHECK constraint on the
table. Adding a suburb, a topic or an income bracket to the page means adding it
in a migration first, or PostgREST rejects the insert with a 400.

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
