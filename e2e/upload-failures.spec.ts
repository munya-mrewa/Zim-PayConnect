import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Upload Failure & Mapping Flows', () => {
  const timestamp = Date.now();
  const testEmail = `uploadfail${timestamp}@example.com`;
  const testPassword = 'Password123!';

  test.beforeEach(async ({ page }) => {
    // 1. Register a fresh organization + owner
    await page.goto('/register');
    await page.getByLabel('Full Name').fill('Upload Fail User');
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Organization Name').fill('Upload Fail Org');
    await page.getByLabel('Password').fill(testPassword);
    await page.getByRole('button', { name: 'Register' }).click();

    // Wait for redirect to login
    await expect(page).toHaveURL(/.*\/login/);

    // 2. Login
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password').fill(testPassword);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should reach dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('shows mapping UI when headers are unmapped', async ({ page }) => {
    await page.goto('/upload');
    await expect(page).toHaveURL(/.*\/upload/);

    const filePath = path.join(__dirname, 'unmapped-payroll.csv');
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
    await fileInput.setInputFiles(filePath);

    const processBtn = page.getByRole('button', { name: /Process|Upload/i });
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

    const processBtn = page.getByRole('button', { name: /Process|Upload/i });
    await expect(processBtn).toBeEnabled();
    await processBtn.click();

    // Expect the "Processing Failed" card to appear
    const failureHeading = page.getByRole('heading', {
      name: /Processing Failed/i,
    });
    await expect(failureHeading).toBeVisible({ timeout: 15000 });
  });
});
