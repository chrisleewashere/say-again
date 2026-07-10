import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

const executablePath = process.env.KY_CHROMIUM ?? '/opt/pw-browsers/chromium';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5199',
    // iPad-like canvas; explicit chromium (iPad device presets default to webkit,
    // which isn't installed in this environment)
    browserName: 'chromium',
    viewport: { width: 1194, height: 834 },
    hasTouch: true,
    launchOptions: {
      ...(existsSync(executablePath) ? { executablePath } : {}),
      // container environments often run as root
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    },
  },
  webServer: {
    command: 'npm run dev -- --port 5199 --strictPort',
    url: 'http://localhost:5199',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
