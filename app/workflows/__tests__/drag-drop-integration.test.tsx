import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import WorkflowPage from "../[id]/page";
import { useWorkflow } from "@/lib/hooks/useWorkflows";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { Workflow } from "@/lib/supabase/models";
import {
  createMockObject,
  createMockStep,
  createWorkflowTestScenario,
  moveObjectBetweenSteps,
  reorderObjectsInStep,
  verifyObjectOrder,
  validateSortOrders,
  simulateCrossStepDrag,
  simulateWithinStepReorder,
  simulateCancelledDrag,
  createStepWithPriorityDistribution,
  measureDragPerformance,
} from "./drag-drop-utils";

// Mock Next.js navigation hooks
vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock the useWorkflow hook
vi.mock("@/lib/hooks/useWorkflows", () => ({
  useWorkflow: vi.fn(),
}));

// Mock Navbar component
vi.mock("@/components/navbar", () => ({
  default: vi.fn(() => <div data-testid="navbar">Navbar</div>),
}));

describe("WorkflowPage - Drag and Drop Integration Tests", () => {
  const mockWorkflow: Workflow = {
    id: 1,
    project_id: 100,
    name: "Integration Test Workflow",
    description: "Testing drag and drop integration",
    color: "#3b82f6",
    sort_order: 0,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  };

  const mockPush = vi.fn();
  const mockCreateStep = vi.fn();
  const mockUpdateWorkflow = vi.fn();
  const mockCreateRealObject = vi.fn();
  const mockSetSteps = vi.fn();
  const mockMoveObject = vi.fn();
  const mockUpdateStep = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useParams as ReturnType<typeof vi.fn>).mockReturnValue({ id: "1" });
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({ push: mockPush });
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      get: vi.fn((param: string) => (param === "projectId" ? "100" : null)),
    });
  });

  describe("Complex Drag Scenarios", () => {
    it("should handle moving object through multiple steps", () => {
      const steps = createWorkflowTestScenario({
        numSteps: 5,
        objectsPerStep: 3,
      });

      (useWorkflow as ReturnType<typeof vi.fn>).mockReturnValue({
        workflow: mockWorkflow,
        createStep: mockCreateStep,
        updateWorkflow: mockUpdateWorkflow,
        steps,
        createRealObject: mockCreateRealObject,
        setSteps: mockSetSteps,
        moveObject: mockMoveObject,
        updateStep: mockUpdateStep,
      });

      render(<WorkflowPage />);

      // Verify all steps and objects are rendered
      expect(screen.getByText("Step 1")).toBeInTheDocument();
      expect(screen.getByText("Step 5")).toBeInTheDocument();
      expect(screen.getByText("Test Object 1")).toBeInTheDocument();
      expect(screen.getByText("Test Object 15")).toBeInTheDocument();

      // Simulate drag events
      const dragEvents = simulateCrossStepDrag(1, 1, 5);
      expect(dragEvents.dragStart.active.id).toBe(1);
      expect(dragEvents.dragEnd.over?.id).toBe(5);
    });

    it("should handle dragging object to middle of target step", () => {
      const step1 = createMockStep(1, [
        createMockObject(1, { step_id: 1, sort_order: 0 }),
      ]);

      const step2 = createMockStep(2, [
        createMockObject(2, { step_id: 2, sort_order: 0 }),
        createMockObject(3, { step_id: 2, sort_order: 1 }),
        createMockObject(4, { step_id: 2, sort_order: 2 }),
      ]);

      const steps = [step1, step2];

      (useWorkflow as ReturnType<typeof vi.fn>).mockReturnValue({
        workflow: mockWorkflow,
        createStep: mockCreateStep,
        updateWorkflow: mockUpdateWorkflow,
        steps,
        createRealObject: mockCreateRealObject,
        setSteps: mockSetSteps,
        moveObject: mockMoveObject,
        updateStep: mockUpdateStep,
      });

      render(<WorkflowPage />);

      // Move object 1 to middle of step 2 (index 1)
      const updatedSteps = moveObjectBetweenSteps(steps, 1, 2, 1);
      const validation = validateSortOrders(updatedSteps);

      expect(validation.valid).toBe(true);
      expect(updatedSteps[1].objects.length).toBe(4);
      expect(updatedSteps[1].objects[1].id).toBe(1);
    });

    it("should handle sequential reordering within step", () => {
      const objects = [
        createMockObject(1, { step_id: 1, sort_order: 0 }),
        createMockObject(2, { step_id: 1, sort_order: 1 }),
        createMockObject(3, { step_id: 1, sort_order: 2 }),
        createMockObject(4, { step_id: 1, sort_order: 3 }),
        createMockObject(5, { step_id: 1, sort_order: 4 }),
      ];

      const step = createMockStep(1, objects);
      const steps = [step];

      (useWorkflow as ReturnType<typeof vi.fn>).mockReturnValue({
        workflow: mockWorkflow,
        createStep: mockCreateStep,
        updateWorkflow: mockUpdateWorkflow,
        steps,
        createRealObject: mockCreateRealObject,
        setSteps: mockSetSteps,
        moveObject: mockMoveObject,
        updateStep: mockUpdateStep,
      });

      render(<WorkflowPage />);

      // Move object from position 0 to position 4
      let updatedSteps = reorderObjectsInStep(steps, 1, 0, 4);
      expect(verifyObjectOrder(updatedSteps[0], [2, 3, 4, 5, 1])).toBe(true);

      // Move it back to position 2
      updatedSteps = reorderObjectsInStep(updatedSteps, 1, 4, 2);
      expect(verifyObjectOrder(updatedSteps[0], [2, 3, 1, 4, 5])).toBe(true);

      const validation = validateSortOrders(updatedSteps);
      expect(validation.valid).toBe(true);
    });

    it("should handle drag cancel (drop outside valid targets)", () => {
      const steps = createWorkflowTestScenario({
        numSteps: 2,
        objectsPerStep: 2,
      });

      (useWorkflow as ReturnType<typeof vi.fn>).mockReturnValue({
        workflow: mockWorkflow,
        createStep: mockCreateStep,
        updateWorkflow: mockUpdateWorkflow,
        steps,
        createRealObject: mockCreateRealObject,
        setSteps: mockSetSteps,
        moveObject: mockMoveObject,
        updateStep: mockUpdateStep,
      });

      render(<WorkflowPage />);

      const cancelledDrag = simulateCancelledDrag(1);
      expect(cancelledDrag.dragStart.active.id).toBe(1);
      expect(cancelledDrag.dragEnd.over).toBeNull();

      // Object should remain in original position
      expect(mockMoveObject).not.toHaveBeenCalled();
    });
  });

  describe("Data Integrity During Drag", () => {
    it("should maintain all object properties during cross-step move", () => {
      const objectWithAllProps = createMockObject(1, {
        step_id: 1,
        title: "Critical Object",
        description_md: "Detailed description",
        assignee: "Alice Johnson",
        due_date: "2025-12-31",
        priority: "urgent",
        sort_order: 0,
        metadata: { custom: "data" },
      });

      const step1 = createMockStep(1, [objectWithAllProps]);
      const step2 = createMockStep(2, []);
      const steps = [step1, step2];

      (useWorkflow as ReturnType<typeof vi.fn>).mockReturnValue({
        workflow: mockWorkflow,
        createStep: mockCreateStep,
        updateWorkflow: mockUpdateWorkflow,
        steps,
        createRealObject: mockCreateRealObject,
        setSteps: mockSetSteps,
        moveObject: mockMoveObject,
        updateStep: mockUpdateStep,
      });

      render(<WorkflowPage />);

      const updatedSteps = moveObjectBetweenSteps(steps, 1, 2);
      const movedObject = updatedSteps[1].objects[0];

      // Verify all properties preserved
      expect(movedObject.title).toBe("Critical Object");
      expect(movedObject.description_md).toBe("Detailed description");
      expect(movedObject.assignee).toBe("Alice Johnson");
      expect(movedObject.due_date).toBe("2025-12-31");
      expect(movedObject.priority).toBe("urgent");
      expect(movedObject.metadata).toEqual({ custom: "data" });
      expect(movedObject.step_id).toBe(2); // Updated
    });

    it("should correctly update sort orders for all affected objects", () => {
      const step1 = createMockStep(1, [
        createMockObject(1, { step_id: 1, sort_order: 0 }),
        createMockObject(2, { step_id: 1, sort_order: 1 }),
        createMockObject(3, { step_id: 1, sort_order: 2 }),
      ]);

      const step2 = createMockStep(2, [
        createMockObject(4, { step_id: 2, sort_order: 0 }),
        createMockObject(5, { step_id: 2, sort_order: 1 }),
      ]);

      const steps = [step1, step2];

      const updatedSteps = moveObjectBetweenSteps(steps, 2, 2, 1);
      const validation = validateSortOrders(updatedSteps);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      // Check specific sort orders
      expect(updatedSteps[0].objects[0].sort_order).toBe(0); // Object 1
      expect(updatedSteps[0].objects[1].sort_order).toBe(1); // Object 3
      expect(updatedSteps[1].objects[0].sort_order).toBe(0); // Object 4
      expect(updatedSteps[1].objects[1].sort_order).toBe(1); // Object 2 (moved)
      expect(updatedSteps[1].objects[2].sort_order).toBe(2); // Object 5
    });

    it("should validate step_id consistency after moves", () => {
      const steps = createWorkflowTestScenario({
        numSteps: 3,
        objectsPerStep: 4,
      });

      // Perform multiple moves
      let updatedSteps = moveObjectBetweenSteps(steps, 1, 2);
      updatedSteps = moveObjectBetweenSteps(updatedSteps, 5, 3);
      updatedSteps = moveObjectBetweenSteps(updatedSteps, 9, 1);

      const validation = validateSortOrders(updatedSteps);
      expect(validation.valid).toBe(true);

      // Verify each object's step_id matches its actual step
      updatedSteps.forEach((step) => {
        step.objects.forEach((obj) => {
          expect(obj.step_id).toBe(step.id);
        });
      });
    });
  });

  describe("Priority-Based Scenarios", () => {
    it("should handle dragging objects with different priorities", () => {
      const step1 = createStepWithPriorityDistribution(1, {
        low: 2,
        medium: 2,
        high: 2,
        urgent: 1,
      });

      const step2 = createStepWithPriorityDistribution(2, {
        low: 1,
        medium: 1,
      });

      const steps = [step1, step2];

      (useWorkflow as ReturnType<typeof vi.fn>).mockReturnValue({
        workflow: mockWorkflow,
        createStep: mockCreateStep,
        updateWorkflow: mockUpdateWorkflow,
        steps,
        createRealObject: mockCreateRealObject,
        setSteps: mockSetSteps,
        moveObject: mockMoveObject,
        updateStep: mockUpdateStep,
      });

      render(<WorkflowPage />);

      expect(screen.getByText("Step 1")).toBeInTheDocument();
      expect(screen.getByText("Step 2")).toBeInTheDocument();

      // Step 1 should have 7 objects
      const step1Header = screen.getByText("Step 1").closest("div");
      expect(step1Header).toBeInTheDocument();

      // Find all priority dots
      const urgentDots = document.querySelectorAll(".bg-red-600");
      const highDots = document.querySelectorAll(".bg-red-500");
      const mediumDots = document.querySelectorAll(".bg-yellow-500");
      const lowDots = document.querySelectorAll(".bg-green-500");

      expect(urgentDots.length).toBe(1);
      expect(highDots.length).toBe(2);
      expect(mediumDots.length).toBe(3);
      expect(lowDots.length).toBe(3);
    });

    it("should maintain priority after drag operations", () => {
      const urgentObject = createMockObject(1, {
        step_id: 1,
        priority: "urgent",
      });

      const step1 = createMockStep(1, [urgentObject]);
      const step2 = createMockStep(2, []);
      const steps = [step1, step2];

      const updatedSteps = moveObjectBetweenSteps(steps, 1, 2);
      const movedObject = updatedSteps[1].objects[0];

      expect(movedObject.priority).toBe("urgent");
    });
  });

  describe("Performance Tests", () => {
    it("should handle large workflow efficiently", () => {
      const { result: largeSteps, duration } = measureDragPerformance(() =>
        createWorkflowTestScenario({
          numSteps: 10,
          objectsPerStep: 20,
        })
      );

      expect(largeSteps.length).toBe(10);
      expect(largeSteps.reduce((sum, step) => sum + step.objects.length, 0)).toBe(
        200
      );

      // Should create test data quickly (< 100ms)
      expect(duration).toBeLessThan(100);

      (useWorkflow as ReturnType<typeof vi.fn>).mockReturnValue({
        workflow: mockWorkflow,
        createStep: mockCreateStep,
        updateWorkflow: mockUpdateWorkflow,
        steps: largeSteps,
        createRealObject: mockCreateRealObject,
        setSteps: mockSetSteps,
        moveObject: mockMoveObject,
        updateStep: mockUpdateStep,
      });

      const { duration: renderDuration } = measureDragPerformance(() => {
        render(<WorkflowPage />);
      });

      // Rendering should be reasonably fast even with many objects
      expect(renderDuration).toBeLessThan(5000);
    });

    it("should efficiently reorder many objects", () => {
      const manyObjects = Array.from({ length: 100 }, (_, i) =>
        createMockObject(i + 1, { step_id: 1, sort_order: i })
      );

      const step = createMockStep(1, manyObjects);
      const steps = [step];

      const { result: reorderedSteps, duration } = measureDragPerformance(() =>
        reorderObjectsInStep(steps, 1, 0, 99)
      );

      // Should complete reorder quickly
      expect(duration).toBeLessThan(50);

      const validation = validateSortOrders(reorderedSteps);
      expect(validation.valid).toBe(true);
    });

    it("should efficiently move objects between steps with many objects", () => {
      const steps = createWorkflowTestScenario({
        numSteps: 5,
        objectsPerStep: 50,
      });

      const { result: updatedSteps, duration } = measureDragPerformance(() =>
        moveObjectBetweenSteps(steps, 1, 5, 25)
      );

      expect(duration).toBeLessThan(100);

      const validation = validateSortOrders(updatedSteps);
      expect(validation.valid).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle moving last object from a step", () => {
      const step1 = createMockStep(1, [createMockObject(1, { step_id: 1 })]);
      const step2 = createMockStep(2, []);
      const steps = [step1, step2];

      const updatedSteps = moveObjectBetweenSteps(steps, 1, 2);

      expect(updatedSteps[0].objects).toHaveLength(0);
      expect(updatedSteps[1].objects).toHaveLength(1);
      expect(updatedSteps[1].objects[0].id).toBe(1);
    });

    it("should handle moving to first position in step", () => {
      const step1 = createMockStep(1, [createMockObject(1, { step_id: 1 })]);
      const step2 = createMockStep(2, [
        createMockObject(2, { step_id: 2, sort_order: 0 }),
        createMockObject(3, { step_id: 2, sort_order: 1 }),
      ]);
      const steps = [step1, step2];

      const updatedSteps = moveObjectBetweenSteps(steps, 1, 2, 0);

      expect(verifyObjectOrder(updatedSteps[1], [1, 2, 3])).toBe(true);
    });

    it("should handle moving to last position in step", () => {
      const step1 = createMockStep(1, [createMockObject(1, { step_id: 1 })]);
      const step2 = createMockStep(2, [
        createMockObject(2, { step_id: 2, sort_order: 0 }),
        createMockObject(3, { step_id: 2, sort_order: 1 }),
      ]);
      const steps = [step1, step2];

      const updatedSteps = moveObjectBetweenSteps(steps, 1, 2);

      expect(verifyObjectOrder(updatedSteps[1], [2, 3, 1])).toBe(true);
    });

    it("should handle reordering first to last position", () => {
      const objects = Array.from({ length: 5 }, (_, i) =>
        createMockObject(i + 1, { step_id: 1, sort_order: i })
      );
      const step = createMockStep(1, objects);
      const steps = [step];

      const updatedSteps = reorderObjectsInStep(steps, 1, 0, 4);

      expect(verifyObjectOrder(updatedSteps[0], [2, 3, 4, 5, 1])).toBe(true);
    });

    it("should handle reordering last to first position", () => {
      const objects = Array.from({ length: 5 }, (_, i) =>
        createMockObject(i + 1, { step_id: 1, sort_order: i })
      );
      const step = createMockStep(1, objects);
      const steps = [step];

      const updatedSteps = reorderObjectsInStep(steps, 1, 4, 0);

      expect(verifyObjectOrder(updatedSteps[0], [5, 1, 2, 3, 4])).toBe(true);
    });

    it("should handle single object step", () => {
      const step = createMockStep(1, [createMockObject(1, { step_id: 1 })]);
      const steps = [step];

      (useWorkflow as ReturnType<typeof vi.fn>).mockReturnValue({
        workflow: mockWorkflow,
        createStep: mockCreateStep,
        updateWorkflow: mockUpdateWorkflow,
        steps,
        createRealObject: mockCreateRealObject,
        setSteps: mockSetSteps,
        moveObject: mockMoveObject,
        updateStep: mockUpdateStep,
      });

      render(<WorkflowPage />);

      expect(screen.getByText("Test Object 1")).toBeInTheDocument();
    });

    it("should handle empty workflow (no steps)", () => {
      (useWorkflow as ReturnType<typeof vi.fn>).mockReturnValue({
        workflow: mockWorkflow,
        createStep: mockCreateStep,
        updateWorkflow: mockUpdateWorkflow,
        steps: [],
        createRealObject: mockCreateRealObject,
        setSteps: mockSetSteps,
        moveObject: mockMoveObject,
        updateStep: mockUpdateStep,
      });

      render(<WorkflowPage />);

      expect(screen.getByText("Add another step")).toBeInTheDocument();
    });
  });

  describe("Utility Function Tests", () => {
    it("should correctly verify object order", () => {
      const objects = [
        createMockObject(5, { step_id: 1, sort_order: 0 }),
        createMockObject(3, { step_id: 1, sort_order: 1 }),
        createMockObject(7, { step_id: 1, sort_order: 2 }),
      ];
      const step = createMockStep(1, objects);

      expect(verifyObjectOrder(step, [5, 3, 7])).toBe(true);
      expect(verifyObjectOrder(step, [5, 7, 3])).toBe(false);
      expect(verifyObjectOrder(step, [5, 3])).toBe(false);
    });

    it("should validate sort orders correctly", () => {
      const validSteps = createWorkflowTestScenario({
        numSteps: 3,
        objectsPerStep: 5,
      });

      const validation = validateSortOrders(validSteps);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should detect invalid sort orders", () => {
      const step = createMockStep(1, [
        createMockObject(1, { step_id: 1, sort_order: 0 }),
        createMockObject(2, { step_id: 1, sort_order: 5 }), // Invalid
        createMockObject(3, { step_id: 1, sort_order: 2 }),
      ]);

      const validation = validateSortOrders([step]);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it("should detect mismatched step_id", () => {
      const step = createMockStep(1, [
        createMockObject(1, { step_id: 1, sort_order: 0 }),
        createMockObject(2, { step_id: 2, sort_order: 1 }), // Wrong step_id
      ]);

      const validation = validateSortOrders([step]);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain(
        "Object 2 has step_id 2, but is in step 1"
      );
    });
  });
});
