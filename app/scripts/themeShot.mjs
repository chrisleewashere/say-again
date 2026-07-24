/**
 * Theme screenshot probe: renders a FIXED mission (same code + module list,
 * so every theme is photographed on identical content) under a given theme
 * and captures overview + zoomed-face shots.
 *
 *   node scripts/themeShot.mjs <themeId> <outDir>
 *
 * Requires the dev server on :5199 (npx vite --port 5199).
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const [themeId, outDir] = process.argv.slice(2);
if (!themeId || !outDir) {
  console.error('usage: node scripts/themeShot.mjs <themeId> <outDir>');
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1194, height: 834 } });
page.on('pageerror', (e) => console.log('PAGEERROR:', e.message.slice(0, 200)));
await page.addInitScript(
  ([id]) => {
    localStorage.setItem('ky-scene-mode', '3d');
    localStorage.setItem('ky-scene-theme', id);
  },
  [themeId],
);
await page.goto('http://localhost:5199/');

// fixed mission: same code + list => identical puzzles for every theme
await page.getByLabel('Replay a mission code').fill('THM-777');
await page.getByRole('button', { name: 'Load' }).click();
for (const name of [
  'Laser Grid Bypass, Rookie',
  'Crack the Safe, Rookie',
  'Code Room, Rookie',
  'Debrief Tapes, Rookie',
  'Bad Intel, Rookie',
  'Asset Interview, Rookie',
]) {
  await page.getByRole('button', { name: new RegExp(`Add ${name}`) }).click();
}
await page.getByRole('button', { name: /Gentle timer/ }).click();
await page.getByRole('button', { name: 'Start Mission' }).click();

await page.waitForSelector('.scene-open-btn', { timeout: 120000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${outDir}/${themeId}-overview.png` });

await page.getByRole('button', { name: 'Open the lit panel' }).click();
await page.waitForTimeout(2500);
await page.screenshot({ path: `${outDir}/${themeId}-zoom.png` });

await browser.close();
console.log(`wrote ${outDir}/${themeId}-overview.png and ${themeId}-zoom.png`);
