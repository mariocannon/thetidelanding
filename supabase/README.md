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

### Required secrets

The function needs two secrets. Without them it returns HTTP 500 and no
subscriber reaches Beehiiv. Set them in **Dashboard → Edge Functions → Secrets**
(or `supabase secrets set`):

| Secret | Where to find it |
| --- | --- |
| `BEEHIIV_API_KEY` | Beehiiv → Settings → Integrations → API keys |
| `BEEHIIV_PUBLICATION_ID` | Same page; starts with `pub_` |

The trigger only fires on **new** inserts — existing rows are not backfilled.

## Reader survey

`/survey` writes to `public.survey_responses` — the demographics data behind a
media kit. It follows the Life of Scoop "Data is power" survey: 14 questions,
"Prefer not to say" on every personal one, and only postcode + topics required.

- `migrations/20260802211500_create_survey_responses.sql` — the table, the
  allowed answers for every question, a unique index on `lower(email)`, and
  anon-insert-only RLS.

Two things make this table different from `poll_responses`:

- **It is not anonymous.** Email is required, so a response can be matched to a
  subscriber. Anonymous totals describe the audience; identified answers let you
  sell a slice of it ("readers who own a home and are moving soon").
- **One column per question,** so counting is plain SQL:

  ```sql
  -- The media-kit numbers
  select gender, count(*) from survey_responses group by 1 order by 2 desc;
  select household_income, count(*) from survey_responses group by 1 order by 1;

  -- Multi-select questions need unnest
  select topic, count(*) from survey_responses, unnest(topics) as topic
  group by 1 order by 2 desc;

  -- A segment worth selling
  select email from survey_responses
  where home_ownership = 'I own my home and am moving soon';
  ```

The allowed answers are check constraints, and they are duplicated in
`src/pages/survey.astro`. Change one, change the other — the page inserts with
the publishable key, so the database is the only thing that can refuse an answer
the survey never offered.

Answering twice with the same email returns HTTP 409, which the page treats as
"you're already done" rather than an error.

## Deploying changes

```sh
supabase link --project-ref jykpoupjvcmvoihujfkc
supabase db push                      # apply migrations
supabase functions deploy beehiiv-sync
```
