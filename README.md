# The Tide — landing page

A fast, single-page signup site for **The Tide** email newsletter, built with [Astro](https://astro.build).

- One self-contained HTML page, zero external requests on load
- System fonts, inlined CSS, inline SVG artwork, tiny inline form script
- Statically prerendered — nothing to hydrate

## Develop

```sh
npm install
npm run dev
```

## Build

```sh
npm run build   # output in dist/
```

## Test

```sh
npm test                       # builds, serves dist/, drives it in Chromium
npm test -- --project=desktop  # one viewport
npm test -- --ui               # watch it click through
```

[Playwright](https://playwright.dev) covers `/reader-survey`, the longest form on the
site, at desktop and phone widths: validation, the conditional children's-ages
question, the progress count, and the exact JSON each answer set posts to
Supabase. Requests to Supabase are intercepted, so running the tests never
writes a row.

One test reads the CHECK constraints straight out of `supabase/migrations` and
asserts the page offers those options and no others — an option added to the
page without a matching migration fails the build rather than 400ing on a
reader mid-survey.

## Privacy

`/privacy` says what each form collects, who else handles it (Supabase, Beehiiv,
Stripe) and how a reader gets their details back or deleted. Every other page
links to it.

The page lists each form alongside the table it writes to, and a test reads
every `/rest/v1/<table>` the pages post to and fails if one isn't described
there — so a new form can't start collecting details the page doesn't mention.
Contact address for requests: `hello@thetide.co.nz`.

## Subscribers

Every signup form — the home page included — inserts the email into the
Supabase `subscribers` table in the **the-tide** project
(`jykpoupjvcmvoihujfkc`, ap-southeast-2), using the publishable key with
insert-only row-level security. The browser never talks to Beehiiv directly.

A database trigger on `subscribers` then forwards each new row to Beehiiv
through the `beehiiv-sync` edge function.

## What's on

`/submit-event` is the ad manager's `/submit/event` form rebuilt here — same
fields, same rules, same wording — so an event can be listed from The Tide's
own site. It inserts into the `Event` table in the **Newsletter ad management**
project (`tlderdsxnonhemkdxqns`) as an unassigned `DRAFT` tagged
`source = 'PUBLIC'`, which is where the ad manager's What's On list picks it up.

Listing an event is free. **Feature my event — $4.99** is the one paid extra:
tick it, attach a photo, and the listing runs with the photo above its copy in
the newsletter. The page takes no payment and says so — the fee lands on the
row as `UNPAID` for the desk to invoice once the issue is confirmed. The photo
goes to Supabase Storage first and the listing carries its public URL, so a
failed upload files nothing at all.

## Classifieds

`/submit-classified` is the same rebuild of the ad manager's `/submit` form. It
inserts into the `Classified` table in the same **Newsletter ad management**
project as an unassigned `DRAFT` tagged `source = 'PUBLIC'`, which is where the
ad manager's classifieds queue picks it up — a headline, up to 70 words, a
category, and an email or phone number readers can reply to.

It carries the same featured upgrade the events form does, priced separately at
**$1.99**: tick **Feature my listing**, attach a photo, and the listing runs
with it at the top of the classifieds block. Nothing is charged on the page —
the fee lands `UNPAID` for the desk to invoice.

See [`supabase/README.md`](supabase/README.md) for the flow, required secrets,
and deploy steps.

## Pickleball lessons

`/orewapickleball` is a landing page for somebody else's event: Orewa Pickleball
Club's intro group lesson. It wears the club's colours rather than The Tide's --
it is the one page on the site that does -- and takes a booking into the
`pickleball_signups` table in the **the-tide** project: name, email, an optional
phone, suburb, age, and whether they have played before. The last two are what
the coach splits the group by.

No money moves on the page. The $75 is settled with the club, which is what the
page says and what `/privacy` repeats. The club is the only outside organisation
the site hands a list of readers to, so it is named on `/privacy` alongside
Supabase, Beehiiv and Stripe.
