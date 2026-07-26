import { expect, test } from '@playwright/test';
import { hashSeed } from '../src/engine/rng';
import { generateWireMaze, solveWireMaze } from '../src/modules/wireMaze/logic';

/**
 * Field Case (3D) smoke: scene mounts, tap-to-zoom enables interaction, and
 * solving through the IN-SCENE canvas face reaches the debrief. The face is
 * driven via the dev-only __kyFace hook (headless software GL makes pixel
 * raycast clicks flaky); region ids/labels are the same contract real taps
 * hit-test against. Software GL in CI is slow, so generous waits.
 */
test('field case: open, zoom, solve on the in-scene face, debrief', async ({ page }) => {
  test.slow();
  await page.addInitScript(() => localStorage.setItem('ky-scene-mode', '3d'));
  await page.goto('/');
  await page.getByRole('button', { name: 'New Mission' }).click();
  await page.getByRole('button', { name: /Add Laser Grid Bypass, Rookie/ }).click();
  await page.getByRole('button', { name: 'Start Mission' }).click();

  const code = await page.locator('.run-header .mission-code').textContent();
  const seed = hashSeed(`${code}:0:wire-maze:1`);
  const instance = generateWireMaze(seed, 1);
  const solution = solveWireMaze(instance.state);

  // case-open ritual finishes, plates rack in. (The old readiness sentinel was
  // .scene-hint, the "drag to turn the case" directions line — removed, since
  // students have it after a mission or two. .scene-open-btn is the real signal:
  // it only renders once the plates are racked.)
  await page.waitForSelector('.scene-open-btn', { timeout: 60_000 });
  await page.waitForTimeout(2500);

  // zoom via the accessible chrome button (keyboard/switch users share this path)
  await page.getByRole('button', { name: 'Open the lit panel' }).click();
  await expect(page.getByRole('button', { name: /Step back/ })).toBeVisible({ timeout: 15_000 });

  // the in-scene face is live: HUD shows the codename + status line
  await expect(page.locator('.scene-zoom-hud')).toBeVisible();
  await expect(page.locator('.scene-status')).toContainText(/Wire panel/i, { timeout: 15_000 });
  await page.waitForFunction(() => window.__kyFace !== undefined, undefined, { timeout: 15_000 });

  // region labels mirror the 2D module's accessible names
  const labels: string[] = await page.evaluate(() => window.__kyFace!.regions().map((r: { label: string }) => r.label));
  for (let i = 0; i < instance.state.wires.length; i++) {
    const w = instance.state.wires[i];
    expect(labels[i]).toContain(`Wire ${i + 1}: ${w.color}, ${w.pattern}, tag ${w.label}`);
  }

  for (const wireIndex of solution) {
    await page.evaluate((id) => window.__kyFace!.tap(id), `wire-${wireIndex}`);
  }

  await expect(page.getByRole('heading', { name: /Mission grade: A\+/ })).toBeVisible({ timeout: 15_000 });
});

/**
 * A wrong tap on the in-scene face strikes (alarm) but leaves the wire
 * intact, and the module can still be failed/completed per maxStrikes.
 */
test('field case: wrong wire strikes via the in-scene face', async ({ page }) => {
  test.slow();
  await page.addInitScript(() => localStorage.setItem('ky-scene-mode', '3d'));
  await page.goto('/');
  await page.getByRole('button', { name: 'New Mission' }).click();
  await page.getByRole('button', { name: /Add Laser Grid Bypass, Rookie/ }).click();
  // allow 3 wrong so one strike does not end the module
  await page.getByRole('button', { name: /3 wrong/i }).click();
  await page.getByRole('button', { name: 'Start Mission' }).click();

  const code = await page.locator('.run-header .mission-code').textContent();
  const seed = hashSeed(`${code}:0:wire-maze:1`);
  const instance = generateWireMaze(seed, 1);
  const solution = solveWireMaze(instance.state);
  const wrong = instance.state.wires.findIndex((_, i) => i !== solution[0]);

  await page.waitForSelector('.scene-open-btn', { timeout: 60_000 });
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: 'Open the lit panel' }).click();
  await page.waitForFunction(() => window.__kyFace !== undefined, undefined, { timeout: 15_000 });

  await page.evaluate((id) => window.__kyFace!.tap(id), `wire-${wrong}`);
  await expect(page.locator('.scene-status')).toContainText(/Wrong wire/i);
  await expect(page.locator('.run-header')).toContainText('Wrong: 1 of 3');

  for (const wireIndex of solution) {
    await page.evaluate((id) => window.__kyFace!.tap(id), `wire-${wireIndex}`);
  }
  // solved with one wrong answer -> 80 points -> B-
  await expect(page.getByRole('heading', { name: /Mission grade: B-/ })).toBeVisible({ timeout: 15_000 });
});

test('classic mode setting keeps missions in 2D', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ky-scene-mode', '2d'));
  await page.goto('/');
  await page.getByRole('button', { name: 'New Mission' }).click();
  await page.getByRole('button', { name: /Add Code Room, Rookie/ }).click();
  await page.getByRole('button', { name: 'Start Mission' }).click();
  await expect(page.locator('[data-testid="module-keypad-cipher"]')).toBeVisible();
  expect(await page.locator('canvas').count()).toBe(0);
});
