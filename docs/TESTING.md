# Testing Guide - Lexicon Flow

This document provides an overview of the testing strategy and improvements made to the Playwright E2E testing suite.

## Overview

The Lexicon Flow application uses a comprehensive testing strategy:

- **Unit/Integration Tests**: Vitest for testing business logic and services
- **E2E Tests**: Playwright for testing user workflows and UI interactions

## E2E Testing Improvements

### What Was Improved

The original Playwright tests have been enhanced with the following improvements:

#### 1. **Page Object Models (POMs)**

Created structured page objects for all major pages:
- `BasePage` - Base class with common functionality
- `DashboardPage` - Dashboard interactions
- `ProjectPage` - Project management
- `WorkflowPage` - Workflow and step management
- `ObjectPage` - SCADA object interactions

**Benefits:**
- Reusable code across tests
- Easier maintenance when UI changes
- Better abstraction of UI interactions
- Type-safe page interactions

#### 2. **Test Utilities**

Created `e2e/utils/test-helpers.ts` with helper functions:
- `waitForElement()` - Reliable element waiting
- `fillField()` - Form field filling with validation
- `clickAndWait()` - Click with proper waiting
- `waitForToast()` - Toast notification handling
- `selectOption()` - Radix UI select handling
- `openDialog()` / `closeDialog()` - Modal interactions
- `retryAction()` - Retry with exponential backoff

**Benefits:**
- Eliminates `waitForTimeout()` anti-patterns
- Consistent error handling
- Better test reliability
- Reduced code duplication

#### 3. **Test Data Factories**

Created `e2e/utils/test-data.ts` with data generators:
- `createTestProject()` - Generate project data
- `createTestWorkflow()` - Generate workflow data
- `createTestStep()` - Generate step data
- `createTestObject()` - Generate SCADA object data
- `createTestLexiconItem()` - Generate lexicon items

**Benefits:**
- Consistent test data structure
- Easy to generate unique test data
- Reduces magic strings in tests
- Type-safe test data

#### 4. **Enhanced Test Suites**

Created new enhanced test files in `e2e/enhanced/`:
- `dashboard.enhanced.spec.ts` - Comprehensive dashboard tests
- `projects.enhanced.spec.ts` - Project management tests
- `workflows.enhanced.spec.ts` - Workflow tests
- `objects.enhanced.spec.ts` - SCADA object tests

**Key Improvements:**
- Better test organization
- More comprehensive assertions
- Error scenario testing
- State verification after page reload
- Graceful test skipping
- Proper test isolation

#### 5. **Improved Playwright Configuration**

Enhanced `playwright.config.ts` with:
- Multiple reporters (HTML, JSON, list)
- Proper timeouts for actions and navigation
- Separate test projects for enhanced tests
- Better viewport and browser settings
- Improved retry and parallel execution settings

#### 6. **Comprehensive Documentation**

Created `e2e/README.md` with:
- Directory structure overview
- Running tests instructions
- Best practices guide
- Writing new tests guide
- Debugging tips
- CI/CD integration examples
- Common issues and solutions

## Test Structure Comparison

### Before (Original Tests)

```typescript
test('should create a new project', async ({ page }) => {
  const projectName = `Test Project ${Date.now()}`;

  await page.goto('/dashboard');
  const createButton = page.locator('button:has-text("Create")').first();

  if (await createButton.isVisible({ timeout: 5000 })) {
    await createButton.click();
    await page.fill('input[name="name"]', projectName);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000); // Anti-pattern!

    const projectElement = page.locator(`text="${projectName}"`);
    await expect(projectElement).toBeVisible();
  } else {
    test.skip();
  }
});
```

**Issues:**
- Raw page interactions
- `waitForTimeout()` anti-pattern
- Fragile selectors
- Repeated code
- No proper error handling

### After (Enhanced Tests)

```typescript
test('should display projects or empty state', async () => {
  await waitForLoadingComplete(dashboardPage.page);

  const hasNoProjects = await dashboardPage.hasNoProjects();
  const projectCount = await dashboardPage.getProjectCount();

  if (hasNoProjects) {
    expect(projectCount).toBe(0);
    await expect(
      dashboardPage.page.locator('text=/no projects/i')
    ).toBeVisible();
  } else {
    expect(projectCount).toBeGreaterThan(0);
    await expect(dashboardPage.getProjectCards().first()).toBeVisible();
  }
});
```

**Improvements:**
- Uses page object methods
- Proper waiting with assertions
- Clear intent
- Better error messages
- Handles both states

## Running Tests

### Quick Start

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Run all tests
npm run test:e2e

# Run enhanced tests only
npx playwright test --project=chromium-enhanced

# Run with UI mode
npm run test:e2e:ui
```

### Test Categories

**Original Tests** (`*.spec.ts`)
- Basic navigation tests
- Simple CRUD operations
- Good for quick smoke tests

**Enhanced Tests** (`*.enhanced.spec.ts`)
- Comprehensive functionality testing
- Better assertions and error handling
- Recommended for thorough testing

## Best Practices Adopted

### 1. No `waitForTimeout()`
Replace all arbitrary waits with proper assertions:

```typescript
// BAD
await page.waitForTimeout(2000);

// GOOD
await expect(element).toBeVisible();
await page.waitForLoadState('networkidle');
```

### 2. Use Page Objects
Always use page object methods:

```typescript
// BAD
await page.goto('/dashboard');
await page.click('button');

// GOOD
const dashboardPage = new DashboardPage(page);
await dashboardPage.goto();
await dashboardPage.getCreateProjectButton().click();
```

### 3. Use data-testid Attributes
Add `data-testid` to components for reliable selection:

```tsx
<button data-testid="create-project-btn">Create</button>
```

```typescript
await page.locator('[data-testid="create-project-btn"]').click();
```

### 4. Test Isolation
Each test should be independent:

```typescript
test.beforeEach(async ({ page }) => {
  // Fresh setup for each test
  await dashboardPage.goto();
});
```

### 5. Graceful Skipping
Skip tests when preconditions aren't met:

```typescript
test('should edit project', async ({ page }) => {
  if (await dashboardPage.hasNoProjects()) {
    test.skip(); // Skip if no projects
  }
  // Test implementation...
});
```

## Test Coverage

### Current Coverage

✅ **Dashboard**
- Authentication verification
- Project listing
- Search functionality
- Navigation
- Mobile responsiveness

✅ **Projects**
- Project details display
- Workflow management
- Object management
- Navigation
- Error handling

✅ **Workflows**
- Workflow details
- Step management
- Step ordering
- State persistence

✅ **SCADA Objects**
- Object details
- Relationships
- Subtasks
- File attachments
- Lexicon links

### Coverage Gaps

The following areas need additional test coverage:

🔲 **Lexicon Management**
- CRUD operations for lexicon items
- Different lexicon types
- File attachments

🔲 **Advanced Object Features**
- Object relationship creation
- Different relationship types
- Complex object hierarchies

🔲 **Search Functionality**
- Full-text search on objects
- Search filters
- Search results navigation

🔲 **File Management**
- File upload
- File download
- File preview
- File deletion

🔲 **Organization Management**
- Organization switching
- Member management
- Permission testing

🔲 **Subscription Features**
- Plan limits enforcement
- Upgrade/downgrade flows
- Feature restrictions by plan

🔲 **Error Scenarios**
- Network failures
- Permission errors
- Validation errors
- Rate limiting

🔲 **Accessibility**
- Keyboard navigation
- Screen reader support
- ARIA attributes
- Color contrast

🔲 **Performance**
- Page load times
- Large dataset handling
- Real-time updates

## Next Steps

### Immediate Actions

1. **Add data-testid Attributes**
   - Add to all interactive elements
   - Follow naming convention: `{component}-{action}-{element}`
   - Examples: `create-project-btn`, `project-name-input`

2. **Implement Test Data Cleanup**
   - Add cleanup hooks to remove test data
   - Use `test.afterEach()` for cleanup
   - Consider using database snapshots

3. **Add More Enhanced Tests**
   - Cover the gaps listed above
   - Focus on critical user workflows
   - Add error scenario tests

### Long-term Improvements

1. **API Testing**
   - Intercept and mock API calls
   - Test error responses
   - Validate request/response structure

2. **Visual Regression Testing**
   - Integrate with Percy or similar
   - Capture screenshots of key pages
   - Automated visual diff detection

3. **Accessibility Testing**
   - Integrate @axe-core/playwright
   - Add ARIA attribute tests
   - Test keyboard navigation

4. **Performance Testing**
   - Add Lighthouse CI integration
   - Monitor page load metrics
   - Set performance budgets

5. **Test Data Management**
   - Implement database seeding
   - Use test fixtures
   - Add test data reset between runs

6. **Multi-User Testing**
   - Test with different user roles
   - Test organization collaboration
   - Test permission boundaries

## Debugging Failed Tests

### View Test Report
```bash
npm run test:e2e:report
```

### Run Single Test
```bash
npx playwright test -g "test name"
```

### Debug Mode
```bash
npm run test:e2e:debug
```

### Trace Viewer
```bash
npx playwright show-trace trace.zip
```

## CI/CD Integration

The tests are configured to run in CI with:
- Retry on failure (2 retries)
- Single worker for stability
- Automatic screenshots on failure
- Trace collection on retry
- HTML report artifact upload

See `e2e/README.md` for GitHub Actions example.

## Resources

- [E2E README](../e2e/README.md) - Detailed E2E testing guide
- [Playwright Docs](https://playwright.dev)
- [Clerk Testing](https://clerk.com/docs/testing/playwright)
- [Page Object Model](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)

## Questions?

For questions about testing, please refer to:
1. The E2E README (`e2e/README.md`)
2. The Playwright documentation
3. The existing test examples in `e2e/enhanced/`
