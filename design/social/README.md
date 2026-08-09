# Social posts

Ten 1080 × 1080 posts for The Tide, laid out in `posts.html` and rendered to
`public/social/posts/`. Same palette, marks and copy as `src/pages/index.astro`
— the boards alternate between the site's sand ground and an inked version of
it so a run of them reads as a set rather than one long beige block.

Rebuild the whole set after editing the page:

```sh
node design/social/render-posts.mjs
```

Each `.board` in `posts.html` is shot on its own at 2x and downsampled to
1080 × 1080, so boards can be added, reordered or reworded without disturbing
the others. The script pairs boards with file names by position — change the
order in the page and `NAMES` in the script has to move with it.

| # | File | Post |
| --- | --- | --- |
| 01 | `01-your-week-on-the-coast.png` | The hero — what The Tide is |
| 02 | `02-hundreds-of-coasties.png` | Social proof |
| 03 | `03-whats-in-it.png` | Local stories, news, what's on |
| 04 | `04-from-waiwera-to-gulf-harbour.png` | The suburbs covered |
| 05 | `05-list-your-event.png` | Call for events → `/submit-event` |
| 06 | `06-place-a-classified.png` | Call for classifieds → `/submit-classified` |
| 07 | `07-coastie-decal-giveaway.png` | Decal giveaway → `/local-giveaway` |
| 08 | `08-what-would-you-like-to-see.png` | Reader question → `/polls` |
| 09 | `09-one-email-a-week.png` | Free, one email, unsubscribe any time |
| 10 | `10-dont-miss-the-tide.png` | Closing sign-up call |

Every claim on a board comes from a page in `src/pages` — the reader count and
"free forever" from the home page, the suburb list from `/reader-survey`, the
70-word limit and categories from `/submit-classified`, the decal prize from
`/local-giveaway`. Check the wording still matches its page before reposting a
set: events are submitted for consideration, not guaranteed a slot.

Fonts are loaded from `../billboard` so the binaries live in one place: Baloo 2
(headlines), Archivo Black (URL and FREE tags) and Inter (everything else), all
SIL Open Font License.

`render-question.mjs` is separate — it shoots the live `/questions` page for a
one-off post, rather than laying artwork out here.
