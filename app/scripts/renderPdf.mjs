/**
 * Renders the generated manual HTML to PDFs in /manuals using the
 * pre-installed Chromium. Run after generateManualHtml.ts:
 *   node scripts/renderPdf.mjs
 */
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const buildDir = resolve(here, '../../manual/build');
const outDir = resolve(here, '../../manuals');
mkdirSync(outDir, { recursive: true });

const editions = [
  { html: 'manual-standard.html', pdf: 'field-manual-standard.pdf' },
  { html: 'manual-simplified.html', pdf: 'field-manual-easy-read.pdf' },
];

// Use the environment-provided Chromium when the pinned Playwright version's
// own browser build isn't downloaded (e.g. remote CI containers).
const executablePath = process.env.KY_CHROMIUM ?? '/opt/pw-browsers/chromium';
const browser = await chromium.launch(
  existsSync(executablePath) ? { executablePath } : {},
);
try {
  for (const { html, pdf } of editions) {
    const src = resolve(buildDir, html);
    if (!existsSync(src)) {
      throw new Error(`Missing ${src} — run: npx vite-node scripts/generateManualHtml.ts`);
    }
    const page = await browser.newPage();
    await page.goto(`file://${src}`);
    await page.pdf({
      path: resolve(outDir, pdf),
      format: 'Letter',
      margin: { top: '0.6in', bottom: '0.7in', left: '0.55in', right: '0.55in' },
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate:
        '<div style="width:100%;text-align:center;font-size:9px;color:#444;">' +
        'Say Again? — Field Manual · page ' +
        '<span class="pageNumber"></span> of <span class="totalPages"></span></div>',
      printBackground: true,
    });
    await page.close();
    // Pin the embedded timestamps so regenerating an unchanged manual never
    // dirties the tracked PDFs (Chromium writes the current time by default).
    const out = resolve(outDir, pdf);
    const buf = readFileSync(out, 'latin1');
    const pinned = buf.replace(
      /\/(CreationDate|ModDate) \(D:\d{14}/g,
      "/$1 (D:20260101000000",
    );
    writeFileSync(out, pinned, 'latin1');
    console.log(`wrote ${out}`);
  }
} finally {
  await browser.close();
}
