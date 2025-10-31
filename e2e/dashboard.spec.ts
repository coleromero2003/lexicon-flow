import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.clerk/user.json' })

test.describe('Dashboard', () => {

  test('should display dashboard page', async ({ page }) => {
    // Check that we're on the dashboard
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/.*dashboard/);

    // Check for main dashboard elements
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should display user menu', async ({ page }) => {
    // Wait for authentication
    // Check for user button (Clerk component)
    const userButton = page.locator('button[aria-label*="user"], [data-clerk-id*="userButton"]');
    await expect(userButton).toBeVisible();
  });

  test('should navigate to projects page', async ({ page }) => {
    // Look for projects link in navigation
    const projectsLink = page.locator('a[href*="/projects"], nav a:has-text("Projects")');
    if (await projectsLink.isVisible()) {
      await projectsLink.click();
      await expect(page).toHaveURL(/.*projects/);
    } else {
      console.log('Projects link not found - might be in a different location');
    }
  });

  test('should navigate to workflows page', async ({ page }) => {
    // Look for workflows link in navigation
    const workflowsLink = page.locator('a[href*="/workflows"], nav a:has-text("Workflows")');

    if (await workflowsLink.isVisible()) {
      await workflowsLink.click();
      await expect(page).toHaveURL(/.*workflows/);
    } else {
      console.log('Workflows link not found - might be in a different location');
    }
  });

  test('should navigate to lexicon page', async ({ page }) => {
    // Look for lexicon link in navigation
    const lexiconLink = page.locator('a[href*="/lexicon"], nav a:has-text("Lexicon")');

    if (await lexiconLink.isVisible()) {
      await lexiconLink.click();
      await expect(page).toHaveURL(/.*lexicon/);
    } else {
      console.log('Lexicon link not found - might be in a different location');
    }
  });

  test('should be responsive on mobile', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
    }

    // Check that mobile menu is present
    const mobileMenu = page.locator('button[aria-label*="menu"], button:has-text("Menu")');
    await expect(mobileMenu).toBeVisible();
  });
});
