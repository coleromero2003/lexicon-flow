/**
 * Utilities for testing drag and drop functionality with @dnd-kit
 *
 * These utilities help simulate drag and drop events in tests
 * for components using @dnd-kit/core and @dnd-kit/sortable
 */

import { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import type { ScadaObject, StepWithObjects } from "@/lib/supabase/models";

/**
 * Creates a mock DragStartEvent for testing
 */
export function createMockDragStartEvent(
  activeId: number,
  activeData?: Record<string, unknown>
): DragStartEvent {
  return {
    active: {
      id: activeId,
      data: {
        current: activeData || {},
      },
    },
    activatorEvent: new Event("pointerdown"),
  };
}

/**
 * Creates a mock DragOverEvent for testing
 */
export function createMockDragOverEvent(
  activeId: number,
  overId: number,
  activeData?: Record<string, unknown>,
  overData?: Record<string, unknown>
): DragOverEvent {
  return {
    active: {
      id: activeId,
      data: {
        current: activeData || {},
      },
    },
    over: {
      id: overId,
      data: {
        current: overData || {},
      },
    },
    delta: {
      x: 0,
      y: 50, // Simulating vertical drag
    },
    activatorEvent: new Event("pointermove"),
    collisions: null,
  };
}

/**
 * Creates a mock DragEndEvent for testing
 */
export function createMockDragEndEvent(
  activeId: number,
  overId: number | null,
  activeData?: Record<string, unknown>,
  overData?: Record<string, unknown>
): DragEndEvent {
  return {
    active: {
      id: activeId,
      data: {
        current: activeData || {},
      },
    },
    over: overId
      ? {
          id: overId,
          data: {
            current: overData || {},
          },
        }
      : null,
    delta: {
      x: 0,
      y: 100,
    },
    activatorEvent: new Event("pointerup"),
    collisions: null,
  };
}

/**
 * Simulates dragging an object from one step to another
 */
export function simulateCrossStepDrag(
  objectId: number,
  sourceStepId: number,
  targetStepId: number
): {
  dragStart: DragStartEvent;
  dragOver: DragOverEvent;
  dragEnd: DragEndEvent;
} {
  return {
    dragStart: createMockDragStartEvent(objectId),
    dragOver: createMockDragOverEvent(objectId, targetStepId),
    dragEnd: createMockDragEndEvent(objectId, targetStepId),
  };
}

/**
 * Simulates reordering objects within the same step
 */
export function simulateWithinStepReorder(
  activeObjectId: number,
  overObjectId: number,
  stepId: number
): {
  dragStart: DragStartEvent;
  dragOver: DragOverEvent;
  dragEnd: DragEndEvent;
} {
  return {
    dragStart: createMockDragStartEvent(activeObjectId),
    dragOver: createMockDragOverEvent(activeObjectId, overObjectId),
    dragEnd: createMockDragEndEvent(activeObjectId, overObjectId),
  };
}

/**
 * Simulates a drag operation that ends with no valid target
 */
export function simulateCancelledDrag(
  objectId: number
): {
  dragStart: DragStartEvent;
  dragEnd: DragEndEvent;
} {
  return {
    dragStart: createMockDragStartEvent(objectId),
    dragEnd: createMockDragEndEvent(objectId, null),
  };
}

/**
 * Helper to verify object order in a step
 */
export function verifyObjectOrder(
  step: StepWithObjects,
  expectedOrder: number[]
): boolean {
  if (step.objects.length !== expectedOrder.length) {
    return false;
  }

  return step.objects.every((obj, index) => obj.id === expectedOrder[index]);
}

/**
 * Helper to find an object's step
 */
export function findObjectStep(
  steps: StepWithObjects[],
  objectId: number
): StepWithObjects | null {
  return steps.find((step) => step.objects.some((obj) => obj.id === objectId)) || null;
}

/**
 * Helper to count total objects across all steps
 */
export function countTotalObjects(steps: StepWithObjects[]): number {
  return steps.reduce((total, step) => total + step.objects.length, 0);
}

/**
 * Helper to move an object between steps (for test data setup)
 */
export function moveObjectBetweenSteps(
  steps: StepWithObjects[],
  objectId: number,
  targetStepId: number,
  targetIndex?: number
): StepWithObjects[] {
  const newSteps = steps.map((step) => ({
    ...step,
    objects: [...step.objects],
  }));

  // Find source step
  const sourceStep = newSteps.find((step) =>
    step.objects.some((obj) => obj.id === objectId)
  );

  // Find target step
  const targetStep = newSteps.find((step) => step.id === targetStepId);

  if (!sourceStep || !targetStep) {
    return newSteps;
  }

  // Remove object from source
  const objectIndex = sourceStep.objects.findIndex((obj) => obj.id === objectId);
  const [movedObject] = sourceStep.objects.splice(objectIndex, 1);

  // Add to target
  const insertIndex = targetIndex ?? targetStep.objects.length;
  targetStep.objects.splice(insertIndex, 0, {
    ...movedObject,
    step_id: targetStepId,
  });

  // Update sort orders
  sourceStep.objects.forEach((obj, idx) => {
    obj.sort_order = idx;
  });

  targetStep.objects.forEach((obj, idx) => {
    obj.sort_order = idx;
  });

  return newSteps;
}

/**
 * Helper to reorder objects within a step (for test data setup)
 */
export function reorderObjectsInStep(
  steps: StepWithObjects[],
  stepId: number,
  fromIndex: number,
  toIndex: number
): StepWithObjects[] {
  const newSteps = steps.map((step) => ({
    ...step,
    objects: [...step.objects],
  }));

  const step = newSteps.find((s) => s.id === stepId);
  if (!step) {
    return newSteps;
  }

  const [movedObject] = step.objects.splice(fromIndex, 1);
  step.objects.splice(toIndex, 0, movedObject);

  // Update sort orders
  step.objects.forEach((obj, idx) => {
    obj.sort_order = idx;
  });

  return newSteps;
}

/**
 * Creates a mock object for testing
 */
export function createMockObject(
  id: number,
  overrides?: Partial<ScadaObject>
): ScadaObject {
  return {
    id,
    project_id: overrides?.project_id ?? 100,
    workflow_id: overrides?.workflow_id ?? 1,
    step_id: overrides?.step_id ?? 1,
    title: overrides?.title ?? `Test Object ${id}`,
    description_md: overrides?.description_md ?? `Description for object ${id}`,
    assignee: overrides?.assignee ?? null,
    due_date: overrides?.due_date ?? null,
    priority: overrides?.priority ?? "medium",
    sort_order: overrides?.sort_order ?? 0,
    metadata: overrides?.metadata ?? null,
    created_at: overrides?.created_at ?? new Date().toISOString(),
    updated_at: overrides?.updated_at ?? new Date().toISOString(),
  };
}

/**
 * Creates a mock step for testing
 */
export function createMockStep(
  id: number,
  objects: ScadaObject[] = [],
  overrides?: Partial<StepWithObjects>
): StepWithObjects {
  return {
    id,
    workflow_id: overrides?.workflow_id ?? 1,
    title: overrides?.title ?? `Step ${id}`,
    sort_order: overrides?.sort_order ?? 0,
    created_at: overrides?.created_at ?? new Date().toISOString(),
    updated_at: overrides?.updated_at ?? new Date().toISOString(),
    objects,
  };
}

/**
 * Creates a complete workflow test scenario with multiple steps and objects
 */
export function createWorkflowTestScenario(config: {
  numSteps: number;
  objectsPerStep: number;
  workflowId?: number;
  projectId?: number;
}): StepWithObjects[] {
  const { numSteps, objectsPerStep, workflowId = 1, projectId = 100 } = config;
  const steps: StepWithObjects[] = [];

  for (let stepIdx = 0; stepIdx < numSteps; stepIdx++) {
    const stepId = stepIdx + 1;
    const objects: ScadaObject[] = [];

    for (let objIdx = 0; objIdx < objectsPerStep; objIdx++) {
      const objectId = stepIdx * objectsPerStep + objIdx + 1;
      objects.push(
        createMockObject(objectId, {
          step_id: stepId,
          workflow_id: workflowId,
          project_id: projectId,
          sort_order: objIdx,
        })
      );
    }

    steps.push(
      createMockStep(stepId, objects, {
        workflow_id: workflowId,
        sort_order: stepIdx,
      })
    );
  }

  return steps;
}

/**
 * Validates that all objects in steps have correct sort orders
 */
export function validateSortOrders(steps: StepWithObjects[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  steps.forEach((step) => {
    step.objects.forEach((obj, index) => {
      if (obj.sort_order !== index) {
        errors.push(
          `Object ${obj.id} in step ${step.id} has sort_order ${obj.sort_order}, expected ${index}`
        );
      }

      if (obj.step_id !== step.id) {
        errors.push(
          `Object ${obj.id} has step_id ${obj.step_id}, but is in step ${step.id}`
        );
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Helper to assert drag event properties
 */
export function assertDragEvent(
  event: DragStartEvent | DragOverEvent | DragEndEvent,
  expectedActiveId: number,
  expectedOverId?: number | null
): void {
  if (event.active.id !== expectedActiveId) {
    throw new Error(
      `Expected active.id to be ${expectedActiveId}, got ${event.active.id}`
    );
  }

  if ("over" in event) {
    if (expectedOverId !== undefined) {
      if (expectedOverId === null && event.over !== null) {
        throw new Error(`Expected over to be null, got ${event.over?.id}`);
      }

      if (expectedOverId !== null && event.over?.id !== expectedOverId) {
        throw new Error(
          `Expected over.id to be ${expectedOverId}, got ${event.over?.id}`
        );
      }
    }
  }
}

/**
 * Simulates a complex drag scenario with multiple drag-over events
 */
export function simulateComplexDrag(
  objectId: number,
  path: Array<{ overId: number; delay?: number }>
): {
  dragStart: DragStartEvent;
  dragOvers: DragOverEvent[];
  dragEnd: DragEndEvent;
} {
  const dragStart = createMockDragStartEvent(objectId);
  const dragOvers = path.map((step) => createMockDragOverEvent(objectId, step.overId));
  const finalTarget = path[path.length - 1];
  const dragEnd = createMockDragEndEvent(
    objectId,
    finalTarget ? finalTarget.overId : null
  );

  return {
    dragStart,
    dragOvers,
    dragEnd,
  };
}

/**
 * Performance testing helper - measures time for drag operations
 */
export function measureDragPerformance<T>(
  operation: () => T
): { result: T; duration: number } {
  const start = performance.now();
  const result = operation();
  const duration = performance.now() - start;

  return { result, duration };
}

/**
 * Helper to create a step with specific priority distribution
 */
export function createStepWithPriorityDistribution(
  stepId: number,
  distribution: {
    low?: number;
    medium?: number;
    high?: number;
    urgent?: number;
  }
): StepWithObjects {
  const objects: ScadaObject[] = [];
  let objectId = 1;

  (["low", "medium", "high", "urgent"] as const).forEach((priority) => {
    const count = distribution[priority] ?? 0;
    for (let i = 0; i < count; i++) {
      objects.push(
        createMockObject(objectId++, {
          step_id: stepId,
          priority,
          sort_order: objects.length,
        })
      );
    }
  });

  return createMockStep(stepId, objects);
}
