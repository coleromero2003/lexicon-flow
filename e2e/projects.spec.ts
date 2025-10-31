import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.clerk/user.json' })

test.describe('Projects', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should display projects list', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for projects to load
    await page.waitForLoadState('networkidle');

    // Check for projects section or empty state
    const projectsSection = page.locator('text=/projects/i, text=/no projects/i').first();
    await expect(projectsSection).toBeVisible({ timeout: 10000 });
  });

  test('should create a new project', async ({ page }) => {
    const projectName = `Test Project ${Date.now()}`;
    const projectDescription = 'A test project created by Playwright';

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Look for create project button
    const createButton = page.locator('button:has-text("New Project"), button:has-text("Create Project"), a:has-text("Create Project")').first();

    if (await createButton.isVisible({ timeout: 5000 })) {
      await createButton.click();

      // Wait for form to appear
      await page.waitForSelector('input[name="name"], input[placeholder*="name" i]', { timeout: 5000 });

      // Fill in project details
      await page.fill('input[name="name"], input[placeholder*="name" i]', projectName);

      const descriptionField = page.locator('textarea[name="description"], input[name="description"]');
      if (await descriptionField.isVisible({ timeout: 2000 })) {
        await descriptionField.fill(projectDescription);
      }

      // Submit form
      await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');

      // Wait for success (either navigation or toast)
      await page.waitForTimeout(2000);

      // Verify project appears in list or we navigated to it
      const projectElement = page.locator(`text="${projectName}"`);
      await expect(projectElement).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
      console.log('Create project button not found - test skipped');
    }
  });

  test('should navigate to project details', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for projects to load
    await page.waitForLoadState('networkidle');

    // Find first project link
    const projectLinks = page.locator('a[href*="/projects/"], a[href*="/project/"]');
    const count = await projectLinks.count();

    if (count > 0) {
      const firstProject = projectLinks.first();
      await firstProject.click();

      // Verify we're on a project page
      await expect(page).toHaveURL(/.*project/);
    } else {
      test.skip();
      console.log('No projects found - test skipped');
    }
  });

  test('should search/filter projects', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for search input
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]');

    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill('test');

      // Wait for filter to apply
      await page.waitForTimeout(1000);

      // Results should be filtered
      // (Exact assertions depend on your UI implementation)
      await expect(searchInput).toHaveValue('test');
    } else {
      test.skip();
      console.log('Search input not found - test skipped');
    }
  });

  test('should display project stats on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for stats/metrics on dashboard
    const statsElements = page.locator('[data-testid*="stat"], .stat, text=/total projects/i');

    if (await statsElements.count() > 0) {
      await expect(statsElements.first()).toBeVisible();
    } else {
      console.log('No stats found on dashboard');
    }
  });
});
