import { test, expect } from '@playwright/test';

const LIVE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';
const STUDENT_EMAIL = process.env.TEST_STUDENT_EMAIL;
const STUDENT_PASS = process.env.TEST_STUDENT_PASS;

const TEST_READY = Boolean(
  process.env.TEST_STAFF_ID &&
  process.env.TEST_STAFF_PASS &&
  process.env.TEST_STUDENT_EMAIL &&
  process.env.TEST_STUDENT_PASS
);

test.describe('Student Dashboard Features', () => {
  test.skip(!TEST_READY, 'Set dedicated test credentials in the environment before running E2E tests.');
  test.beforeEach(async ({ page }) => {
    await page.goto(`${LIVE_URL}/login`);
    await page.fill('input[type="email"]', STUDENT_EMAIL);
    await page.fill('input[type="password"]', STUDENT_PASS);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${LIVE_URL}/dashboard`, { timeout: 10000 });
  });

  test('View Tasks and Resources', async ({ page }) => {
    // Check Today tab (default)
    await expect(page.locator('text=Today ·')).toBeVisible();

    // Navigate to Tasks tab
    await page.click('button:has-text("Tasks")');
    await expect(page.locator('h3').filter({ hasText: 'Tasks' })).toBeVisible();
    
    // Navigate to Resources tab
    await page.click('button:has-text("Resources")');
    await expect(page.locator('h3').filter({ hasText: 'Resources' })).toBeVisible();
    
    // Navigate to Profile tab
    await page.click('.db-profile-chip');
    await expect(page.locator('h2').filter({ hasText: 'Your Profile' }).or(page.locator('h2').filter({ hasText: STUDENT_EMAIL }))).toBeVisible();
  });
});
