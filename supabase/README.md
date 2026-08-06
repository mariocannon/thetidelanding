# Supabase — The Tide

Source of truth for the **the-tide** Supabase project
(`jykpoupjvcmvoihujfkc`, ap-southeast-2). These files document and version the
database + edge function that back newsletter signups.

Two projects are in play, and only the first one is this project's own:

| Directory | Project | Backs |
| --- | --- | --- |
| `migrations/` | **the-tide** (`jykpoupjvcmvoihujfkc`) | signups, polls, the reader survey |
| `newsletter-ads/migrations/` | **Newsletter ad management** (`tlderdsxnonhemkdxqns`) | `/submit-event` → the what's-on noticeboard |

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

The survey no longer asks for an email, so responses are anonymous: they answer
"what is the Coast like" but cannot be matched to a subscriber, which rules out
segmenting or selling against them. The `email`, `home_value` and `investments`
columns are still on the table and still nullable, but nothing writes to them —
the unique index on `lower(email)` has nothing left to enforce.

- `migrations/20260803091149_create_survey_responses.sql` — the table, one
  column per question, unique index on `lower(email)` (one response per reader).
- `migrations/20260803094125_align_survey_responses_to_nz_options.sql` — NCEA
  and NZ home-value brackets.
- `migrations/20260803104358_survey_responses_area.sql` — `postcode` became
  `area`, checked against the list of Hibiscus Coast suburbs.
- `migrations/20260803114829_survey_responses_optional_email.sql` — email is no
  longer required.
- `migrations/20260807091642_survey_responses_hobby.sql` — Q4, "What are your
  hobbies?": a `hobby` dropdown of ten, and `hobby_other` free text that the
  table only accepts alongside `hobby = 'Other'`.

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

`newsletter-ads/migrations` belongs to a different project and is deliberately
outside `migrations/`, so `db push` never sends it to the wrong database. Apply
it against the ad manager's project instead:

```sh
supabase link --project-ref tlderdsxnonhemkdxqns
supabase db push --db-url "$AD_MANAGER_DB_URL"   # or paste it in the SQL editor
```

## What's on — event submissions

`/submit-event` is the ad manager's `/submit/event` rebuilt on the landing
site: same fields, same rules, same wording. It writes to `public."Event"` in
the **Newsletter ad management** project (`tlderdsxnonhemkdxqns`) — the table
the ad manager's what's-on section reads — rather than to anything in
the-tide project.

Every submission lands the way one from the ad manager's own form does: an
unassigned `DRAFT` tagged `source = 'PUBLIC'`, waiting for the operator to
approve it into an issue. It posts straight to PostgREST with the publishable
key, so there is no server in between; the insert-only policy is the server.

```
POST /rest/v1/Event   { …, "status": "DRAFT", "source": "PUBLIC", "issueId": null }
  → policy "Public event submissions"  (anon, insert only)
  → DRAFT in the ad manager's What's On list
```

- `newsletter-ads/migrations/20260806090000_event_public_submissions.sql` — the
  policy, plus database defaults for `id` and `updatedAt` (Prisma fills both in
  application code; PostgREST cannot).

The policy is `publicEventSchema` from the ad manager restated in SQL: title
and venue lengths, the 70-word cap, a category from `EVENT_CATEGORIES`, a date
that has not already been, and an email or a phone number to reply to. A reader
cannot publish themselves, tag a submission `STAFF`, attach it to an issue, or
read, edit or delete anything — there is no select, update or delete policy.
The operator's tooling connects as `postgres` and bypasses RLS, so none of this
touches it.

Adding a category to `src/pages/submit-event.astro` means adding it to that
migration first: a test reads the list straight out of the SQL and fails when
the two drift apart.
