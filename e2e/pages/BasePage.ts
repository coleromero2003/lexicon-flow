import { Page, Locator } from '@playwright/test';
import {
  waitForElement,
  fillField,
  clickAndWait,
  navigateTo,
  waitForToast,
} from '../utils/test-helpers';

/**
 * Base page class with common functionality
 */
export class BasePage {
  constructor(protected page: Page) {}

  /**
   * Navigate to a specific path
   */
  async goto(path: string) {
    await navigateTo(this.page, path);
  }

  /**
   * Get the page title
   */
  async getTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * Get the current URL
   */
  getUrl(): string {
    return this.page.url();
  }

  /**
   * Wait for a specific element
   */
  async waitFor(selector: string, options?: { timeout?: number }) {
    return waitForElement(this.page, selector, options);
  }

  /**
   * Fill a form field
   */
  async fill(selector: string, value: string) {
    await fillField(this.page, selector, value);
  }

  /**
   * Click an element
   */
  async click(selector: string, options?: { waitForNavigation?: boolean }) {
    await clickAndWait(this.page, selector, options);
  }

  /**
   * Wait for a toast notification
   */
  async waitForToast(text: string) {
    return waitForToast(this.page, text);
  }

  /**
   * Get the navbar
   */
  getNavbar(): Locator {
    return this.page.locator('nav, [data-testid="navbar"]');
  }

  /**
   * Get the user menu button
   */
  getUserMenu(): Locator {
    return this.page.locator(
      'button[aria-label*="user" i], [data-clerk-id*="userButton"]'
    );
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const userMenu = this.getUserMenu();
      await userMenu.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Navigate using the navbar
   */
  async navigateToPage(pageName: 'dashboard' | 'projects' | 'workflows' | 'lexicon') {
    const link = this.page.locator(`nav a[href*="/${pageName}"]`);
    await link.click();
    await this.page.waitForURL(`**/${pageName}**`);
  }
}
