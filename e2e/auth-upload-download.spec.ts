import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Critical Flow: Register -> Upload -> Download', () => {
  const timestamp = Date.now();
  const testEmail = `testuser${timestamp}@example.com`;
  const testPassword = 'Password123!';

  test('User can register, login, upload payroll, and see history', async ({ page }) => {
    // 1. Register
    await page.goto('/register');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="orgName"]', 'Test Organization');
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for redirect to login page
    await expect(page).toHaveURL(/.*\/login/);

    // 2. Login
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 3. Navigate to Upload Page
    await page.goto('/upload');
    await expect(page).toHaveURL(/.*\/upload/);

    // Upload file
    const filePath = path.join(__dirname, 'sample-payroll.csv');
    // Ensure the file input is present before setting files
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
    await fileInput.setInputFiles(filePath);
    
    // Check if mapping is needed or direct processing happens
    // Assuming there is a "Process Payroll" button
    const processBtn = page.getByRole('button', { name: /Process|Upload/i });
    await expect(processBtn).toBeEnabled();
    await processBtn.click();

    // 4. Verification
    // Expect success message or redirection to history/dashboard
    // Assuming redirection to history or a download button appears
    
    // We will look for text indicating successful processing
    // or wait for the 'Download' or 'ZIP' button.
    const downloadBtn = page.getByRole('button', { name: /Download|ZIP/i }).first();
    await downloadBtn.waitFor({ state: 'visible', timeout: 15000 });
    await expect(downloadBtn).toBeVisible();
    
    // Click the download button and wait for the download event
    const downloadPromise = page.waitForEvent('download');
    await downloadBtn.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBeTruthy();
  });
});