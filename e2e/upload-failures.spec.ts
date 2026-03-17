import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Upload Failure & Mapping Flows', () => {
  test('shows mapping UI when headers are unmapped', async ({ page }) => {
    // Assume a fresh user exists from previous tests or use login helper
    // For simplicity, reuse the critical flow assumptions: user is already logged in.
    await page.goto('/login');

    // If already authenticated, middleware should redirect to /dashboard.
    // If not, this test will need credentials; keep it defensive.
    if ((await page.url()).includes('/login')) {
      // Skip if credentials are unknown in this context
      test.skip(true, 'Login credentials not available in this test context');
    }

    await page.goto('/upload');
    await expect(page).toHaveURL(/.*\/upload/);

    const filePath = path.join(__dirname, 'unmapped-payroll.csv');
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
    await fileInput.setInputFiles(filePath);

    const processBtn = page.getByRole('button', { name: /Process Payroll/i });
    await expect(processBtn).toBeEnabled();
    await processBtn.click();

    // Expect the "Map Columns" card to appear due to MAPPING_REQUIRED
    await expect(
      page.getByRole('heading', { name: /Map Columns/i }),
    ).toBeVisible({ timeout: 15000 });
  });

  test('shows error card for invalid CSV upload', async ({ page }) => {
    await page.goto('/upload');
    await expect(page).toHaveURL(/.*\/upload/);

    const filePath = path.join(__dirname, 'invalid-payroll.csv');
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
    await fileInput.setInputFiles(filePath);

    const processBtn = page.getByRole('button', { name: /Process Payroll/i });
    await expect(processBtn).toBeEnabled();
    await processBtn.click();

    // Expect the "Processing Failed" card to appear
    const failureHeading = page.getByRole('heading', {
      name: /Processing Failed/i,
    });
    await expect(failureHeading).toBeVisible({ timeout: 15000 });
  });
});

