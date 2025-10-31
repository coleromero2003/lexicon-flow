import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { waitForLoadingComplete, openDialog, closeDialog } from '../utils/test-helpers';
import { TestProject, TestWorkflow, TestObject } from '../utils/test-data';

/**
 * Page Object Model for Project Details
 */
export class ProjectPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to a specific project
   */
  async goto(projectId: string) {
    await super.goto(`/projects/${projectId}`);
    await waitForLoadingComplete(this.page);
  }

  /**
   * Get the project name heading
   */
  getProjectName(): Locator {
    return this.page.locator('h1, [data-testid="project-name"]').first();
  }

  /**
   * Get the create workflow button
   */
  getCreateWorkflowButton(): Locator {
    return this.page.locator(
      'button:has-text("New Workflow"), button:has-text("Create Workflow"), button:has-text("Add Workflow")'
    ).first();
  }

  /**
   * Get the create object button
   */
  getCreateObjectButton(): Locator {
    return this.page.locator(
      'button:has-text("New Object"), button:has-text("Create Object"), button:has-text("Add Object")'
    ).first();
  }

  /**
   * Get all workflow items
   */
  getWorkflows(): Locator {
    return this.page.locator('[data-testid="workflow-item"], a[href*="/workflows/"]');
  }

  /**
   * Get all object items
   */
  getObjects(): Locator {
    return this.page.locator('[data-testid="object-item"]');
  }

  /**
   * Get a specific workflow by name
   */
  getWorkflowByName(name: string): Locator {
    return this.page.locator(`[data-testid="workflow-item"]:has-text("${name}")`);
  }

  /**
   * Get a specific object by name
   */
  getObjectByName(name: string): Locator {
    return this.page.locator(`[data-testid="object-item"]:has-text("${name}")`);
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(workflow: TestWorkflow) {
    await this.getCreateWorkflowButton().click();
    await openDialog(this.page, 'button:has-text("New Workflow")');

    // Fill in the form
    await this.page.fill('input[name="name"], input[placeholder*="workflow" i]', workflow.name);

    if (workflow.description) {
      const descField = this.page.locator('textarea[name="description"], input[name="description"]');
      if (await descField.isVisible({ timeout: 1000 })) {
        await descField.fill(workflow.description);
      }
    }

    // Submit
    await this.page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');

    // Wait for success
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Create a new object
   */
  async createObject(object: TestObject) {
    await this.getCreateObjectButton().click();

    // Fill in the form
    await this.page.fill('input[name="name"], input[placeholder*="name" i]', object.name);

    if (object.description) {
      const descField = this.page.locator('textarea[name="description"], input[name="description"]');
      if (await descField.isVisible({ timeout: 1000 })) {
        await descField.fill(object.description);
      }
    }

    if (object.type) {
      const typeField = this.page.locator('input[name="type"], select[name="type"]');
      if (await typeField.isVisible({ timeout: 1000 })) {
        await typeField.fill(object.type);
      }
    }

    // Submit
    await this.page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');

    // Wait for success
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Open a workflow
   */
  async openWorkflow(workflowName: string) {
    const workflow = this.page.locator(`text="${workflowName}"`).first();
    await workflow.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Open an object
   */
  async openObject(objectName: string) {
    const object = this.page.locator(`text="${objectName}"`).first();
    await object.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get workflow count
   */
  async getWorkflowCount(): Promise<number> {
    return this.getWorkflows().count();
  }

  /**
   * Get object count
   */
  async getObjectCount(): Promise<number> {
    return this.getObjects().count();
  }

  /**
   * Edit project details
   */
  async editProject(updates: Partial<TestProject>) {
    // Look for edit button
    const editButton = this.page.locator('button:has-text("Edit"), button[aria-label*="edit" i]').first();
    await editButton.click();

    // Update fields
    if (updates.name) {
      await this.page.fill('input[name="name"]', updates.name);
    }

    if (updates.description) {
      await this.page.fill('textarea[name="description"], input[name="description"]', updates.description);
    }

    if (updates.location) {
      const locationField = this.page.locator('input[name="location"]');
      if (await locationField.isVisible({ timeout: 1000 })) {
        await locationField.fill(updates.location);
      }
    }

    // Save
    await this.page.click('button[type="submit"]:has-text("Save")');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Delete project
   */
  async deleteProject() {
    // Look for delete button
    const deleteButton = this.page.locator('button:has-text("Delete"), button[aria-label*="delete" i]').first();
    await deleteButton.click();

    // Confirm deletion
    const confirmButton = this.page.locator('[role="dialog"] button:has-text("Delete"), [role="alertdialog"] button:has-text("Confirm")');
    await confirmButton.click();

    // Wait for navigation back to dashboard
    await this.page.waitForURL('**/dashboard');
  }

  /**
   * Verify project page is loaded
   */
  async verifyLoaded() {
    await expect(this.getProjectName()).toBeVisible();
    await waitForLoadingComplete(this.page);
  }
}
