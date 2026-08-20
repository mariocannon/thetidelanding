/**
 * Every issue of The Tide, newest first.
 *
 * The issues themselves live on Beehiiv — this is only the list that points at
 * them, kept by hand so the build never depends on Beehiiv being up. Adding one
 * is a single entry here and a commit:
 *
 *   {
 *     date: '2026-08-20',            // the day it went out, ISO, so it sorts
 *     url: 'https://…',              // its page on Beehiiv
 *     title: 'Headline of the issue',   // optional
 *     blurb: 'One line on what was in it.',  // optional
 *   }
 *
 * Only `date` and `url` are needed — an entry with just those two lists as its
 * date, which is how a reader picks an issue out of a newsletter archive anyway.
 * Add a title and a blurb when there's a reason to read one issue over another;
 * the blurb is for the reader, not a summary of the contents.
 *
 * While this list is empty the home page doesn't link to /issues at all, so an
 * empty archive is never something a reader can land on.
 */
export const issues = [
  {
    date: '2026-08-20',
    url: 'https://thetidehbc.beehiiv.com/p/august-20th-2026',
  },
  {
    date: '2026-08-13',
    url: 'https://thetidehbc.beehiiv.com/p/august-13th-2026-97a22e281d64eaf6',
  },
  {
    date: '2026-08-06',
    url: 'https://thetidehbc.beehiiv.com/p/august-6th-2026',
  },
];
