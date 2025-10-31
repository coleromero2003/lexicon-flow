import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { waitForLoadingComplete, selectOption } from '../utils/test-helpers';

/**
 * Page Object Model for SCADA Object Details
 */
export class ObjectPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to a specific object
   */
  async goto(objectId: string) {
    await super.goto(`/objects/${objectId}`);
    await waitForLoadingComplete(this.page);
  }

  /**
   * Get the object name heading
   */
  getObjectName(): Locator {
    return this.page.locator('h1, [data-testid="object-name"]').first();
  }

  /**
   * Get the object type
   */
  getObjectType(): Locator {
    return this.page.locator('[data-testid="object-type"]');
  }

  /**
   * Get the object priority
   */
  getObjectPriority(): Locator {
    return this.page.locator('[data-testid="object-priority"]');
  }

  /**
   * Get the add relationship button
   */
  getAddRelationshipButton(): Locator {
    return this.page.locator(
      'button:has-text("Add Relationship"), button:has-text("New Relationship")'
    ).first();
  }

  /**
   * Get the add subtask button
   */
  getAddSubtaskButton(): Locator {
    return this.page.locator(
      'button:has-text("Add Subtask"), button:has-text("New Subtask")'
    ).first();
  }

  /**
   * Get all relationships
   */
  getRelationships(): Locator {
    return this.page.locator('[data-testid="relationship-item"], [data-testid*="relation-"]');
  }

  /**
   * Get all subtasks
   */
  getSubtasks(): Locator {
    return this.page.locator('[data-testid="subtask-item"], [data-testid*="subtask-"]');
  }

  /**
   * Get all attached files
   */
  getAttachedFiles(): Locator {
    return this.page.locator('[data-testid="file-item"], [data-testid*="file-"]');
  }

  /**
   * Get all linked lexicon items
   */
  getLinkedLexiconItems(): Locator {
    return this.page.locator('[data-testid="lexicon-link"], [data-testid*="lexicon-"]');
  }

  /**
   * Add a relationship to another object
   */
  async addRelationship(targetObjectName: string, relationType: string) {
    await this.getAddRelationshipButton().click();

    // Wait for form
    await this.page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 5000 });

    // Select relationship type
    await selectOption(
      this.page,
      'button[name="relation_type"], select[name="relation_type"]',
      relationType
    );

    // Select target object
    await this.page.fill('input[name="target_object"], input[placeholder*="object" i]', targetObjectName);

    // Wait for autocomplete and select first option
    await this.page.waitForTimeout(500);
    const firstOption = this.page.locator('[role="option"]').first();
    if (await firstOption.isVisible({ timeout: 2000 })) {
      await firstOption.click();
    }

    // Submit
    await this.page.click('button[type="submit"]:has-text("Add"), button:has-text("Save")');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Add a subtask
   */
  async addSubtask(name: string, description?: string) {
    await this.getAddSubtaskButton().click();

    // Wait for form
    await this.page.waitForSelector('input[name="name"], input[placeholder*="subtask" i]', {
      state: 'visible',
      timeout: 5000
    });

    // Fill in the form
    await this.page.fill('input[name="name"], input[placeholder*="subtask" i]', name);

    if (description) {
      const descField = this.page.locator('textarea[name="description"], input[name="description"]');
      if (await descField.isVisible({ timeout: 1000 })) {
        await descField.fill(description);
      }
    }

    // Submit
    await this.page.click('button[type="submit"]:has-text("Add"), button:has-text("Save")');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Toggle subtask completion
   */
  async toggleSubtaskCompletion(subtaskName: string) {
    const subtask = this.page.locator(`[data-testid="subtask-item"]:has-text("${subtaskName}")`);
    const checkbox = subtask.locator('input[type="checkbox"], [role="checkbox"]').first();
    await checkbox.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Update object priority
   */
  async updatePriority(priority: 'low' | 'medium' | 'high' | 'urgent') {
    const priorityButton = this.page.locator(
      'button[name="priority"], [data-testid="priority-select"]'
    );
    await priorityButton.click();

    const option = this.page.locator(`[role="option"]:has-text("${priority}")`);
    await option.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Attach a file (if file upload is implemented)
   */
  async attachFile(filePath: string) {
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Link a lexicon item
   */
  async linkLexiconItem(lexiconItemName: string) {
    const linkButton = this.page.locator(
      'button:has-text("Link Lexicon"), button:has-text("Add Lexicon")'
    ).first();
    await linkButton.click();

    // Search for lexicon item
    await this.page.fill('input[placeholder*="lexicon" i]', lexiconItemName);
    await this.page.waitForTimeout(500);

    // Select first option
    const firstOption = this.page.locator('[role="option"]').first();
    if (await firstOption.isVisible({ timeout: 2000 })) {
      await firstOption.click();
    }

    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Edit object details
   */
  async editObject(updates: { name?: string; description?: string; type?: string }) {
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

    if (updates.type) {
      await this.page.fill('input[name="type"]', updates.type);
    }

    // Save
    await this.page.click('button[type="submit"]:has-text("Save")');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Delete object
   */
  async deleteObject() {
    // Look for delete button
    const deleteButton = this.page.locator('button:has-text("Delete"), button[aria-label*="delete" i]').first();
    await deleteButton.click();

    // Confirm deletion
    const confirmButton = this.page.locator('[role="dialog"] button:has-text("Delete"), [role="alertdialog"] button:has-text("Confirm")');
    await confirmButton.click();

    // Wait for navigation back to project
    await this.page.waitForURL('**/projects/**');
  }

  /**
   * Get relationship count
   */
  async getRelationshipCount(): Promise<number> {
    return this.getRelationships().count();
  }

  /**
   * Get subtask count
   */
  async getSubtaskCount(): Promise<number> {
    return this.getSubtasks().count();
  }

  /**
   * Get file count
   */
  async getFileCount(): Promise<number> {
    return this.getAttachedFiles().count();
  }

  /**
   * Get lexicon link count
   */
  async getLexiconLinkCount(): Promise<number> {
    return this.getLinkedLexiconItems().count();
  }

  /**
   * Verify object page is loaded
   */
  async verifyLoaded() {
    await expect(this.getObjectName()).toBeVisible();
    await waitForLoadingComplete(this.page);
  }
}
