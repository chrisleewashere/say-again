import { expect, test } from '@playwright/test';
import { hashSeed } from '../src/engine/rng';
import { generateWireMaze, solveWireMaze } from '../src/modules/wireMaze/logic';

/**
 * Field Case (3D) smoke: scene mounts, the plate attaches, tap-to-zoom
 * enables interaction, and solving through the 3D face reaches the debrief.
 * Software GL in CI is slow, so generous waits.
 */
test('field case: open, zoom, solve through the plate, debrief', async ({ page }) => {
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

  // case-open ritual finishes, plate DOM attaches
  await page.waitForSelector('.faceplate-content', { timeout: 60_000 });
  await expect(page.locator('.scene-hint')).toBeVisible();
  await page.waitForTimeout(2500);

  // zoom via the accessible chrome button (keyboard/switch users share this path)
  await page.getByRole('button', { name: 'Open the lit panel' }).click();
  await expect(page.getByRole('button', { name: /Step back/ })).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(2000); // camera dolly

  for (const wireIndex of solution) {
    const wire = instance.state.wires[wireIndex];
    await page
      .locator('.faceplate-live')
      .getByRole('button', { name: new RegExp(`^Wire ${wireIndex + 1}: ${wire.color}, ${wire.pattern}, tag ${wire.label}`) })
      .click({ force: true });
  }

  await expect(page.getByRole('heading', { name: 'Mission accomplished!' })).toBeVisible({ timeout: 15_000 });
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
