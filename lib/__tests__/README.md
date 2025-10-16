# Testing Guide for Lexicon Flow Services

This directory contains comprehensive tests for the services layer using Vitest and your local Supabase database.

## Setup

### Prerequisites

1. **Local Supabase Instance**: Make sure your local Supabase instance is running
   ```bash
   supabase start
   ```

2. **Environment Variables**: The tests use default local Supabase credentials. If you need custom values, create a `.env.test` file:
   ```
   SUPABASE_URL=http://127.0.0.1:54321
   SUPABASE_ANON_KEY=your-anon-key
   ```

### Database Schema

The tests assume your local Supabase database has the following tables set up:
- `boards`
- `columns`
- `tasks`
- `projects`
- `workflows`
- `steps`
- `objects`
- `object_relations`
- `object_subtasks`
- `files`
- `object_files`
- `object_lexicon_links`
- `lexicon_items`
- `lexicon_files`

Make sure you've run your migrations before testing:
```bash
supabase db push
```

## Running Tests

### Run all tests in watch mode
```bash
npm test
```

### Run tests once (CI mode)
```bash
npm run test:run
```

### Run tests with UI
```bash
npm run test:ui
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## Test Structure

The test suite is organized by service:

- **Board Services**: CRUD operations for boards
- **Column Services**: Column management within boards
- **Task Services**: Task creation and management
- **Project Services**: Project CRUD operations
- **Workflow Services**: Workflow queries
- **Step Services**: Step queries
- **Object Services**: SCADA object management
- **Object Relation Services**: Managing relationships between objects
- **Object Subtask Services**: Subtask management
- **File Services**: File metadata management
- **Object-File Link Services**: Linking files to objects
- **Object-Lexicon Link Services**: Linking lexicon items to objects
- **Lexicon Services**: Lexicon item management
- **Lexicon-File Link Services**: Linking files to lexicon items

## Test Features

### Automatic Cleanup
Each test includes `afterEach` hooks to clean up test data, ensuring a clean state for each test run.

### Isolated Test Data
Tests use unique identifiers (timestamps) to avoid collisions between concurrent test runs.

### Comprehensive Coverage
Tests cover:
- ✅ Happy path scenarios
- ✅ Error handling
- ✅ Edge cases
- ✅ Data validation
- ✅ Relationship integrity

## Writing New Tests

When adding new service functions, follow this pattern:

```typescript
describe("MyService", () => {
  let supabase: SupabaseClient;
  let testData: any;

  beforeEach(async () => {
    supabase = createTestSupabaseClient();
    // Setup test data
  });

  afterEach(async () => {
    // Cleanup test data
  });

  describe("myFunction", () => {
    it("should do something", async () => {
      const result = await myService.myFunction(supabase, args);
      expect(result).toBeDefined();
      // Add assertions
    });

    it("should handle errors", async () => {
      await expect(
        myService.myFunction(supabase, invalidArgs)
      ).rejects.toThrow();
    });
  });
});
```

## Troubleshooting

### Tests failing with connection errors
- Ensure your local Supabase is running: `supabase status`
- Check that the correct port (54321) is being used

### Tests failing with schema errors
- Run migrations: `supabase db push`
- Check that your local schema matches your production schema

### Tests are slow
- Use `test:run` for faster execution without watch mode
- Consider running specific test files: `vitest services.test.ts`

### Database constraints violations
- Check that foreign key relationships are properly set up
- Ensure cleanup happens in the correct order (child tables before parent tables)

## Best Practices

1. **Always clean up**: Use `afterEach` to remove test data
2. **Use unique identifiers**: Avoid hardcoded IDs that might conflict
3. **Test error cases**: Don't just test happy paths
4. **Keep tests isolated**: Don't depend on other tests
5. **Use descriptive test names**: Make failures easy to understand
6. **Mock external dependencies**: Only test your service layer

## CI/CD Integration

To run tests in CI/CD:

```yaml
- name: Start Supabase
  run: supabase start

- name: Run tests
  run: npm run test:run

- name: Generate coverage
  run: npm run test:coverage
```
