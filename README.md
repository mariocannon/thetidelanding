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

Signups go straight to **Beehiiv**. The form `fetch`es a small Supabase edge
function (`beehiiv-sync`) in the **the-tide** project
(`jykpoupjvcmvoihujfkc`, ap-southeast-2), which subscribes the email to the
Beehiiv publication. The Beehiiv API key lives only in the function's secrets,
never in the browser. Beehiiv is the source of truth — no subscriber data is
stored in Supabase.

See [`supabase/README.md`](supabase/README.md) for the function, required
secrets, and deploy steps. To view or export subscribers, use the Beehiiv
dashboard.
