import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Critical Flow: Register -> Upload -> Download', () => {
  const timestamp = Date.now();
  const testEmail = `testuser${timestamp}@example.com`;
  const testPassword = 'Password123!';

  test('User can register, login, upload payroll, and see history', async ({ page }) => {
    // Capture console logs
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

    // 1. Register
    await page.goto('/register');
    await page.getByLabel('Full Name').fill('Test User');
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Organization Name').fill('Test Organization');
    await page.getByLabel('Password').fill(testPassword);
    await page.getByRole('button', { name: 'Register' }).click();

    // Check for validation errors
    const errorMessages = await page.locator('.text-red-500').allTextContents();
    if (errorMessages.length > 0) {
        console.error("Validation errors found:", errorMessages);
    }

    // Check for error message if redirect doesn't happen immediately
    const errorAlert = page.locator('.bg-red-100');
    if (await errorAlert.isVisible()) {
        const errorText = await errorAlert.innerText();
        console.error(`Registration failed with error: ${errorText}`);
        throw new Error(`Registration failed: ${errorText}`);
    }

    // Wait for redirect to login page
    await expect(page).toHaveURL(/.*\/login/);

    // 2. Login
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password').fill(testPassword);
    await page.getByRole('button', { name: 'Sign In' }).click();

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