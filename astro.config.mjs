import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // The live origin. Canonical tags and the sitemap are both absolute URLs, so
  // this is the one place the domain is written down.
  site: 'https://thetide.co.nz',
  output: 'static',
  trailingSlash: 'never',
  build: {
    // Astro's default ('auto') only inlines a stylesheet under 4kB, and drops
    // to an external <link> above it. Every page here is meant to be one
    // self-contained document with no external requests on load — the brand
    // guide counts that speed as part of the promise — so inline regardless
    // of size rather than let a page silently sprout a blocking request the
    // next time its CSS grows.
    inlineStylesheets: 'always',
  },
  integrations: [
    sitemap({
      // /reader-survey is only reachable straight after a signup — it's a form
      // mid-flow, not a page anybody should land on from a search result.
      filter: (page) => !page.startsWith('https://thetide.co.nz/reader-survey'),
    }),
  ],
});
