// tests/example.spec.ts
import { test, expect } from '@playwright/test';

test('open example.com in Chromium', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page).toHaveTitle(/Example Domain/);
});
