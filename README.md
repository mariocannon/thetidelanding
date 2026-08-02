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

## Subscribers

Every signup form — the home page included — inserts the email into the
Supabase `subscribers` table in the **the-tide** project
(`jykpoupjvcmvoihujfkc`, ap-southeast-2), using the publishable key with
insert-only row-level security. The browser never talks to Beehiiv directly.

A database trigger on `subscribers` then forwards each new row to Beehiiv
through the `beehiiv-sync` edge function.

## Reader survey

`/survey` collects reader demographics into the Supabase `survey_responses`
table — the first-party data a media kit is built from. Before promoting it,
check the postcode list and the placeholder prize copy at the top of
[`src/pages/survey.astro`](src/pages/survey.astro).

See [`supabase/README.md`](supabase/README.md) for the flow, required secrets,
and deploy steps.
