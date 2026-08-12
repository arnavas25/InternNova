import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LIVE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';
const STAFF_ID = process.env.TEST_STAFF_ID;
const STAFF_PASS = process.env.TEST_STAFF_PASS;

const TEST_READY = Boolean(
  process.env.TEST_STAFF_ID &&
  process.env.TEST_STAFF_PASS &&
  process.env.TEST_STUDENT_EMAIL &&
  process.env.TEST_STUDENT_PASS
);

test.describe('Admin Features', () => {
  test.skip(!TEST_READY, 'Set dedicated test credentials in the environment before running E2E tests.');
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${LIVE_URL}/staff-login`);
    await page.getByPlaceholder('INAD260001').fill(STAFF_ID);
    await page.getByPlaceholder('Password').fill(STAFF_PASS);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${LIVE_URL}/admin`, { timeout: 10000 });
  });

  test('Single Student Upload & Deletion', async ({ page }) => {
    // Navigate to Students tab
    await page.click('text=Students');
    
    // Open Add Student Modal
    await page.click('button:has-text("Add Student")');
    await expect(page.locator('h2:has-text("Add Student")')).toBeVisible();

    // Fill form
    const uniqueName = `Test Student ${Date.now()}`;
    const uniqueEmail = `test${Date.now()}@internnova.co.in`;
    await page.fill('input[placeholder="Jane Doe"]', uniqueName);
    await page.fill('input[placeholder="student@email.com"]', uniqueEmail);
    await page.selectOption('select', { label: 'Web Development' });
    await page.fill('input[placeholder="e.g. August Cohort"]', 'Test Cohort');
    
    // Fill optional fields
    const dateInputs = page.locator('input[type="date"]');
    await dateInputs.nth(0).fill('2026-07-01'); // Start date
    await dateInputs.nth(1).fill('2026-08-01'); // End date
    await page.fill('input[type="url"]', 'https://example.com/offer'); // Offer letter link

    // Submit
    await page.click('button:has-text("Create Account")');
    
    // Wait a bit
    await page.waitForTimeout(3000);
  });

  test('Bulk Upload Students (CSV)', async ({ page }) => {
    await page.click('text=Students');
    
    // Open Bulk Upload Modal
    await page.click('button:has-text("Bulk Upload")');
    await expect(page.locator('h2:has-text("Bulk Upload")')).toBeVisible();

    // Create a temporary CSV file
    const csvPath = path.join(__dirname, 'test-bulk.csv');
    const uniqueEmail1 = `bulk1_${Date.now()}@internnova.co.in`;
    
    fs.writeFileSync(csvPath, `name,email,domain,batch,start_date,end_date,offer_letter_link\nTest Bulk 1,${uniqueEmail1},Data Analytics,Test Batch,2026-08-01,2026-09-01,https://link.com`);

    // Upload file
    await page.setInputFiles('input[type="file"]', csvPath);
    
    // Submit the modal form
    await page.click('button:has-text("Import")');

    // Wait a bit
    await page.waitForTimeout(3000);

    // Clean up local CSV
    if (fs.existsSync(csvPath)) {
      fs.unlinkSync(csvPath);
    }
  });
});
