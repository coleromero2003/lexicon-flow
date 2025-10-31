# Playwright E2E Testing Guide

This guide covers end-to-end (E2E) testing with Playwright in the Lexicon Flow application, including Clerk authentication bypass for testing protected routes.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Configuration](#configuration)
- [Authentication](#authentication)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Lexicon Flow uses Playwright for E2E testing to verify that the application works correctly from a user's perspective. The test suite includes:

- **Dashboard tests**: Navigation, user interface, responsive design
- **Project tests**: CRUD operations, search/filter functionality
- **Object tests**: SCADA object management, relationships
- **Workflow tests**: Workflow and step management

### Key Features

- **Mock Authentication**: No real Clerk credentials needed - uses mocked authentication data
- **Multi-browser support**: Tests run on Chromium, Firefox, and WebKit
- **Mobile testing**: Includes mobile viewport testing
- **Parallel execution**: Tests run in parallel for faster feedback
- **Visual debugging**: UI mode and trace viewer for debugging

## Setup

### Prerequisites

- Node.js 18+ installed
- Running development server (`npm run dev`)
- **No Clerk credentials required** - uses mock authentication

### Installation

Playwright and dependencies are already installed. To reinstall browsers:

```bash
npx playwright install
```

### Environment Variables

No authentication environment variables are required! Tests use mock authentication by default.

Optional configuration in `.env.local`:

```env
# Optional: Override base URL for tests
PLAYWRIGHT_BASE_URL=http://localhost:3000
```

**Benefits of Mock Authentication**:
- No need to create or manage test users in Clerk
- Faster test execution (no real authentication API calls)
- More reliable tests (no network dependencies for auth)
- Works offline and in isolated environments
- No risk of exposing real credentials

## Configuration

### playwright.config.ts

The Playwright configuration includes:

```typescript
{
  testDir: './e2e',                    // Test directory
  fullyParallel: true,                 // Run tests in parallel
  retries: process.env.CI ? 2 : 0,     // Retry on CI
  use: {
    baseURL: 'http://localhost:3000',  // Base URL for navigation
    trace: 'on-first-retry',           // Capture trace on retry
    screenshot: 'only-on-failure',     // Screenshots on failure
    video: 'retain-on-failure',        // Videos on failure
  },
  globalSetup: './e2e/global-setup.ts', // Authentication setup
  webServer: {
    command: 'npm run dev',             // Start dev server
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
}
```

### Project Configuration

Tests run on multiple browsers:
- **Chromium** (Chrome/Edge)
- **Firefox**
- **WebKit** (Safari)
- **Mobile Chrome** (Pixel 5 viewport)
- **Mobile Safari** (iPhone 12 viewport)

## Authentication

### How It Works

The test suite uses **mock authentication** to simulate authenticated users **without requiring real Clerk credentials**:

1. **Global Setup** (`e2e/global-setup.ts`):
   - Runs **once** before all tests (not per test!)
   - Creates a mock authentication file with fake session data
   - Saves mock authentication state to `e2e/.auth/user.json`
   - **No network calls to Clerk APIs** - instant setup

2. **Test Execution** (`e2e/helpers.ts`):
   - Each test calls `setupTestAuth(page)` before navigating
   - Mock Clerk client is injected into the browser via `page.addInitScript()`
   - Clerk API calls are intercepted and return mock responses
   - Tests run as authenticated user immediately
   - **No login UI interaction** - tests start directly on the page you need

3. **Mock Authentication Implementation** (`e2e/mock-auth.ts`):
   - Defines mock user data (user_test_mock_id_12345)
   - Defines mock organization data (org_test_mock_org_12345)
   - Intercepts Clerk API endpoints and returns mock responses
   - Injects mock `window.Clerk` object into the browser

### Mock User Details

The mock authentication provides:
- **Email**: test@example.com
- **Name**: Test User
- **Organization**: Test Organization
- **User ID**: user_test_mock_id_12345
- **Organization ID**: org_test_mock_org_12345

### Authentication State

The authentication state file (`e2e/.auth/user.json`) contains:
- Mock cookies (simulating Clerk session)
- Mock local storage data
- Session storage data

**This file is gitignored and regenerated for each test run.**

### Using Mock Auth in Tests

Most helper functions automatically set up mock auth. For custom navigation:

```typescript
import { setupTestAuth } from './helpers';

test('my test', async ({ page }) => {
  // Set up mock authentication
  await setupTestAuth(page);

  // Now navigate to your page
  await page.goto('/dashboard');

  // window.Clerk will be available with mock data
});
```

### Testing Unauthenticated Pages

To test unauthenticated pages, simply don't call `setupTestAuth()`:

```typescript
test('should show login page when not authenticated', async ({ page }) => {
  // Navigate WITHOUT calling setupTestAuth()
  await page.goto('/');

  // Should redirect to sign-in or show public content
  await expect(page).toHaveURL(/.*sign-in/);
});
```

Or create a separate project in `playwright.config.ts` without storageState:

```typescript
{
  name: 'unauthenticated',
  use: {
    ...devices['Desktop Chrome'],
    // Don't use storageState for unauthenticated tests
  },
}
```

## Running Tests

### Available Commands

```bash
# Run all tests (headless)
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests in debug mode (step through)
npm run test:e2e:debug

# View last test report
npm run test:e2e:report
```

### Running Specific Tests

```bash
# Run a single test file
npx playwright test e2e/dashboard.spec.ts

# Run tests matching a pattern
npx playwright test -g "should create"

# Run tests in a specific project (browser)
npx playwright test --project=chromium

# Run tests in headed mode for debugging
npx playwright test --headed --project=chromium
```

### CI/CD Integration

For CI environments, tests will:
- Run with 2 retries
- Not run in parallel (to avoid conflicts)
- Not reuse existing dev server
- Generate HTML reports
- **No authentication credentials needed** - uses mock auth

Example GitHub Actions workflow:

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npx playwright install --with-deps

- name: Run Playwright tests
  run: npm run test:e2e
  # No environment variables needed for auth!

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Writing Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { navigateToDashboard, waitForAuthenticatedPage } from './helpers';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await navigateToDashboard(page);
  });

  test('should perform action', async ({ page }) => {
    // Test implementation
    await page.click('button:has-text("Create")');
    await expect(page.locator('h1')).toContainText('Success');
  });
});
```

### Using Helper Functions

The `e2e/helpers.ts` file provides common utilities:

```typescript
import {
  navigateToDashboard,
  navigateToProject,
  navigateToWorkflow,
  navigateToObject,
  navigateToLexicon,
  createProject,
  deleteProject,
  waitForToast,
  switchOrganization,
} from './helpers';

// Navigate to pages
await navigateToDashboard(page);
await navigateToProject(page, 'project-id');

// Create/delete projects
await createProject(page, 'My Project', 'Description');
await deleteProject(page, 'project-id');

// Wait for notifications
await waitForToast(page, 'Project created successfully');

// Switch organizations
await switchOrganization(page, 'My Org');
```

### Locators

Use robust locators that won't break easily:

**Good locators:**
```typescript
// By role and accessible name
await page.click('button[role="button"]:has-text("Create")');

// By data attributes (recommended - add to your components)
await page.click('[data-testid="create-project-btn"]');

// By text content (for unique text)
await page.click('text="Create Project"');

// Chaining locators
await page.locator('[data-testid="project-list"]').locator('a').first().click();
```

**Avoid:**
```typescript
// CSS classes (can change during refactoring)
await page.click('.btn-primary');

// XPath (hard to read and maintain)
await page.click('//button[@class="btn"]');
```

### Assertions

```typescript
// Visibility
await expect(page.locator('h1')).toBeVisible();
await expect(page.locator('[data-testid="loading"]')).toBeHidden();

// Text content
await expect(page.locator('h1')).toHaveText('Dashboard');
await expect(page.locator('h1')).toContainText('Dash');

// URL
await expect(page).toHaveURL(/.*dashboard/);
await expect(page).toHaveURL('http://localhost:3000/dashboard');

// Count
await expect(page.locator('.project-card')).toHaveCount(5);

// Attributes
await expect(page.locator('input')).toHaveAttribute('type', 'text');
await expect(page.locator('input')).toBeDisabled();
```

### Handling Dynamic Content

```typescript
// Wait for specific elements
await page.waitForSelector('[data-testid="project-list"]');

// Wait for network to be idle
await page.waitForLoadState('networkidle');

// Wait for URL change
await page.waitForURL('**/dashboard');

// Wait for specific time (use sparingly)
await page.waitForTimeout(1000);

// Wait for response
await Promise.all([
  page.waitForResponse(resp => resp.url().includes('/api/projects')),
  page.click('button:has-text("Load More")'),
]);
```

### Testing Forms

```typescript
test('should submit form', async ({ page }) => {
  // Fill inputs
  await page.fill('input[name="name"]', 'Project Name');
  await page.fill('textarea[name="description"]', 'Description');

  // Select from dropdown
  await page.selectOption('select[name="status"]', 'active');

  // Check checkboxes
  await page.check('input[type="checkbox"][name="agree"]');

  // Upload files
  await page.setInputFiles('input[type="file"]', 'path/to/file.pdf');

  // Submit
  await page.click('button[type="submit"]');

  // Wait for success
  await waitForToast(page, 'Project created');
});
```

## Best Practices

### 1. Independent Tests

Each test should be independent and not rely on other tests:

```typescript
// ❌ Bad: Tests depend on each other
test('create project', async ({ page }) => {
  await createProject(page, 'Test Project');
});

test('delete project', async ({ page }) => {
  // Assumes project from previous test exists
  await deleteProject(page, 'test-project-id');
});

// ✅ Good: Each test is independent
test('should create and delete project', async ({ page }) => {
  const projectId = await createProject(page, 'Test Project');
  await deleteProject(page, projectId);
});
```

### 2. Use Data Attributes

Add `data-testid` attributes to important elements:

```tsx
// In your React components
<button data-testid="create-project-btn" onClick={onCreate}>
  Create Project
</button>
```

```typescript
// In tests
await page.click('[data-testid="create-project-btn"]');
```

### 3. Handle Loading States

Always wait for loading states to complete:

```typescript
// Wait for loading indicator to disappear
await expect(page.locator('[data-testid="loading"]')).toBeHidden();

// Or wait for content to appear
await expect(page.locator('[data-testid="project-list"]')).toBeVisible();
```

### 4. Use Descriptive Test Names

```typescript
// ❌ Bad
test('test 1', async ({ page }) => { ... });

// ✅ Good
test('should create a new project with valid data', async ({ page }) => { ... });
test('should display error when project name is empty', async ({ page }) => { ... });
```

### 5. Group Related Tests

```typescript
test.describe('Project CRUD Operations', () => {
  test.describe('Create', () => {
    test('should create project with all fields', async ({ page }) => { ... });
    test('should create project with required fields only', async ({ page }) => { ... });
  });

  test.describe('Update', () => {
    test('should update project name', async ({ page }) => { ... });
    test('should update project description', async ({ page }) => { ... });
  });
});
```

### 6. Use Fixtures for Setup

```typescript
// Create custom fixtures for common setup
import { test as base } from '@playwright/test';

type MyFixtures = {
  projectPage: Page;
};

const test = base.extend<MyFixtures>({
  projectPage: async ({ page }, use) => {
    // Setup
    await page.goto('/dashboard');
    const projectId = await createProject(page, 'Test Project');
    await navigateToProject(page, projectId);

    // Use page in tests
    await use(page);

    // Teardown
    await deleteProject(page, projectId);
  },
});

test('should work with project', async ({ projectPage }) => {
  await expect(projectPage.locator('h1')).toBeVisible();
});
```

## Troubleshooting

### Mock Authentication Not Working

**Problem**: Tests fail with "Clerk not found" or authentication errors

**Solutions**:
1. Ensure you're calling `setupTestAuth(page)` before navigating to authenticated pages
2. Use helper functions like `navigateToDashboard(page)` which include mock auth setup
3. Check that `e2e/.auth/user.json` was created during global setup
4. Try running `npx playwright test --headed` to see what's happening in the browser

### Tests Timeout

**Problem**: `Test timeout of 30000ms exceeded`

**Solutions**:
1. Increase timeout in test:
   ```typescript
   test('slow test', async ({ page }) => {
     test.setTimeout(60000); // 60 seconds
     // ...
   });
   ```
2. Check if dev server is running
3. Look for infinite loading states in your app
4. Use `--headed` mode to debug: `npx playwright test --headed`

### Element Not Found

**Problem**: `Locator not found: button:has-text("Create")`

**Solutions**:
1. Check if element exists with different text
2. Wait for element to appear:
   ```typescript
   await page.waitForSelector('button:has-text("Create")');
   ```
3. Use less specific locators
4. Check for typos in locator string

### Flaky Tests

**Problem**: Tests pass sometimes but fail other times

**Solutions**:
1. Add proper waits for dynamic content
2. Avoid `waitForTimeout()` - use `waitForSelector()` instead
3. Check for race conditions
4. Use `--repeat-each=10` to find flaky tests:
   ```bash
   npx playwright test --repeat-each=10 e2e/dashboard.spec.ts
   ```

### Debug Mode

To debug tests interactively:

```bash
# Open Playwright Inspector
npx playwright test --debug

# Open specific test
npx playwright test e2e/dashboard.spec.ts --debug

# Pause on specific line
await page.pause(); // Add this in your test
```

### View Trace

After a test failure:

```bash
# Generate trace on failure
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

### Check Logs

View console logs from browser:

```typescript
page.on('console', msg => console.log('Browser log:', msg.text()));
```

## Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [API Mocking](https://playwright.dev/docs/mock)

## Contributing

When adding new features:

1. **Add E2E tests** for user-facing functionality
2. **Use helper functions** from `e2e/helpers.ts`
3. **Add data-testid attributes** to key elements
4. **Update this documentation** if adding new patterns or utilities
5. **Run tests locally** before committing:
   ```bash
   npm run test:e2e
   ```
