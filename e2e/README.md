# E2E Testing with Playwright

This directory contains end-to-end tests for the Lexicon Flow application using Playwright and Clerk authentication.

## Directory Structure

```
e2e/
├── README.md                    # This file
├── global.setup.ts             # Authentication setup for all tests
├── pages/                      # Page Object Models (POMs)
│   ├── BasePage.ts            # Base class with common functionality
│   ├── DashboardPage.ts       # Dashboard page object
│   ├── ProjectPage.ts         # Project details page object
│   ├── WorkflowPage.ts        # Workflow details page object
│   └── ObjectPage.ts          # SCADA object details page object
├── utils/                      # Test utilities and helpers
│   ├── test-helpers.ts        # Reusable test helper functions
│   └── test-data.ts           # Test data factories and generators
├── enhanced/                   # Enhanced test suites (recommended)
│   ├── dashboard.enhanced.spec.ts
│   ├── projects.enhanced.spec.ts
│   ├── workflows.enhanced.spec.ts
│   └── objects.enhanced.spec.ts
├── dashboard.spec.ts          # Original dashboard tests
├── projects.spec.ts           # Original project tests
├── workflows.spec.ts          # Original workflow tests
└── objects.spec.ts            # Original object tests
```

## Prerequisites

1. **Environment Variables**: Set up your `.env` file with the following:
   ```env
   E2E_CLERK_USER_USERNAME=your-test-user@example.com
   E2E_CLERK_USER_PASSWORD=your-test-password
   ```

2. **Test User**: Create a test user in your Clerk dashboard with appropriate permissions.

3. **Test Data**: Ensure your test database has at least one organization with sample projects, workflows, and objects.

## Running Tests

### All Tests
```bash
npm run test:e2e              # Run all tests (headless)
npm run test:e2e:headed       # Run with browser visible
npm run test:e2e:ui           # Run with Playwright UI mode
npm run test:e2e:debug        # Debug mode with DevTools
```

### Specific Test Files
```bash
npx playwright test e2e/enhanced/dashboard.enhanced.spec.ts
npx playwright test e2e/projects.spec.ts
```

### Specific Test Projects (Browsers)
```bash
npx playwright test --project=chromium
npx playwright test --project=chromium-enhanced  # Only enhanced tests
npx playwright test --project="Mobile Safari"
```

### View Test Report
```bash
npm run test:e2e:report       # Open HTML report
```

## Test Structure

### Page Object Models (POMs)

We use the Page Object Model pattern to abstract UI interactions:

```typescript
import { DashboardPage } from '../pages/DashboardPage';

test('should navigate to dashboard', async ({ page }) => {
  const dashboardPage = new DashboardPage(page);
  await dashboardPage.goto();
  await dashboardPage.verifyLoaded();

  const projectCount = await dashboardPage.getProjectCount();
  expect(projectCount).toBeGreaterThan(0);
});
```

### Test Helpers

Use helper functions from `utils/test-helpers.ts` instead of raw Playwright commands:

```typescript
import { waitForElement, fillField, clickAndWait } from '../utils/test-helpers';

// Instead of:
await page.waitForSelector('button');
await page.click('button');

// Use:
await clickAndWait(page, 'button');
```

### Test Data Factories

Generate test data using factories from `utils/test-data.ts`:

```typescript
import { createTestProject, createTestObject } from '../utils/test-data';

const project = createTestProject({
  name: 'Custom Project Name',
  description: 'My test project'
});

const object = createTestObject({
  type: 'Sensor',
  priority: 'high'
});
```

## Best Practices

### 1. Use Data-TestId Attributes

For reliable element selection, add `data-testid` attributes to your components:

```tsx
<button data-testid="create-project-btn">Create Project</button>
```

Then select with:
```typescript
await page.locator('[data-testid="create-project-btn"]').click();
```

### 2. Avoid waitForTimeout

Never use `page.waitForTimeout()`. Instead, use proper assertions:

```typescript
// BAD
await page.waitForTimeout(2000);

// GOOD
await expect(page.locator('button')).toBeVisible();
await page.waitForLoadState('networkidle');
```

### 3. Use Page Object Methods

Always use page object methods instead of direct page interactions:

```typescript
// BAD
await page.goto('/dashboard');
await page.click('button:has-text("Create")');

// GOOD
const dashboardPage = new DashboardPage(page);
await dashboardPage.goto();
await dashboardPage.getCreateProjectButton().click();
```

### 4. Test Isolation

Each test should be independent and not rely on state from previous tests:

```typescript
test.beforeEach(async ({ page }) => {
  // Set up fresh state for each test
  const dashboardPage = new DashboardPage(page);
  await dashboardPage.goto();
});

test.afterEach(async ({ page }) => {
  // Clean up test data if needed
});
```

### 5. Skip Tests Gracefully

If test data doesn't exist, skip the test instead of failing:

```typescript
test('should edit project', async ({ page }) => {
  const projectCount = await dashboardPage.getProjectCount();
  if (projectCount === 0) {
    test.skip(); // Skip if no projects exist
  }

  // Test implementation...
});
```

### 6. Use Proper Selectors

Priority order for selectors:
1. `data-testid` attributes
2. Role-based selectors
3. Text content (for stable text)
4. CSS selectors (as last resort)

```typescript
// Best
page.locator('[data-testid="submit-btn"]')

// Good
page.locator('button[type="submit"]')
page.getByRole('button', { name: 'Submit' })

// OK
page.locator('button:has-text("Submit")')

// Avoid
page.locator('.btn-primary.submit-button')
```

## Writing New Tests

### 1. Create a Test File

```typescript
import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';

test.use({ storageState: 'e2e/.clerk/user.json' });

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Test implementation
  });
});
```

### 2. Use Page Objects

If testing a new page, create a new page object:

```typescript
// e2e/pages/NewFeaturePage.ts
import { BasePage } from './BasePage';

export class NewFeaturePage extends BasePage {
  async goto() {
    await super.goto('/new-feature');
  }

  getMainHeading() {
    return this.page.locator('h1');
  }

  async performAction() {
    await this.click('[data-testid="action-btn"]');
  }
}
```

### 3. Add Test Data Factories

If you need new test data types:

```typescript
// e2e/utils/test-data.ts
export interface TestNewEntity {
  name: string;
  value: string;
}

export function createTestNewEntity(
  overrides?: Partial<TestNewEntity>
): TestNewEntity {
  return {
    name: `Test Entity ${Date.now()}`,
    value: 'default value',
    ...overrides,
  };
}
```

## Debugging Tests

### Visual Debugging
```bash
npm run test:e2e:debug
```

### Playwright Inspector
```bash
PWDEBUG=1 npm run test:e2e
```

### Console Logs
```typescript
test('debug test', async ({ page }) => {
  page.on('console', msg => console.log(msg.text()));
  // Your test code...
});
```

### Screenshots
```typescript
await page.screenshot({ path: 'screenshot.png', fullPage: true });
```

### Trace Viewer
After a test failure, view the trace:
```bash
npx playwright show-trace trace.zip
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          E2E_CLERK_USER_USERNAME: ${{ secrets.E2E_CLERK_USER_USERNAME }}
          E2E_CLERK_USER_PASSWORD: ${{ secrets.E2E_CLERK_USER_PASSWORD }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Common Issues

### Authentication Failures
- Ensure `E2E_CLERK_USER_USERNAME` and `E2E_CLERK_USER_PASSWORD` are set correctly
- Check that the test user exists in Clerk
- Verify the test user has access to an organization

### Timeout Errors
- Increase timeouts in `playwright.config.ts` if needed
- Check that the dev server is running
- Verify network connectivity

### Element Not Found
- Use proper wait conditions (`waitForLoadState`, `expect().toBeVisible()`)
- Check if elements are hidden behind modals or overlays
- Verify selectors are correct

### Flaky Tests
- Remove `waitForTimeout()` calls
- Use proper assertions instead of arbitrary waits
- Ensure tests are isolated and don't depend on each other

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Clerk Testing Documentation](https://clerk.com/docs/testing/playwright)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
