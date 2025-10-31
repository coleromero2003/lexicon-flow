import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { waitForLoadingComplete } from '../utils/test-helpers';
import { TestStep } from '../utils/test-data';

/**
 * Page Object Model for Workflow Details
 */
export class WorkflowPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to a specific workflow
   */
  async goto(workflowId: string) {
    await super.goto(`/workflows/${workflowId}`);
    await waitForLoadingComplete(this.page);
  }

  /**
   * Get the workflow name heading
   */
  getWorkflowName(): Locator {
    return this.page.locator('h1, [data-testid="workflow-name"]').first();
  }

  /**
   * Get the add step button
   */
  getAddStepButton(): Locator {
    return this.page.locator(
      'button:has-text("Add Step"), button:has-text("New Step"), button:has-text("Create Step")'
    ).first();
  }

  /**
   * Get all step items
   */
  getSteps(): Locator {
    return this.page.locator('[data-testid="step-item"], [data-testid*="step-"]');
  }

  /**
   * Get a specific step by name
   */
  getStepByName(name: string): Locator {
    return this.page.locator(`[data-testid="step-item"]:has-text("${name}")`);
  }

  /**
   * Add a new step
   */
  async addStep(step: TestStep) {
    await this.getAddStepButton().click();

    // Wait for form
    await this.page.waitForSelector('input[name="name"], input[placeholder*="step" i]', {
      state: 'visible',
      timeout: 5000
    });

    // Fill in the form
    await this.page.fill('input[name="name"], input[placeholder*="step" i]', step.name);

    if (step.description) {
      const descField = this.page.locator('textarea[name="description"], input[name="description"]');
      if (await descField.isVisible({ timeout: 1000 })) {
        await descField.fill(step.description);
      }
    }

    // Submit
    await this.page.click('button[type="submit"]:has-text("Add"), button:has-text("Save")');

    // Wait for success
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Edit a step
   */
  async editStep(stepName: string, updates: Partial<TestStep>) {
    // Find the step and click edit
    const step = this.getStepByName(stepName);
    const editButton = step.locator('button:has-text("Edit"), button[aria-label*="edit" i]').first();
    await editButton.click();

    // Update fields
    if (updates.name) {
      await this.page.fill('input[name="name"]', updates.name);
    }

    if (updates.description) {
      await this.page.fill('textarea[name="description"], input[name="description"]', updates.description);
    }

    // Save
    await this.page.click('button[type="submit"]:has-text("Save")');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Delete a step
   */
  async deleteStep(stepName: string) {
    // Find the step and click delete
    const step = this.getStepByName(stepName);
    const deleteButton = step.locator('button:has-text("Delete"), button[aria-label*="delete" i]').first();
    await deleteButton.click();

    // Confirm deletion
    const confirmButton = this.page.locator('[role="dialog"] button:has-text("Delete"), [role="alertdialog"] button:has-text("Confirm")');
    await confirmButton.click();

    // Wait for step to be removed
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Reorder steps (if drag and drop is implemented)
   */
  async reorderStep(stepName: string, newPosition: number) {
    const step = this.getStepByName(stepName);
    const steps = this.getSteps();
    const targetStep = steps.nth(newPosition);

    // Drag and drop
    await step.dragTo(targetStep);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get step count
   */
  async getStepCount(): Promise<number> {
    return this.getSteps().count();
  }

  /**
   * Toggle step completion
   */
  async toggleStepCompletion(stepName: string) {
    const step = this.getStepByName(stepName);
    const checkbox = step.locator('input[type="checkbox"], [role="checkbox"]').first();
    await checkbox.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify workflow page is loaded
   */
  async verifyLoaded() {
    await expect(this.getWorkflowName()).toBeVisible();
    await waitForLoadingComplete(this.page);
  }

  /**
   * Check if workflow has steps
   */
  async hasSteps(): Promise<boolean> {
    const count = await this.getStepCount();
    return count > 0;
  }

  /**
   * Check for empty state
   */
  async hasNoSteps(): Promise<boolean> {
    const emptyState = this.page.locator(
      'text=/no steps/i, text=/add your first step/i'
    );
    try {
      await emptyState.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }
}
