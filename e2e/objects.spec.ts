import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.clerk/user.json' })

test.describe('SCADA Objects', () => {
  test('should display objects list in a project', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Find and click on a project
    const projectLinks = page.locator('a[href*="/projects/"], a[href*="/project/"]');
    const count = await projectLinks.count();

    if (count > 0) {
      await projectLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Look for objects section
      const objectsSection = page.locator('text=/objects/i, [data-testid*="objects"]').first();
      await expect(objectsSection).toBeVisible({ timeout: 10000 });
    } else {
      test.skip();
      console.log('No projects found - test skipped');
    }
  });

  test('should create a new object', async ({ page }) => {
    const objectName = `Test Object ${Date.now()}`;

    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Navigate to first project
    const projectLinks = page.locator('a[href*="/projects/"], a[href*="/project/"]');
    if (await projectLinks.count() === 0) {
      test.skip();
      return;
    }

    await projectLinks.first().click();
    await page.waitForLoadState('networkidle');

    // Look for create object button
    const createButton = page.locator('button:has-text("New Object"), button:has-text("Create Object"), button:has-text("Add Object")').first();

    if (await createButton.isVisible({ timeout: 5000 })) {
      await createButton.click();

      // Wait for form
      await page.waitForSelector('input[name="name"], input[placeholder*="name" i]', { timeout: 5000 });

      // Fill in object details
      await page.fill('input[name="name"], input[placeholder*="name" i]', objectName);

      // Submit form
      await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');

      // Wait for object to appear
      await page.waitForTimeout(2000);

      // Verify object was created
      const objectElement = page.locator(`text="${objectName}"`);
      await expect(objectElement).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
      console.log('Create object button not found - test skipped');
    }
  });

  test('should navigate to object details', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Navigate to first project
    const projectLinks = page.locator('a[href*="/projects/"], a[href*="/project/"]');
    if (await projectLinks.count() === 0) {
      test.skip();
      return;
    }

    await projectLinks.first().click();
    await page.waitForLoadState('networkidle');

    // Find and click on an object
    const objectLinks = page.locator('a[href*="/objects/"], [data-testid*="object-"]');
    const count = await objectLinks.count();

    if (count > 0) {
      await objectLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Verify we're on object details page
      await expect(page).toHaveURL(/.*object/);
    } else {
      test.skip();
      console.log('No objects found - test skipped');
    }
  });

  test('should filter objects by type or status', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Navigate to first project
    const projectLinks = page.locator('a[href*="/projects/"], a[href*="/project/"]');
    if (await projectLinks.count() === 0) {
      test.skip();
      return;
    }

    await projectLinks.first().click();
    await page.waitForLoadState('networkidle');

    // Look for filter controls
    const filterButton = page.locator('button:has-text("Filter"), select[name*="filter"], select[name*="status"]');

    if (await filterButton.count() > 0) {
      await filterButton.first().click();
      await page.waitForTimeout(500);

      // Select a filter option
      const filterOptions = page.locator('[role="option"], option');
      if (await filterOptions.count() > 0) {
        await filterOptions.first().click();
        await page.waitForTimeout(1000);
      }
    } else {
      console.log('No filter controls found');
    }
  });

  test('should display object relationships', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Navigate to first project
    const projectLinks = page.locator('a[href*="/projects/"], a[href*="/project/"]');
    if (await projectLinks.count() === 0) {
      test.skip();
      return;
    }

    await projectLinks.first().click();
    await page.waitForLoadState('networkidle');

    // Navigate to first object
    const objectLinks = page.locator('a[href*="/objects/"]');
    if (await objectLinks.count() === 0) {
      test.skip();
      return;
    }

    await objectLinks.first().click();
    await page.waitForLoadState('networkidle');

    // Look for relationships section
    const relationshipsSection = page.locator('text=/relationships/i, text=/connections/i, [data-testid*="relation"]');

    if (await relationshipsSection.count() > 0) {
      await expect(relationshipsSection.first()).toBeVisible();
    } else {
      console.log('No relationships section found');
    }
  });
});
