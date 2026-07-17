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

Signups are stored in the `subscribers` table of the **the-tide** Supabase
project (`jykpoupjvcmvoihujfkc`, ap-southeast-2) via a direct PostgREST
`fetch` — no client library. The embedded key is the project's publishable
key; row-level security allows anonymous inserts only, so subscriber emails
can never be read from the browser. Duplicate signups (unique on
`lower(email)`) are treated as already subscribed.

To view subscribers, use the Supabase dashboard or query with a secret key:

```sql
select email, created_at from public.subscribers order by created_at desc;
```
