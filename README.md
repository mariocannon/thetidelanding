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

See [`supabase/README.md`](supabase/README.md) for the flow, required secrets,
and deploy steps.
