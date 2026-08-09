# Social posts

Ten 1080 × 1080 posts for The Tide, laid out in `posts.html` and rendered to
`public/social/posts/`. Same palette, marks and fonts as `src/pages/index.astro`.

Rebuild the whole set after editing the page:

```sh
node design/social/render-posts.mjs
```

Each `.board` in `posts.html` is shot on its own at 2x and downsampled to
1080 × 1080, so boards can be added, reordered or reworded without disturbing
the others. The script pairs boards with file names by position — change the
order in the page and `NAMES` in the script has to move with it — and clears
the output folder first, so a renamed board doesn't leave its old PNG behind
to be posted by mistake.

## Who they're written for

The set is aimed at **Coastie Carol**: 68, retired, Ōrewa, on Facebook and an
iPad, walks the estuary, eats out with Graham, belongs to a club or three, and
forwards anything useful to her walking group. That drives both the copy and
the craft.

- **Events and food lead**, because they were the two near-universal asks in
  the reader survey. They get a post each (02, 03) rather than a bullet in a
  list, and they seed the two share mechanics (05, 06).
- **Body copy is 38px on an 1080 square** — larger than looks right in a design
  tool, sized for a phone at arm's length. Body text runs darker than the
  site's `--slate` so every line clears 7:1 on the sand ground.
- **Voice is over-the-fence**, not masthead: "we tried it", "send it over",
  "no more hunting".
- **Belonging over swag.** The decal giveaway skews young, so Carol's referral
  posts ask her to nominate a local legend or her favourite café — she shares
  by vouching for a neighbour, not by chasing a sticker.
- **Friction is answered out loud** (08): no app, no password, ten seconds.
- **Reliability is a promise she can see** (07), because vanishing for three
  weeks is what loses her.

## How the set is built

Ten centred stacks in a row got samey in a feed, so the boards run three
layouts and four grounds instead:

- **Layouts** — centred stack (01, 04, 05, 06, 08, 10), left-aligned editorial
  with a bulleted list (02, 09), and a raised card with a ribbon, for the two
  boards that should read like a clipping (03, 07).
- **Grounds** — sand, ink, a sunrise wash, and the deep sea. No two
  consecutive posts share one.
- **Warmth** — the logo draws a sun over water but the site never spends it.
  It now carries the rays behind the mark, the list bullets, the underline on
  one word a board, the tilted FREE sticker, and the whole of board 05.
  Every piece of *text*, though, still sits on ink, sand or sea: the sun is
  never asked to hold type, so nothing rides on a weak pairing. On the sun
  ground the emphasis is a sand underline rather than a second hue, because
  every warm accent tested there went muddy.
- Grain, layered waves and a postmark on 04 keep the flat grounds from
  reading like slides.

| # | File | Post | Job |
| --- | --- | --- | --- |
| 01 | `01-your-week-on-the-coast.png` | For Coasties, by Coasties | Hero, belonging first |
| 02 | `02-no-more-hunting-for-whats-on.png` | What's on this week | Hook one — events |
| 03 | `03-where-to-eat-this-week.png` | We tried it | Hook two — food |
| 04 | `04-from-waiwera-to-gulf-harbour.png` | Your patch | Belonging |
| 05 | `05-know-a-local-legend.png` | Nominate a local legend | Share mechanic |
| 06 | `06-which-coast-cafe.png` | Best café on the Coast | Share mechanic + food |
| 07 | `07-same-day-same-voice.png` | Same day, same voice | Reliability |
| 08 | `08-no-app-no-password.png` | No app, no password | Removes friction |
| 09 | `09-got-something-on.png` | Club, committee | Event supply |
| 10 | `10-know-someone-whod-love-this.png` | Forward it on | Word of mouth |

Carol is not the whole Coast — the young-family belt around Millwater barely
showed up in the survey and is the long-term growth ceiling. A second set aimed
at them would want different hooks (schools, weekend-with-kids, tradies) and
could reuse these boards wholesale.

## Before posting

Two boards promise a mechanic the site doesn't have yet. **05** and **06** ask
readers to nominate a local legend and a café, and both point at
`thetide.co.nz` — `/polls` currently asks a different question. Either wire the
nomination up first or hold those two back.

Everything else is checked against a page in `src/pages`: the reader count and
"free forever" from the home page, the suburbs from `/reader-survey`.

Board 09 promises submitted events get posted out to readers. `/submit-event`
itself only says a submission will be *considered* for the what's-on section,
so either the form's wording should follow the post or the post should soften
back — as it stands the two disagree.

Suburb names carry macrons (Ōrewa, Whangaparāoa). The site's own forms spell
them without — worth aligning one way or the other.

Fonts are loaded from `../billboard` so the binaries live in one place: Baloo 2
(headlines), Archivo Black (URL and FREE tags) and Inter (everything else), all
SIL Open Font License.

`render-question.mjs` is separate — it shoots the live `/questions` page for a
one-off post, rather than laying artwork out here.
