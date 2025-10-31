import { Page, expect } from '@playwright/test';

/**
 * Test utility functions for Playwright E2E tests
 */

/**
 * Waits for an element to be visible with a custom error message
 */
export async function waitForElement(
  page: Page,
  selector: string,
  options?: { timeout?: number; errorMessage?: string }
) {
  const element = page.locator(selector);
  await expect(element).toBeVisible({
    timeout: options?.timeout || 10000,
  });
  return element;
}

/**
 * Fills a form field with proper error handling
 */
export async function fillField(
  page: Page,
  selector: string,
  value: string,
  options?: { timeout?: number }
) {
  const field = await waitForElement(page, selector, options);
  await field.clear();
  await field.fill(value);
  await expect(field).toHaveValue(value);
}

/**
 * Clicks a button and waits for network idle
 */
export async function clickAndWait(
  page: Page,
  selector: string,
  options?: { waitForNavigation?: boolean; timeout?: number }
) {
  const button = await waitForElement(page, selector, options);

  if (options?.waitForNavigation) {
    await Promise.all([
      page.waitForLoadState('networkidle'),
      button.click(),
    ]);
  } else {
    await button.click();
  }
}

/**
 * Navigates to a page and waits for it to be fully loaded
 */
export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Waits for a toast notification to appear with specific text
 */
export async function waitForToast(
  page: Page,
  text: string,
  options?: { timeout?: number }
) {
  const toast = page.locator('[role="status"], .toast, [data-sonner-toast]').filter({
    hasText: text,
  });
  await expect(toast).toBeVisible({ timeout: options?.timeout || 5000 });
  return toast;
}

/**
 * Waits for a loading state to complete
 */
export async function waitForLoadingComplete(page: Page) {
  // Wait for common loading indicators to disappear
  const loadingIndicators = [
    '[data-testid="loading"]',
    '.loading',
    '[aria-busy="true"]',
    'text=Loading...',
  ];

  for (const selector of loadingIndicators) {
    const element = page.locator(selector);
    if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(element).toBeHidden({ timeout: 10000 });
    }
  }
}

/**
 * Generates a unique test identifier
 */
export function generateTestId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Checks if an element exists without throwing an error
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  try {
    await page.locator(selector).waitFor({ timeout: 2000, state: 'visible' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Selects an option from a select/combobox with Radix UI support
 */
export async function selectOption(
  page: Page,
  triggerSelector: string,
  optionText: string
) {
  // Click the trigger button/select
  await clickAndWait(page, triggerSelector);

  // Wait for the popover/dropdown to appear
  await page.waitForSelector('[role="listbox"], [role="menu"]', {
    state: 'visible',
    timeout: 5000
  });

  // Click the option
  const option = page.locator(`[role="option"], [role="menuitem"]`).filter({
    hasText: optionText,
  });
  await option.click();

  // Wait for the popover to close
  await page.waitForSelector('[role="listbox"], [role="menu"]', {
    state: 'hidden',
    timeout: 5000
  });
}

/**
 * Opens a dialog by clicking a trigger button
 */
export async function openDialog(page: Page, triggerSelector: string) {
  await clickAndWait(page, triggerSelector);
  await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 5000 });
}

/**
 * Closes a dialog
 */
export async function closeDialog(page: Page) {
  // Try multiple ways to close the dialog
  const closeButton = page.locator('[role="dialog"] button[aria-label*="close" i]');
  if (await closeButton.isVisible({ timeout: 1000 })) {
    await closeButton.click();
  } else {
    // Press Escape
    await page.keyboard.press('Escape');
  }

  await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });
}

/**
 * Asserts that an element is not visible
 */
export async function assertNotVisible(page: Page, selector: string) {
  const element = page.locator(selector);
  await expect(element).toBeHidden();
}

/**
 * Takes a screenshot with a descriptive name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `e2e/screenshots/${name}-${Date.now()}.png`,
    fullPage: true
  });
}

/**
 * Waits for a specific network request to complete
 */
export async function waitForRequest(
  page: Page,
  urlPattern: string | RegExp,
  options?: { timeout?: number }
) {
  return page.waitForRequest(
    (request) => {
      const url = request.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout: options?.timeout || 10000 }
  );
}

/**
 * Waits for a specific network response
 */
export async function waitForResponse(
  page: Page,
  urlPattern: string | RegExp,
  options?: { timeout?: number; status?: number }
) {
  return page.waitForResponse(
    (response) => {
      const url = response.url();
      const matchesUrl = typeof urlPattern === 'string'
        ? url.includes(urlPattern)
        : urlPattern.test(url);

      if (options?.status) {
        return matchesUrl && response.status() === options.status;
      }
      return matchesUrl;
    },
    { timeout: options?.timeout || 10000 }
  );
}

/**
 * Checks if user is authenticated by looking for auth indicators
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check for user button or profile indicator
    const authIndicators = [
      '[data-clerk-id*="userButton"]',
      'button[aria-label*="user" i]',
      '[data-testid="user-menu"]',
    ];

    for (const selector of authIndicators) {
      if (await elementExists(page, selector)) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Retries an action with exponential backoff
 */
export async function retryAction<T>(
  action: () => Promise<T>,
  options?: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
  }
): Promise<T> {
  const maxRetries = options?.maxRetries || 3;
  const initialDelay = options?.initialDelay || 1000;
  const maxDelay = options?.maxDelay || 5000;

  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await action();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delay = Math.min(initialDelay * Math.pow(2, i), maxDelay);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
