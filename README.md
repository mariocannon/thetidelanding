# The Tide — landing page

A fast, single-page signup site for **The Tide** email newsletter, built with [Astro](https://astro.build).

- One statically prerendered HTML page — nothing to hydrate
- System fonts, inlined CSS, inline SVG artwork
- The signup form is beehiiv's official embed, loaded from beehiiv on demand;
  the rest of the page makes no external requests

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

The home page signup form is **beehiiv's own embedded subscribe form**
(`subscribe-forms.beehiiv.com/v3/loader.js`, form id in
[`src/pages/index.astro`](src/pages/index.astro)). It subscribes visitors
**straight to Beehiiv** from the browser — **Supabase is not involved at all**,
and nothing is stored on our side. To change the form's fields, styling, or
welcome-email behaviour, edit it in **beehiiv → Grow → Subscribe Forms**; no
code change is needed. Swap `BEEHIIV_FORM_ID` in `index.astro` only if the form
is recreated with a new id.

The other pages' forms are unchanged — they still insert into the Supabase
`subscribers` table (and other tables), and a database trigger forwards new
subscribers to Beehiiv through the `beehiiv-sync` edge function.

See [`supabase/README.md`](supabase/README.md) for that path, its required
secrets, and deploy steps. To view or export subscribers, use the Beehiiv
dashboard.
