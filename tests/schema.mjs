import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const MIGRATIONS = fileURLToPath(new URL('../supabase/migrations', import.meta.url));

// The quoted, comma-separated list both `col in (...)` and `col <@ array[...]`
// wrap. Matching only quoted items means values containing brackets — like
// 'Professional degree (MD, JD, etc.)' — don't cut the list short.
const LIST = String.raw`((?:\s*'(?:[^']|'')*'\s*,?)+)`;

/**
 * The values a CHECK constraint on public.survey_responses accepts for a
 * column, read out of the migrations themselves. Migrations are applied in
 * filename order, so a later one redefining a constraint wins — same as the
 * database. Read from SQL rather than hardcoded here so the page can't drift
 * away from the table without a test failing.
 */
export function allowedValues(column) {
  let values;

  for (const file of readdirSync(MIGRATIONS).sort()) {
    const sql = readFileSync(`${MIGRATIONS}/${file}`, 'utf8').replace(/--[^\n]*/g, '');
    const scalar = [...sql.matchAll(new RegExp(`${column}\\s+in\\s*\\(${LIST}`, 'g'))].at(-1);
    const array = [...sql.matchAll(new RegExp(`${column}\\s*<@\\s*array\\[${LIST}`, 'g'))].at(-1);
    const match = array ?? scalar;
    if (match) {
      values = [...match[1].matchAll(/'((?:[^']|'')*)'/g)].map((m) => m[1].replace(/''/g, "'"));
    }
  }

  if (!values) throw new Error(`No CHECK list for ${column} in supabase/migrations`);
  return values;
}
