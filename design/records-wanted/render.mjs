// Renders the "We're buying" record-wanted cards from card.html.
// Usage: node design/records-wanted/render.mjs
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(dir, '../../public/social');

const sizes = {
  'records-wanted-square': { w: 1080, h: 1080, vars: '--u:10px;--pad:64px;--rec:600px;--recx:-250px;--recy:110px;--tw:290px;--tx:720px;--ty:660px;--tr:-12deg' },
  'records-wanted-portrait': { w: 1080, h: 1350, vars: '--u:10.5px;--pad:72px;--rec:680px;--recx:-280px;--recy:420px;--tw:320px;--tx:700px;--ty:880px;--tr:-12deg' },
  'records-wanted-story': { w: 1080, h: 1920, vars: '--u:13px;--pad:84px;--rec:860px;--recx:-280px;--recy:560px;--tw:380px;--tx:620px;--ty:1240px;--tr:-12deg' },
};

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
for (const [name, { w, h, vars }] of Object.entries(sizes)) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto('file://' + path.join(dir, 'card.html'), { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: `:root{--w:${w}px;--h:${h}px;${vars}}` });
  await page.evaluate(async () => { await document.fonts.load('40px Anton'); await document.fonts.load('700 20px "Space Mono"'); await document.fonts.ready; });
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  await page.close();
  console.log('wrote', `${name}.png`);
}
await browser.close();
