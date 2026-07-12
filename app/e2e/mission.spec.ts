import { expect, test, type Page } from '@playwright/test';
import { hashSeed } from '../src/engine/rng';
import { generateWireMaze, solveWireMaze } from '../src/modules/wireMaze/logic';

/**
 * Full mission flow: setup -> play -> solve wire maze (using the engine's own
 * solver to pick correct wires) -> debrief -> logbook shows the session.
 */

// These specs exercise the classic 2D shell; the Field Case has its own spec.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ky-scene-mode', '2d'));
});

async function readMissionCode(page: Page): Promise<string> {
  const text = await page.locator('.run-header .mission-code').textContent();
  expect(text).toMatch(/^[A-Z]{3}-\d{3}$/);
  return text!;
}

test('home screen renders with core actions', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /keep yapping/i })).toBeVisible();
  await expect(page.getByRole('button', { name: 'New Mission' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Logbook' })).toBeVisible();
});

test('full wire-maze mission: setup, solve, debrief, logbook', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'New Mission' }).click();

  // add Laser Grid Bypass at Rookie
  await page.getByRole('button', { name: /Add Laser Grid Bypass, Rookie/ }).click();
  await expect(page.getByText('This mission (1 puzzle')).toBeVisible();
  await page.getByRole('button', { name: 'Start Mission' }).click();

  // derive the solution exactly like the app does
  const code = await readMissionCode(page);
  const seed = hashSeed(`${code}:0:wire-maze:1`);
  const instance = generateWireMaze(seed, 1);
  const solution = solveWireMaze(instance.state);

  for (const wireIndex of solution) {
    const wire = instance.state.wires[wireIndex];
    await page
      .getByRole('button', { name: new RegExp(`^Wire ${wireIndex + 1}: ${wire.color}, ${wire.pattern}, tag ${wire.label}`) })
      .click();
  }

  await expect(page.getByRole('heading', { name: 'Mission accomplished!' })).toBeVisible();

  // session recorded
  await page.getByRole('button', { name: 'Home' }).click();
  await page.getByRole('button', { name: 'Logbook' }).click();
  await expect(page.getByText(code)).toBeVisible();
});

test('wrong cuts raise alarms and trip the soft-failure debrief', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'New Mission' }).click();
  await page.getByRole('button', { name: /Add Laser Grid Bypass, Rookie/ }).click();
  await page.getByRole('button', { name: 'Start Mission' }).click();

  const code = await readMissionCode(page);
  const seed = hashSeed(`${code}:0:wire-maze:1`);
  const instance = generateWireMaze(seed, 1);
  const solution = solveWireMaze(instance.state);
  const wrongIndex = instance.state.wires.findIndex((_, i) => !solution.includes(i));

  // default tolerance is 3 alarms
  for (let i = 0; i < 3; i++) {
    const wire = instance.state.wires[wrongIndex];
    await page
      .getByRole('button', { name: new RegExp(`^Wire ${wrongIndex + 1}: ${wire.color}, ${wire.pattern}, tag ${wire.label}`) })
      .click();
  }

  await expect(page.getByRole('heading', { name: /alarm tripped/i })).toBeVisible();
  // soft failure: same mission is replayable
  await expect(page.getByRole('button', { name: 'Replay same mission' })).toBeVisible();
});

test('replaying a mission code restores the mission and rebuilds identical puzzles', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'New Mission' }).click();
  await page.getByRole('button', { name: /Add Laser Grid Bypass, Mastermind/ }).click();
  await page.getByRole('button', { name: 'Start Mission' }).click();
  const code = await readMissionCode(page);
  const firstWire = await page.locator('.wire-row').first().getAttribute('aria-label');

  // end early (two-tap confirm) — the abandoned session is saved, enabling replay
  await page.getByRole('button', { name: 'End mission early' }).click();
  await page.getByRole('button', { name: /Tap again to end the mission/ }).click();
  await expect(page.getByRole('heading', { name: 'Mission paused' })).toBeVisible();
  await page.getByRole('button', { name: 'Home' }).click();

  // replay by code: module list + difficulty restore from the logbook
  await page.getByLabel('Replay a mission code').fill(code);
  await page.getByRole('button', { name: 'Load' }).click();
  await expect(page.getByText(`Restored the puzzle list from the last ${code} session.`)).toBeVisible();
  await expect(page.getByText('This mission (1 puzzle')).toBeVisible();
  await page.getByRole('button', { name: 'Start Mission' }).click();

  await expect(page.locator('.run-header .mission-code')).toHaveText(code);
  const replayWire = await page.locator('.wire-row').first().getAttribute('aria-label');
  expect(replayWire).toBe(firstWire);
});

test('ending a mission early saves the session to the logbook', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'New Mission' }).click();
  await page.getByRole('button', { name: /Add Code Room, Rookie/ }).click();
  await page.getByRole('button', { name: 'Start Mission' }).click();
  const code = await readMissionCode(page);

  await page.getByRole('button', { name: 'End mission early' }).click();
  await page.getByRole('button', { name: /Tap again to end the mission/ }).click();
  await expect(page.getByRole('heading', { name: 'Mission paused' })).toBeVisible();
  await page.getByRole('button', { name: 'Home' }).click();
  await page.getByRole('button', { name: 'Logbook' }).click();
  await expect(page.getByText(code)).toBeVisible();
  await expect(page.getByText('abandoned')).toBeVisible();
});

test('accessibility settings toggle html classes and persist', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('switch', { name: 'Large text' }).click();
  await page.getByRole('switch', { name: 'High contrast' }).click();
  await expect(page.locator('html')).toHaveClass(/a11y-large-text/);
  await expect(page.locator('html')).toHaveClass(/a11y-high-contrast/);
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/a11y-large-text/);
});
