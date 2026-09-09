# Partnership outreach kit

Everything for approaching **Hibiscus Coast businesses and organisations that
have their own email list or audience** and proposing a mutual promotion — they
mention The Tide to their people, The Tide features them to Coasties. No money
moves; no list is ever handed over.

| File | What it is |
| --- | --- |
| [`partnership-email.md`](partnership-email.md) | The outreach emails — warm, cold and follow-up — plus subject lines, the offer menu, personalising notes, and the compliance rule |
| [`social-posts.md`](social-posts.md) | Six posts: Facebook, Instagram, LinkedIn, a community-group version, and a partner shout-out template for when one goes live |
| `partner-invite.html` | Source for the 1080×1080 square card — "Run an email list on the Coast?" |
| `partners-wanted.html` | Source for the 1080×1080 square card — "We're looking for local partners", warm/soft treatment, pairs with the "we're looking for partners" Facebook post |
| `partners-wanted-modern.html` | Same message, dark high-contrast treatment — Archivo Black headline, one Sky accent, hairline frame, corner brackets, wave reduced to a hint |
| `partner-invite-wide.html` | Source for the 1200×630 link-preview / email-header / LinkedIn card |
| `thetide-partner-invite-1080x1080.png` | Rendered square card — pair with the Facebook/Instagram posts |
| `thetide-partners-wanted-1080x1080.png` | Rendered square card (warm) — pair with the "we're looking for partners" post |
| `thetide-partners-wanted-modern-1080x1080.png` | Rendered square card (dark/modern) — same post, bolder look |
| `thetide-partner-invite-wide-1200x630.png` | Rendered wide card — pair with the LinkedIn post, or use as an email header |
| `render.sh` | Renders both HTML files to PNG at exact size |

## Rebuild the images after editing a page

```sh
sh render.sh
```

Drives headless Chromium at 1x straight to the exact pixel size — no Pillow
step, unlike `../banner/render.sh` and `../billboard/render.sh`. Override the
browser with `CHROME=/path/to/chrome`. Look at the PNG after any copy change:
the headline lines are set at a fixed size and don't wrap, so a longer line
runs to the frame instead of reflowing.

## Editing the copy

The `EDIT ME` block in each HTML file is the whole card — eyebrow, headline
lines, one sub line. Same palette, wave motif, logo and type as
`src/pages/index.astro` and the billboard: Sand/Sea/Sky, Baloo 2 headline,
Archivo Black contact tag, Inter for the rest. Fonts come from `../billboard/`
so there's one checked-in copy of each.

The cards carry the contact address in words (`hello@thetide.co.nz`) because
they're posted on their own, not as a link preview — an image isn't clickable
in every place it gets posted. Same reasoning as `render-submit.mjs` in
`../social/`.

## The compliance rule (don't skip this)

The partner emails **their own list from their own account**. The Tide never
receives, uploads or stores anyone's list. Every new reader opts in themselves
at `thetide.co.nz`. That makes it an endorsed opt-in rather than a list
transfer, which is what keeps both sides inside the Unsolicited Electronic
Messages Act 2007. The emails and the LinkedIn post say so on purpose — leave
that line in.

## What a partnership gives each side

Lead with the first two; the rest are for the follow-up or the "let's make it
regular" conversation.

| The Tide gives | The partner gives |
| --- | --- |
| A written feature in an issue (a write-up, not a banner) | One mention of The Tide to their list, with our copy + signup link |
| A standing spot in the [business directory](https://thetide.co.nz/hibiscus-coast-business-directory) | A signup link in their newsletter footer / on their site |
| A comped event or classified listing | A shout-out on their social once |
| "Founding local partner" wording (capped) | An intro to one or two other local operators |
| Recurring monthly shout-out / cross-post / joint giveaway once proven | The same back |
