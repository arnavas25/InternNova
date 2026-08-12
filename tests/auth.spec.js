import { test, expect } from '@playwright/test';

// Constants from the user's provided test data
const LIVE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';
const STAFF_ID = process.env.TEST_STAFF_ID;
const STAFF_PASS = process.env.TEST_STAFF_PASS;
const STUDENT_EMAIL = process.env.TEST_STUDENT_EMAIL;
const STUDENT_PASS = process.env.TEST_STUDENT_PASS;

const TEST_READY = Boolean(
  process.env.TEST_STAFF_ID &&
  process.env.TEST_STAFF_PASS &&
  process.env.TEST_STUDENT_EMAIL &&
  process.env.TEST_STUDENT_PASS
);

test.describe('Authentication Flows', () => {
  test.skip(!TEST_READY, 'Set dedicated test credentials in the environment before running E2E tests.');
  test('Staff Login -> Dashboard', async ({ page }) => {
    // Navigate to staff login
    await page.goto(`${LIVE_URL}/staff-login`);
    
    // Fill out the form
    await page.getByPlaceholder('INAD260001').fill(STAFF_ID);
    await page.getByPlaceholder('Password').fill(STAFF_PASS);
    
    // Click login
    await page.click('button[type="submit"]');
    
    // Verify redirect to admin dashboard
    await expect(page).toHaveURL(`${LIVE_URL}/admin`, { timeout: 10000 });
    
    // Verify dashboard loaded
    await expect(page.locator('h2').filter({ hasText: 'Welcome Back' })).toBeVisible();
    
    // Test Logout
    page.once('dialog', dialog => dialog.accept());
    await page.click('text=Logout');
    await expect(page).toHaveURL(`${LIVE_URL}/staff-login`, { timeout: 5000 });
  });

  test('Student Login -> Dashboard', async ({ page }) => {
    // Navigate to student login
    await page.goto(`${LIVE_URL}/login`);
    
    // Fill out the form
    await page.fill('input[type="email"]', STUDENT_EMAIL);
    await page.fill('input[type="password"]', STUDENT_PASS);
    
    // Click login
    await page.click('button[type="submit"]');
    
    // Verify redirect to student dashboard
    await expect(page).toHaveURL(`${LIVE_URL}/dashboard`, { timeout: 10000 });
    
    // Verify dashboard loaded
    await expect(page.locator('text=Leaderboard')).toBeVisible();
    
    // Test Logout
    page.once('dialog', dialog => dialog.accept());
    await page.click('text=Logout');
    await expect(page).toHaveURL(`${LIVE_URL}/login`, { timeout: 5000 });
  });
});
