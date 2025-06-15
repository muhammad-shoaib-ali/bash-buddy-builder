const { test, expect } = require('@playwright/test');

test('App loads and shows heading', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Check the title of the page
  await expect(page).toHaveTitle(/Vite React/);

  // Example: Check for text or component
  await expect(page.getByRole('heading')).toBeVisible();
});
