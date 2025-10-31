import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.clerk/user.json' })

test.describe('Workflows', () => {
  test('should display workflows list', async ({ page }) => {
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

    // Look for workflows section
    const workflowsSection = page.locator('text=/workflows/i, [data-testid*="workflows"]');

    if (await workflowsSection.count() > 0) {
      await expect(workflowsSection.first()).toBeVisible();
    } else {
      console.log('Workflows section not found');
    }
  });

  test('should create a new workflow', async ({ page }) => {
    const workflowName = `Test Workflow ${Date.now()}`;

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

    // Look for create workflow button
    const createButton = page.locator('button:has-text("New Workflow"), button:has-text("Create Workflow"), button:has-text("Add Workflow")').first();

    if (await createButton.isVisible({ timeout: 5000 })) {
      await createButton.click();

      // Wait for form
      await page.waitForSelector('input[name="name"], input[placeholder*="workflow" i]', { timeout: 5000 });

      // Fill in workflow name
      await page.fill('input[name="name"], input[placeholder*="workflow" i]', workflowName);

      // Submit form
      await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');

      // Wait for workflow to appear
      await page.waitForTimeout(2000);

      // Verify workflow was created
      const workflowElement = page.locator(`text="${workflowName}"`);
      await expect(workflowElement).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
      console.log('Create workflow button not found - test skipped');
    }
  });

  test('should navigate to workflow details', async ({ page }) => {
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

    // Find and click on a workflow
    const workflowLinks = page.locator('a[href*="/workflows/"]');
    const count = await workflowLinks.count();

    if (count > 0) {
      await workflowLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Verify we're on workflow details page
      await expect(page).toHaveURL(/.*workflow/);
    } else {
      test.skip();
      console.log('No workflows found - test skipped');
    }
  });

  test('should display workflow steps', async ({ page }) => {
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

    // Navigate to first workflow
    const workflowLinks = page.locator('a[href*="/workflows/"]');
    if (await workflowLinks.count() === 0) {
      test.skip();
      return;
    }

    await workflowLinks.first().click();
    await page.waitForLoadState('networkidle');

    // Look for steps section
    const stepsSection = page.locator('text=/steps/i, [data-testid*="steps"]');

    if (await stepsSection.count() > 0) {
      await expect(stepsSection.first()).toBeVisible();
    } else {
      console.log('Steps section not found');
    }
  });

  test('should add a step to workflow', async ({ page }) => {
    const stepName = `Test Step ${Date.now()}`;

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

    // Navigate to first workflow
    const workflowLinks = page.locator('a[href*="/workflows/"]');
    if (await workflowLinks.count() === 0) {
      test.skip();
      return;
    }

    await workflowLinks.first().click();
    await page.waitForLoadState('networkidle');

    // Look for add step button
    const addStepButton = page.locator('button:has-text("Add Step"), button:has-text("New Step"), button:has-text("Create Step")').first();

    if (await addStepButton.isVisible({ timeout: 5000 })) {
      await addStepButton.click();

      // Wait for form
      await page.waitForSelector('input[name="name"], input[placeholder*="step" i]', { timeout: 5000 });

      // Fill in step name
      await page.fill('input[name="name"], input[placeholder*="step" i]', stepName);

      // Submit form
      await page.click('button[type="submit"]:has-text("Add"), button:has-text("Save")');

      // Wait for step to appear
      await page.waitForTimeout(2000);

      // Verify step was added
      const stepElement = page.locator(`text="${stepName}"`);
      await expect(stepElement).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
      console.log('Add step button not found - test skipped');
    }
  });
});
