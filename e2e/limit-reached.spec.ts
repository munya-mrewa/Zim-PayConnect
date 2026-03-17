import { test, expect } from '@playwright/test';
import path from 'path';
import { db } from '../lib/db';

test.describe('Upload limits: no subscription and no credits', () => {
  const timestamp = Date.now();
  const testEmail = `limituser${timestamp}@example.com`;
  const testPassword = 'Password123!';

  test('shows Limit Reached card when org has no access', async ({ page }) => {
    // 1. Register a fresh organization + owner
    await page.goto('/register');
    await page.getByLabel('Full Name').fill('Limit User');
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Organization Name').fill('Limit Org');
    await page.getByLabel('Password').fill(testPassword);
    await page.getByRole('button', { name: 'Register' }).click();

    // Wait for redirect to login
    await expect(page).toHaveURL(/.*\/login/);

    // 2. Expire trial and clear credits in DB for this org
    const user = await db.user.findUnique({
      where: { email: testEmail },
      include: { organization: true },
    });

    if (!user || !user.organization) {
      throw new Error('Test setup failed: user or organization not found');
    }

    await db.organization.update({
      where: { id: user.organization.id },
      data: {
        subscriptionStatus: 'TRIAL',
        trialEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
        subscriptionEndsAt: null,
        credits: 0,
      },
    });

    // 3. Login
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password').fill(testPassword);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should reach dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 4. Go to upload and attempt processing
    await page.goto('/upload');
    await expect(page).toHaveURL(/.*\/upload/);

    const filePath = path.join(__dirname, 'sample-payroll.csv');
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
    await fileInput.setInputFiles(filePath);

    const processBtn = page.getByRole('button', { name: /Process Payroll/i });
    await expect(processBtn).toBeEnabled();
    await processBtn.click();

    // 5. Expect the "Limit Reached" card to appear
    await expect(
      page.getByRole('heading', { name: /Limit Reached/i }),
    ).toBeVisible({ timeout: 15000 });
  });
});

