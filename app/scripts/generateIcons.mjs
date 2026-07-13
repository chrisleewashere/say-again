/**
 * Renders the app icon (1024x1024) and splash (2732x2732) PNGs from inline
 * SVG using headless Chromium, straight into the iOS asset catalog.
 *   node scripts/generateIcons.mjs
 */
import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const iconset = resolve(here, '../ios/App/App/Assets.xcassets/AppIcon.appiconset');
const splashset = resolve(here, '../ios/App/App/Assets.xcassets/Splash.imageset');
const publicDir = resolve(here, '../public');

// Original badge mark: spy-noir slate field, dashed "secure channel" ring,
// bold check — the game's escape-confirmed motif.
const badge = (s, withWordmark) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 1024 1024">
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="80%">
      <stop offset="0%" stop-color="#243244"/>
      <stop offset="100%" stop-color="#0f141a"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <circle cx="512" cy="${withWordmark ? 440 : 512}" r="300" fill="none" stroke="#ffb347" stroke-width="34"/>
  <circle cx="512" cy="${withWordmark ? 440 : 512}" r="234" fill="none" stroke="#3b4a5e" stroke-width="12" stroke-dasharray="34 44"/>
  <path d="M400 ${withWordmark ? 452 : 524} l78 78 l146 -168" fill="none" stroke="#ffb347" stroke-width="56" stroke-linecap="round" stroke-linejoin="round"/>
  ${withWordmark ? `<text x="512" y="850" text-anchor="middle" font-family="Avenir Next, Segoe UI, sans-serif" font-size="118" font-weight="700" fill="#f3f6f9">SAY AGAIN?</text>
  <text x="512" y="940" text-anchor="middle" font-family="Avenir Next, Segoe UI, sans-serif" font-size="52" fill="#8494a5">CO-OP FIELD MISSIONS</text>` : ''}
</svg>`;

const page512 = (svg, size) => `<!doctype html><html><body style="margin:0">${svg}</body></html>`;

const executablePath = process.env.KY_CHROMIUM ?? '/opt/pw-browsers/chromium';
const browser = await chromium.launch(existsSync(executablePath) ? { executablePath } : {});

async function shot(svg, size, path) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(page512(svg, size));
  await page.screenshot({ path, clip: { x: 0, y: 0, width: size, height: size } });
  await page.close();
  console.log(`wrote ${path}`);
}

try {
  // App icon: mark only, no wordmark (iOS renders the name below the icon)
  await shot(badge(1024, false), 1024, resolve(iconset, 'AppIcon-512@2x.png'));
  // Splash: centered mark with wordmark, generous margins for all crops
  const splash = `
<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732" viewBox="0 0 2732 2732">
  <rect width="2732" height="2732" fill="#0f141a"/>
  <g transform="translate(854,854) scale(1)">
    ${badge(1024, true).replace(/<svg[^>]*>|<\/svg>/g, '').replace('<rect width="1024" height="1024" fill="url(#bg)"/>', '')}
  </g>
</svg>`;
  for (const name of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
    await shot(splash, 2732, resolve(splashset, name));
  }
  // PWA icon for the web build
  await shot(badge(1024, false), 1024, resolve(publicDir, 'icon-1024.png'));
} finally {
  await browser.close();
}
