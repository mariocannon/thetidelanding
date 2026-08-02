import { existsSync, readdirSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;

// Sandboxes (Claude Code on the web, some CI images) ship a pre-installed
// Chromium whose revision won't match the one this Playwright version wants.
// Point at it when it's there; everywhere else use the browser Playwright
// downloaded for itself.
function sandboxChromium() {
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!root || !existsSync(root)) return undefined;
  const build = readdirSync(root)
    .filter((entry) => entry.startsWith('chromium-'))
    .map((entry) => `${root}/${entry}/chrome-linux/chrome`)
    .find(existsSync);
  return build;
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    launchOptions: { executablePath: sandboxChromium() },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    // The built site rather than the dev server: /reader-survey ships as one
    // file, so this tests what readers actually get.
    command: `npm run build && npm run preview -- --port ${PORT}`,
    url: `http://localhost:${PORT}/reader-survey`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
