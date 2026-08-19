/**
 * Every issue of The Tide, newest first.
 *
 * The issues themselves live on Beehiiv — this is only the list that points at
 * them, kept by hand so the build never depends on Beehiiv being up. Adding one
 * is a single entry here and a commit:
 *
 *   {
 *     date: '2026-08-14',            // the day it went out, ISO, so it sorts
 *     title: 'Headline of the issue',
 *     blurb: 'One line on what was in it.',
 *     url: 'https://…',              // its page on Beehiiv
 *   }
 *
 * The blurb is the whole reason a reader picks one issue over another — write it
 * for them, not as a summary of the contents.
 *
 * While this list is empty the home page doesn't link to /issues at all, so an
 * empty archive is never something a reader can land on.
 */
export const issues = [];
