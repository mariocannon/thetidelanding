# The Tide — landing page

A fast, single-page signup site for **The Tide** email newsletter, built with [Astro](https://astro.build).

- One self-contained HTML page (~5.7 KB), zero external requests
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

The home page signup form subscribes users **directly to Beehiiv**: it
`fetch`es a small Supabase edge function (`beehiiv-sync`) in the **the-tide**
project (`jykpoupjvcmvoihujfkc`, ap-southeast-2), which subscribes the email to
the Beehiiv publication. The Beehiiv API key lives only in the function's
secrets, never in the browser, and nothing is stored in Supabase for these
signups.

The other pages' forms are unchanged — they still insert into the Supabase
`subscribers` table (and other tables), and a database trigger forwards new
subscribers to Beehiiv through the same function.

See [`supabase/README.md`](supabase/README.md) for both paths, the required
secrets, and deploy steps. To view or export subscribers, use the Beehiiv
dashboard.
