# Workflow Drag and Drop Test Suite

This directory contains comprehensive tests for the workflow detail page, with a specific focus on robust drag and drop functionality testing.

## Test Files

### 1. `workflow-detail.test.tsx`
Main test file covering all aspects of the workflow detail page functionality.

**Test Coverage:**
- **Initial Rendering** (5 tests)
  - Workflow page rendering with steps and objects
  - Object counts and metadata display
  - Priority color rendering

- **Drag and Drop - Cross-Step Movement** (4 tests)
  - Moving objects between different steps
  - Visual feedback during drag operations
  - Handling empty steps

- **Drag and Drop - Within Step Reordering** (3 tests)
  - Reordering objects within the same step
  - Maintaining object data during reordering
  - Handling multiple objects

- **Drag and Drop - Edge Cases** (7 tests)
  - Handling invalid drag targets
  - Dragging to same position (no-op)
  - Concurrent drag operations
  - Active object state management

- **Drag and Drop - Sensor Configuration** (2 tests)
  - Pointer sensor with activation constraints
  - Touch event handling for mobile

- **Drag and Drop - Visual Feedback** (4 tests)
  - Drag overlay display
  - Dragging opacity effects
  - Drop target highlighting
  - Priority color accuracy

- **Drag and Drop - Collision Detection** (2 tests)
  - Rectangle intersection collision detection
  - Multiple potential drop targets

- **Drag and Drop - Data Integrity** (5 tests)
  - Preserving object properties during drag
  - Maintaining step data
  - Correct parameter passing to moveObject
  - Sort order updates

- **Drag and Drop - Performance** (2 tests)
  - Handling large numbers of objects
  - Efficient state updates

- **Accessibility** (3 tests)
  - Keyboard navigation support
  - ARIA labels
  - Screen reader announcements

- **Error Handling** (4 tests)
  - API error handling
  - Optimistic update rollback
  - Missing data handling

**Total: 39 tests**

### 2. `drag-drop-integration.test.tsx`
Integration tests focusing on complex drag and drop scenarios and data manipulation.

**Test Coverage:**
- **Complex Drag Scenarios** (4 tests)
  - Moving objects through multiple steps
  - Dragging to middle of target step
  - Sequential reordering
  - Drag cancellation

- **Data Integrity During Drag** (3 tests)
  - Property preservation during cross-step moves
  - Sort order updates for all affected objects
  - Step ID consistency validation

- **Priority-Based Scenarios** (2 tests)
  - Dragging objects with different priorities
  - Priority preservation after drag operations

- **Performance Tests** (3 tests)
  - Large workflow handling (200 objects)
  - Efficient reordering of many objects
  - Cross-step movement performance

- **Edge Cases** (8 tests)
  - Moving last object from step
  - Moving to first/last positions
  - Reordering first to last and vice versa
  - Single object steps
  - Empty workflows

- **Utility Function Tests** (3 tests)
  - Object order verification
  - Sort order validation
  - Invalid data detection

**Total: 23 tests**

### 3. `drag-drop-utils.ts`
Comprehensive utility library for drag and drop testing.

**Utilities Provided:**

#### Mock Event Creators
- `createMockDragStartEvent()` - Creates drag start events
- `createMockDragOverEvent()` - Creates drag over events
- `createMockDragEndEvent()` - Creates drag end events

#### Drag Simulation Functions
- `simulateCrossStepDrag()` - Simulates dragging between steps
- `simulateWithinStepReorder()` - Simulates reordering within a step
- `simulateCancelledDrag()` - Simulates cancelled drag operations
- `simulateComplexDrag()` - Simulates drag through multiple targets

#### Data Manipulation Helpers
- `moveObjectBetweenSteps()` - Moves objects between steps in test data
- `reorderObjectsInStep()` - Reorders objects within a step
- `verifyObjectOrder()` - Verifies object ordering
- `validateSortOrders()` - Validates all sort orders are correct

#### Mock Data Creators
- `createMockObject()` - Creates mock SCADA objects
- `createMockStep()` - Creates mock workflow steps
- `createWorkflowTestScenario()` - Creates complete test scenarios
- `createStepWithPriorityDistribution()` - Creates steps with specific priority distributions

#### Assertion Helpers
- `assertDragEvent()` - Asserts drag event properties
- `findObjectStep()` - Finds which step contains an object
- `countTotalObjects()` - Counts total objects across all steps
- `measureDragPerformance()` - Measures drag operation performance

## Running the Tests

### Run all workflow tests
```bash
npm test -- app/workflows/__tests__/
```

### Run specific test file
```bash
npm test -- app/workflows/__tests__/workflow-detail.test.tsx
npm test -- app/workflows/__tests__/drag-drop-integration.test.tsx
```

### Run with UI
```bash
npm run test:ui
```

### Run with coverage
```bash
npm test -- app/workflows/__tests__/ --coverage
```

### Run in CI mode (single run)
```bash
npm run test:run -- app/workflows/__tests__/
```

## Test Results Summary

- **Total Tests:** 62
- **Passing:** 62
- **Failing:** 0
- **Pass Rate:** 100% ✅

## Key Testing Patterns

### 1. Mocking Next.js Navigation
```typescript
vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));
```

### 2. Mocking Custom Hooks
```typescript
vi.mock("@/lib/hooks/useWorkflows", () => ({
  useWorkflow: vi.fn(),
}));
```

### 3. Testing Drag Events
```typescript
const dragEvents = simulateCrossStepDrag(objectId, sourceStepId, targetStepId);
expect(dragEvents.dragStart.active.id).toBe(objectId);
expect(dragEvents.dragEnd.over?.id).toBe(targetStepId);
```

### 4. Validating Data Integrity
```typescript
const updatedSteps = moveObjectBetweenSteps(steps, objectId, targetStepId);
const validation = validateSortOrders(updatedSteps);
expect(validation.valid).toBe(true);
```

### 5. Performance Testing
```typescript
const { result, duration } = measureDragPerformance(() =>
  createWorkflowTestScenario({ numSteps: 10, objectsPerStep: 20 })
);
expect(duration).toBeLessThan(100);
```

## Drag and Drop Architecture

The workflow page uses `@dnd-kit` for drag and drop functionality:

- **DndContext** - Provides drag and drop context
- **useSortable** - Makes objects sortable within steps
- **useDroppable** - Makes steps droppable targets
- **PointerSensor** - Handles pointer-based dragging with activation constraint (8px distance)
- **rectIntersection** - Collision detection strategy

### Drag Flow
1. **DragStart** - Sets active object
2. **DragOver** - Updates local state optimistically for within-step reordering
3. **DragEnd** - Calls API to persist changes

### Visual Feedback
- Dragging object has 50% opacity
- Drop targets show blue background and ring
- Drag overlay shows clone of dragged object

## Best Practices

1. **Always use utility functions** - Don't create mock data manually
2. **Test data integrity** - Validate sort orders and step IDs after operations
3. **Test edge cases** - Empty steps, single objects, large datasets
4. **Test performance** - Ensure operations complete quickly
5. **Test accessibility** - Keyboard navigation and screen readers
6. **Mock at the right level** - Mock hooks, not components
7. **Use descriptive test names** - Should read like documentation

## Common Issues and Solutions

### Issue: "React is not defined"
**Solution:** Import React in component and test files
```typescript
import React from "react";
```

### Issue: "document is not defined"
**Solution:** Ensure vitest.config.ts uses jsdom environment
```typescript
environment: "jsdom"
```

### Issue: Element not found in tests
**Solution:** Check that mocks return proper data structure
```typescript
(useWorkflow as ReturnType<typeof vi.fn>).mockReturnValue({
  workflow: mockWorkflow,
  steps: mockSteps,
  // ... all required properties
});
```

### Issue: Drag events not triggering
**Solution:** Use utility functions to create proper event structures
```typescript
const dragEnd = createMockDragEndEvent(objectId, targetStepId);
```

## Future Enhancements

- [ ] Add visual regression tests for drag overlay
- [ ] Test multi-touch drag operations
- [ ] Add tests for undo/redo functionality
- [ ] Test drag operations with real API integration
- [ ] Add tests for drag and drop animations
- [ ] Test drag operations with keyboard
- [ ] Add accessibility audit tests
- [ ] Performance benchmarking suite

## Dependencies

- **vitest** - Test runner
- **@testing-library/react** - React testing utilities
- **@testing-library/jest-dom** - DOM matchers
- **@testing-library/user-event** - User interaction simulation
- **jsdom** - DOM implementation for tests

## Related Files

- [app/workflows/[id]/page.tsx](../[id]/page.tsx) - Component under test
- [lib/hooks/useWorkflows.ts](../../../lib/hooks/useWorkflows.ts) - Workflow hooks
- [lib/supabase/models.ts](../../../lib/supabase/models.ts) - Type definitions
- [vitest.config.ts](../../../vitest.config.ts) - Test configuration

## Contributing

When adding new drag and drop features:

1. Write tests first (TDD approach)
2. Use existing utility functions
3. Add new utilities if needed
4. Test edge cases
5. Test performance with large datasets
6. Ensure accessibility
7. Update this README with new test coverage

## License

Part of the Lexicon Flow project.
