// Renders the "We're buying" record-wanted cards from card.html.
// Usage: node design/records-wanted/render.mjs
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(dir, '../../public/social');

const sizes = {
  'records-wanted-square': { w: 1080, h: 1080, vars: '--u:8.6px;--wave:230px;--pad:56px;--rec:560px;--recx:-230px;--recy:130px;--tw:270px;--tx:730px;--ty:600px;--tr:-12deg' },
  'records-wanted-portrait': { w: 1080, h: 1350, vars: '--u:10.5px;--wave:290px;--pad:72px;--rec:680px;--recx:-280px;--recy:420px;--tw:320px;--tx:700px;--ty:880px;--tr:-12deg' },
  'records-wanted-story': { w: 1080, h: 1920, vars: '--u:13px;--wave:360px;--pad:84px;--rec:820px;--recx:-300px;--recy:760px;--tw:360px;--tx:640px;--ty:1250px;--tr:-12deg' },
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
