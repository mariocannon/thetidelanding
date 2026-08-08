import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const MIGRATIONS = fileURLToPath(new URL('../supabase/migrations', import.meta.url));

/** The noticeboard tables live in a second Supabase project of their own. */
export const ADS_MIGRATIONS = fileURLToPath(
  new URL('../supabase/newsletter-ads/migrations', import.meta.url)
);

// The quoted, comma-separated list both `col in (...)` and `col <@ array[...]`
// wrap. Matching only quoted items means values containing brackets — like
// 'Professional degree (MD, JD, etc.)' — don't cut the list short.
const LIST = String.raw`((?:\s*'(?:[^']|'')*'\s*,?)+)`;

/**
 * The values the database accepts for a column — from a CHECK constraint on
 * public.survey_responses, or from the WITH CHECK on an insert policy — read
 * out of the migrations themselves. Migrations are applied in filename order,
 * so a later one redefining a constraint wins, same as the database. Read from
 * SQL rather than hardcoded here so a page can't drift away from the table
 * without a test failing.
 *
 * Pass `table` when more than one table in `dir` checks a column of the same
 * name — public."Event" and public."Classified" both check `category`, and
 * without it the later migration would answer for both.
 */
export function allowedValues(column, dir = MIGRATIONS, table) {
  let values;

  for (const file of readdirSync(dir).sort()) {
    let sql = readFileSync(`${dir}/${file}`, 'utf8').replace(/--[^\n]*/g, '');

    // Statements naming the table asked for. Policies and alters hold no
    // semicolons of their own, so splitting on one gives whole statements.
    if (table) {
      sql = sql
        .split(';')
        .filter((statement) => statement.includes(`public."${table}"`))
        .join(';');
    }

    const scalar = [...sql.matchAll(new RegExp(`${column}\\s+in\\s*\\(${LIST}`, 'g'))].at(-1);
    const array = [...sql.matchAll(new RegExp(`${column}\\s*<@\\s*array\\[${LIST}`, 'g'))].at(-1);
    const match = array ?? scalar;
    if (match) {
      values = [...match[1].matchAll(/'((?:[^']|'')*)'/g)].map((m) => m[1].replace(/''/g, "'"));
    }
  }

  if (!values) throw new Error(`No CHECK list for ${column} in ${dir}`);
  return values;
}
