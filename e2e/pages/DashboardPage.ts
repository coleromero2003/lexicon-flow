import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { waitForLoadingComplete } from '../utils/test-helpers';

/**
 * Page Object Model for Dashboard
 */
export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to dashboard
   */
  async goto() {
    await super.goto('/dashboard');
    await waitForLoadingComplete(this.page);
  }

  /**
   * Get the main heading
   */
  getHeading(): Locator {
    return this.page.locator('h1, h2').first();
  }

  /**
   * Get all project cards/items
   */
  getProjectCards(): Locator {
    return this.page.locator('[data-testid="project-card"], a[href*="/projects/"]');
  }

  /**
   * Get a specific project by name
   */
  getProjectByName(name: string): Locator {
    return this.page.locator(`[data-testid="project-card"]:has-text("${name}")`);
  }

  /**
   * Get the create project button
   */
  getCreateProjectButton(): Locator {
    return this.page.locator(
      'button:has-text("New Project"), button:has-text("Create Project"), a:has-text("Create Project")'
    ).first();
  }

  /**
   * Get the search input
   */
  getSearchInput(): Locator {
    return this.page.locator(
      'input[placeholder*="search" i], input[type="search"]'
    );
  }

  /**
   * Search for projects
   */
  async searchProjects(query: string) {
    const searchInput = this.getSearchInput();
    await searchInput.fill(query);
    await this.page.waitForTimeout(500); // Debounce
  }

  /**
   * Click on a project to open it
   */
  async openProject(projectName: string) {
    const project = this.page.locator(`text="${projectName}"`).first();
    await project.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get project count
   */
  async getProjectCount(): Promise<number> {
    return this.getProjectCards().count();
  }

  /**
   * Check if there are no projects
   */
  async hasNoProjects(): Promise<boolean> {
    const emptyState = this.page.locator(
      'text=/no projects/i, text=/create your first project/i'
    );
    try {
      await emptyState.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verify dashboard is loaded
   */
  async verifyLoaded() {
    await expect(this.getHeading()).toBeVisible();
    await waitForLoadingComplete(this.page);
  }
}
