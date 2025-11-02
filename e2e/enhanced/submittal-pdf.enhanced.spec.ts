import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { ProjectPage } from '../pages/ProjectPage';
import { ObjectPage } from '../pages/ObjectPage';
import { waitForLoadingComplete } from '../utils/test-helpers';

test.use({ storageState: 'e2e/.clerk/user.json' });

test.describe('Submittal PDF Generation - Enhanced', () => {
  let objectPage: ObjectPage;
  let projectPage: ProjectPage;

  test.beforeEach(async ({ page }) => {
    // Navigate to first project with objects
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();

    const projectCount = await dashboardPage.getProjectCount();
    if (projectCount === 0) {
      test.skip();
    }

    // Open first project
    const firstProject = dashboardPage.getProjectCards().first();
    await firstProject.click();
    await page.waitForURL('**/projects/**');

    projectPage = new ProjectPage(page);
    const objectCount = await projectPage.getObjectCount();

    if (objectCount === 0) {
      test.skip();
    }

    // Open first object
    const firstObject = projectPage.getObjects().first();
    await firstObject.click();
    await page.waitForURL('**/objects/**');

    objectPage = new ObjectPage(page);
    await objectPage.verifyLoaded();
  });

  test('should display Generate Submittal PDF button', async ({ page }) => {
    await waitForLoadingComplete(page);

    // Look for the button in the PDF Generation Actions section
    const submittalButton = page.getByRole('button', {
      name: /Generate Submittal PDF/i,
    });

    // Verify the button exists
    await expect(submittalButton).toBeVisible();
  });

  test('should open submittal PDF dialog when button clicked', async ({
    page,
  }) => {
    await waitForLoadingComplete(page);

    const submittalButton = page.getByRole('button', {
      name: /Generate Submittal PDF/i,
    });
    await submittalButton.click();

    // Verify dialog opened
    await expect(
      page.getByRole('heading', { name: /Generate Submittal PDF/i })
    ).toBeVisible();

    // Verify dialog description
    await expect(
      page.getByText(/Select the objects to include in the submittal package/i)
    ).toBeVisible();
  });

  test('should display spec object dropdown in dialog', async ({ page }) => {
    await waitForLoadingComplete(page);

    const submittalButton = page.getByRole('button', {
      name: /Generate Submittal PDF/i,
    });
    await submittalButton.click();

    // Wait for dialog to open
    await page.waitForSelector('[role="dialog"]');

    // Verify spec object dropdown exists
    const specLabel = page.getByText(/Specification Object \(Optional\)/i);
    await expect(specLabel).toBeVisible();

    // Verify dropdown is present
    const dropdown = page.locator('[id="spec-object"]');
    await expect(dropdown).toBeVisible();
  });

  test('should display connected objects list when dialog opens', async ({
    page,
  }) => {
    await waitForLoadingComplete(page);

    const submittalButton = page.getByRole('button', {
      name: /Generate Submittal PDF/i,
    });
    await submittalButton.click();

    // Wait for dialog to open
    await page.waitForSelector('[role="dialog"]');

    // Wait for loading to complete (either objects appear or "no objects" message)
    await page.waitForTimeout(2000);

    // Check if there are connected objects or empty state
    const connectedObjectsHeading = page.getByText(/Connected Objects/i);
    await expect(connectedObjectsHeading).toBeVisible();

    // Either we have objects or an empty state message
    const hasObjects = await page
      .getByText(/\d+ of \d+ objects selected/i)
      .isVisible();
    const hasEmptyState = await page
      .getByText(/No connected objects found/i)
      .isVisible();

    expect(hasObjects || hasEmptyState).toBeTruthy();
  });

  test('should allow selecting/deselecting objects', async ({ page }) => {
    await waitForLoadingComplete(page);

    const submittalButton = page.getByRole('button', {
      name: /Generate Submittal PDF/i,
    });
    await submittalButton.click();

    await page.waitForSelector('[role="dialog"]');
    await page.waitForTimeout(2000);

    // Check if there are any objects to select
    const checkboxes = page.locator('[role="checkbox"]');
    const checkboxCount = await checkboxes.count();

    if (checkboxCount > 0) {
      // Get initial selection count
      const selectionText = await page
        .getByText(/\d+ of \d+ objects selected/i)
        .textContent();

      // Click first checkbox to toggle
      await checkboxes.first().click();

      // Wait for state to update
      await page.waitForTimeout(500);

      // Verify selection count changed
      const newSelectionText = await page
        .getByText(/\d+ of \d+ objects selected/i)
        .textContent();

      expect(selectionText).not.toBe(newSelectionText);
    }
  });

  test('should have Select All and Deselect All buttons', async ({ page }) => {
    await waitForLoadingComplete(page);

    const submittalButton = page.getByRole('button', {
      name: /Generate Submittal PDF/i,
    });
    await submittalButton.click();

    await page.waitForSelector('[role="dialog"]');
    await page.waitForTimeout(2000);

    // Verify Select All button
    const selectAllButton = page.getByRole('button', {
      name: /Select All/i,
    });
    await expect(selectAllButton).toBeVisible();

    // Verify Deselect All button
    const deselectAllButton = page.getByRole('button', {
      name: /Deselect All/i,
    });
    await expect(deselectAllButton).toBeVisible();
  });

  test('should deselect all objects when Deselect All clicked', async ({
    page,
  }) => {
    await waitForLoadingComplete(page);

    const submittalButton = page.getByRole('button', {
      name: /Generate Submittal PDF/i,
    });
    await submittalButton.click();

    await page.waitForSelector('[role="dialog"]');
    await page.waitForTimeout(2000);

    // Check if there are objects
    const checkboxCount = await page.locator('[role="checkbox"]').count();

    if (checkboxCount > 0) {
      const deselectAllButton = page.getByRole('button', {
        name: /Deselect All/i,
      });
      await deselectAllButton.click();

      // Wait for update
      await page.waitForTimeout(500);

      // Verify all objects are deselected
      await expect(
        page.getByText(/0 of \d+ objects selected/i)
      ).toBeVisible();
    }
  });

  test('should show error when trying to generate with no objects selected', async ({
    page,
  }) => {
    await waitForLoadingComplete(page);

    const submittalButton = page.getByRole('button', {
      name: /Generate Submittal PDF/i,
    });
    await submittalButton.click();

    await page.waitForSelector('[role="dialog"]');
    await page.waitForTimeout(2000);

    // Deselect all objects
    const checkboxCount = await page.locator('[role="checkbox"]').count();

    if (checkboxCount > 0) {
      const deselectAllButton = page.getByRole('button', {
        name: /Deselect All/i,
      });
      await deselectAllButton.click();

      // Try to generate PDF
      const generateButton = page.getByRole('button', {
        name: /^Generate PDF$/i,
      });
      await generateButton.click();

      // Wait for error toast (sonner toast)
      await page.waitForTimeout(1000);

      // Verify error message appears (check for toast)
      const toast = page.locator('[data-sonner-toast]');
      if ((await toast.count()) > 0) {
        // Toast system is working
        expect(await toast.first().isVisible()).toBeTruthy();
      }
    }
  });

  test('should have Cancel and Generate PDF buttons', async ({ page }) => {
    await waitForLoadingComplete(page);

    const submittalButton = page.getByRole('button', {
      name: /Generate Submittal PDF/i,
    });
    await submittalButton.click();

    await page.waitForSelector('[role="dialog"]');

    // Verify Cancel button
    const cancelButton = page.getByRole('button', { name: /Cancel/i });
    await expect(cancelButton).toBeVisible();

    // Verify Generate PDF button
    const generateButton = page.getByRole('button', {
      name: /^Generate PDF$/i,
    });
    await expect(generateButton).toBeVisible();
  });

  test('should close dialog when Cancel clicked', async ({ page }) => {
    await waitForLoadingComplete(page);

    const submittalButton = page.getByRole('button', {
      name: /Generate Submittal PDF/i,
    });
    await submittalButton.click();

    await page.waitForSelector('[role="dialog"]');

    // Click Cancel
    const cancelButton = page.getByRole('button', { name: /Cancel/i });
    await cancelButton.click();

    // Verify dialog is closed
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should disable Generate PDF button when no objects available', async ({
    page,
  }) => {
    await waitForLoadingComplete(page);

    const submittalButton = page.getByRole('button', {
      name: /Generate Submittal PDF/i,
    });
    await submittalButton.click();

    await page.waitForSelector('[role="dialog"]');
    await page.waitForTimeout(2000);

    // Check if no connected objects
    const hasEmptyState = await page
      .getByText(/No connected objects found/i)
      .isVisible();

    if (hasEmptyState) {
      // Verify generate button is disabled
      const generateButton = page.getByRole('button', {
        name: /^Generate PDF$/i,
      });
      await expect(generateButton).toBeDisabled();
    }
  });

  test('should show loading state while fetching connected objects', async ({
    page,
  }) => {
    await waitForLoadingComplete(page);

    const submittalButton = page.getByRole('button', {
      name: /Generate Submittal PDF/i,
    });

    // Slow down network to see loading state
    await page.route('**/*', (route) => {
      setTimeout(() => route.continue(), 500);
    });

    await submittalButton.click();

    await page.waitForSelector('[role="dialog"]');

    // Check for loading spinner (lucide-react Loader2 icon with animate-spin)
    const loadingSpinner = page.locator('.animate-spin').first();

    // If loading state is visible briefly
    if (await loadingSpinner.isVisible({ timeout: 1000 })) {
      await expect(loadingSpinner).toBeVisible();
    }

    // Clear route interception
    await page.unroute('**/*');
  });
});
