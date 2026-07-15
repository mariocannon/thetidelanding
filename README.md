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

The signup form validates the email and confirms client-side. Wire the
`submit` handler in `src/pages/index.astro` to your email provider
(Buttondown, ConvertKit, Supabase, …) to store subscribers.
