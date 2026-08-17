# Supabase — The Tide

Source of truth for the **the-tide** Supabase project
(`jykpoupjvcmvoihujfkc`, ap-southeast-2). These files document and version the
database + edge function that back newsletter signups.

Two projects are in play, and only the first one is this project's own:

| Directory | Project | Backs |
| --- | --- | --- |
| `migrations/` | **the-tide** (`jykpoupjvcmvoihujfkc`) | signups, polls, the reader survey |
| `newsletter-ads/migrations/` | **Newsletter ad management** (`tlderdsxnonhemkdxqns`) | `/submit-event` → the what's-on noticeboard, `/submit-classified` → the classifieds queue |

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

Adding a category to `src/pages/submit-event.astro` means adding it to the
latest of those migrations first: a test reads the list straight out of the SQL
and fails when the two drift apart.

### Featuring an event

`20260817000000_featured_event_submissions.sql` adds the upgrade, in two halves.

The **listing** half restates the insert policy — a policy is replaced whole —
with the four featured columns on the end. The fee is pinned to the current
price and the payment state to `'UNPAID'`: a submitter can ask to be featured, but cannot
price it, and cannot arrive claiming to have paid. A featured row must carry an
`imageUrl`, and only one that matches a photo this project's own storage let
in, so a listing can't point the newsletter at somebody else's server.

The **photo** half is an insert-only policy on `storage.objects`:

```
POST /storage/v1/object/creative/public-events/<uuid>.png
  → policy "Public listing photos"  (anon, insert only)
  → public URL, which the listing then carries
```

- It goes in `creative`, the bucket the ad manager already uploads booking
  creative to, under a `public-events/` prefix. (`20260817130000` renamed that
  policy to `"Public listing photos"` when classifieds joined it.) Same bucket on purpose: the ad
  manager's `deleteFile()` parses that bucket out of the URL, so un-featuring
  or deleting a listing still cleans the photo up.
- The name has to be a generated UUID with a raster extension, which rules out
  traversal, collisions with the operator's own creative at the bucket root,
  and overwriting somebody else's photo. There is no update or delete policy,
  so a name that exists cannot be replaced.
- No SVG from this door — it is a document that can carry script, and not
  something to take from a stranger on a public bucket. The operator's own
  uploads still may; they come through the ad manager.
- The bucket itself now carries `lib/upload.ts`'s limits — 5MB, images only —
  so they hold for an uploader who never went through it.

Classifieds work the same way, added in
`20260817130000_featured_classified_submissions.sql`: the same four columns
pinned the same way, photos under `public-classifieds/` instead of
`public-events/`, and one `"Public listing photos"` policy covering both
prefixes. In the newsletter a featured classified leads the block *and brings
its category heading with it*, since that block is grouped by category — a
listing is never printed away from the heading it belongs under.

### Changing the price

Each listing type is priced separately — **$4.99** to feature an event,
**$1.99** to feature a classified — and the policies pin each fee exactly. So a
price lives in three places that have to agree: `FEATURED_EVENT_FEE` or
`FEATURED_CLASSIFIED_FEE` in the ad manager, the `FEE` constant on the matching
page here, and the `with check` on that policy.

Repricing means a new migration restating the affected policy, and the page
deploying alongside it: while the two disagree, a featured submission from the
live site is refused at the door. `20260817140000_featured_fee_1_99.sql` and
`20260817150000_featured_event_fee_4_99.sql` are the worked examples — the
second splits the two prices apart again.

Rows already sold keep the fee snapshotted on them, which is the point of the
column: a price change never rewrites an invoice, and one list can hold listings
sold at several different prices.

Two things this does not have, both worth knowing: there is no per-IP rate
limit on the upload (the ad manager's own endpoint allows 5 submissions per IP
per 10 minutes; PostgREST and Storage have no equivalent here, so the honeypot
and the minimum time-on-page are the only brakes), and a photo whose listing
then fails to insert stays in the bucket unreferenced, since anon has no delete
policy to clean it up with.

## Classifieds — reader submissions

`/submit-classified` is the ad manager's `/submit` rebuilt the same way: same
fields, same rules, same wording. It writes to `public."Classified"` in the
**Newsletter ad management** project (`tlderdsxnonhemkdxqns`) — the table the
ad manager's classifieds queue reads.

The ad manager's own form posts to `/api/classifieds/submit`, which validates
with `publicClassifiedSchema` and writes through Prisma. There is no such
server here, so the insert policy is that schema restated in SQL and PostgREST
is the endpoint.

```
POST /rest/v1/Classified   { …, "status": "DRAFT", "source": "PUBLIC", "issueId": null }
  → policy "Public classified submissions"  (anon, insert only)
  → DRAFT in the ad manager's classifieds list
```

- `newsletter-ads/migrations/20260808090000_classified_public_submissions.sql` —
  the policy, plus database defaults for `id` and `updatedAt` (Prisma fills both
  in application code; PostgREST cannot).
- `newsletter-ads/migrations/20260817130000_featured_classified_submissions.sql`
  — the featured upgrade on classifieds, and the storage policy widened to take
  a photo for either listing type.

Headline and copy lengths, the 70-word cap (`CLASSIFIED_WORD_MAX`), a category
from `CLASSIFIED_CATEGORIES`, and an email or a phone number to reply to. As
with events there is no select, update or delete policy: a reader can post a
listing and can never read, edit or remove one — not even their own.

Both tables check a column called `category`, so the test helper takes the
table name (`allowedValues('category', ADS_MIGRATIONS, 'Classified')`) and one
list can't answer for the other.
