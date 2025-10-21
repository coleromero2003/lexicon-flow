import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@clerk/nextjs", () => ({
  useOrganization: vi.fn(),
}));

vi.mock("../../supabase/SupabaseProvider", () => ({
  useSupabase: vi.fn(),
}));

vi.mock("../../services", () => ({
  workflowService: {
    getWorkflowsByProject: vi.fn(),
    createWorkflow: vi.fn(),
    getWorkflow: vi.fn(),
    updateWorkflow: vi.fn(),
  },
  stepService: {
    getStepsByWorkflow: vi.fn(),
    createStep: vi.fn(),
    updateStepTitle: vi.fn(),
  },
  objectService: {
    getObjectsByWorkflow: vi.fn(),
    createObject: vi.fn(),
    moveObject: vi.fn(),
  },
}));

import { useOrganization } from "@clerk/nextjs";
import { useSupabase } from "../../supabase/SupabaseProvider";
import { workflowService, stepService, objectService } from "../../services";
import { useWorkflow, useWorkflows } from "../useWorkflows";
import type { Workflow, Step, ScadaObject } from "../../supabase/models";

const mockedUseOrganization = vi.mocked(useOrganization);
const mockedUseSupabase = vi.mocked(useSupabase);

const mockWorkflowService = vi.mocked(workflowService);
const mockStepService = vi.mocked(stepService);
const mockObjectService = vi.mocked(objectService);

const supabaseClient = {} as any;
const organization = { id: "org_123" } as any;

describe("useWorkflows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseOrganization.mockReturnValue({ organization });
    mockedUseSupabase.mockReturnValue({ supabase: supabaseClient, isLoaded: true });
  });

  it("fetches workflows and updates state", async () => {
    const projectId = 42;
    const workflows: Workflow[] = [
      {
        id: 1,
        created_at: "2024-01-01",
        updated_at: "2024-01-02",
        project_id: projectId,
        name: "Initial",
        description: null,
        color: "#fff",
      },
    ];

    mockWorkflowService.getWorkflowsByProject.mockResolvedValueOnce(workflows);

    const { result } = renderHook(() => useWorkflows(projectId));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockWorkflowService.getWorkflowsByProject).toHaveBeenCalledWith(
      supabaseClient,
      projectId
    );
    expect(result.current.workflows).toEqual(workflows);
    expect(result.current.error).toBeNull();
  });

  it("handles workflow loading errors", async () => {
    const projectId = 7;
    const error = new Error("Network down");
    mockWorkflowService.getWorkflowsByProject.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useWorkflows(projectId));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Network down");
    expect(result.current.workflows).toEqual([]);
  });

  it("creates a workflow, generates default steps, and prepends to state", async () => {
    const projectId = 99;
    const initialWorkflows: Workflow[] = [
      {
        id: 2,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
        project_id: projectId,
        name: "Existing",
        description: null,
        color: "#000000",
      },
    ];

    const createdWorkflow: Workflow = {
      id: 3,
      created_at: "2024-02-01",
      updated_at: "2024-02-01",
      project_id: projectId,
      name: "New Workflow",
      description: null,
      color: "#3b82f6",
    };

    mockWorkflowService.getWorkflowsByProject.mockResolvedValueOnce(initialWorkflows);
    mockWorkflowService.createWorkflow.mockResolvedValueOnce(createdWorkflow);
    mockStepService.createStep.mockImplementation(async (_supabase, payload) => ({
      id: payload.position + 10,
      created_at: "2024-02-01",
      workflow_id: createdWorkflow.id,
      title: payload.title,
      position: payload.position,
    } as Step));

    const { result } = renderHook(() => useWorkflows(projectId));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createWorkflow({ name: "New Workflow" });
    });

    expect(mockWorkflowService.createWorkflow).toHaveBeenCalledWith(
      supabaseClient,
      {
        name: "New Workflow",
        description: null,
        color: "#3b82f6",
        project_id: projectId,
      }
    );

    expect(mockStepService.createStep).toHaveBeenCalledTimes(4);
    expect(mockStepService.createStep).toHaveBeenNthCalledWith(
      1,
      supabaseClient,
      expect.objectContaining({ title: "To Do", position: 0, workflow_id: createdWorkflow.id })
    );
    expect(mockStepService.createStep).toHaveBeenNthCalledWith(
      2,
      supabaseClient,
      expect.objectContaining({ title: "Working On", position: 1, workflow_id: createdWorkflow.id })
    );
    expect(mockStepService.createStep).toHaveBeenNthCalledWith(
      3,
      supabaseClient,
      expect.objectContaining({ title: "Review", position: 2, workflow_id: createdWorkflow.id })
    );
    expect(mockStepService.createStep).toHaveBeenNthCalledWith(
      4,
      supabaseClient,
      expect.objectContaining({ title: "Complete", position: 3, workflow_id: createdWorkflow.id })
    );

    const createCallOrder = mockWorkflowService.createWorkflow.mock.invocationCallOrder[0];
    const firstStepCallOrder = mockStepService.createStep.mock.invocationCallOrder[0];
    expect(createCallOrder).toBeLessThan(firstStepCallOrder);

    expect(result.current.workflows[0]).toEqual(createdWorkflow);
  });

  it("surfaces errors from createWorkflow", async () => {
    const projectId = 5;
    mockWorkflowService.getWorkflowsByProject.mockResolvedValueOnce([]);
    const error = new Error("create failed");
    mockWorkflowService.createWorkflow.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useWorkflows(projectId));

    await waitFor(() => expect(result.current.loading).toBe(false));

    let thrown: unknown;
    await act(async () => {
      try {
        await result.current.createWorkflow({ name: "Bad" });
      } catch (err) {
        thrown = err;
      }
    });

    expect(thrown).toBe(error);
    expect(result.current.error).toBe("create failed");
  });
});

describe("useWorkflow", () => {
  const workflowId = 12;
  const workflow: Workflow = {
    id: workflowId,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    project_id: 55,
    name: "Testing",
    description: null,
    color: "#123456",
  };
  const steps: Step[] = [
    {
      id: 1,
      created_at: "2024-01-01",
      workflow_id: workflowId,
      title: "To Do",
      position: 0,
    },
    {
      id: 2,
      created_at: "2024-01-01",
      workflow_id: workflowId,
      title: "In Progress",
      position: 1,
    },
  ];
  const objects: ScadaObject[] = [
    {
      id: 100,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      project_id: workflow.project_id,
      workflow_id: [workflowId],
      step_id: [1],
      title: "Design",
      description_md: null,
      assignee: null,
      due_date: null,
      priority: "medium",
      sort_order: 0,
      metadata: null,
    },
    {
      id: 101,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      project_id: workflow.project_id,
      workflow_id: [workflowId],
      step_id: [2],
      title: "Build",
      description_md: null,
      assignee: null,
      due_date: null,
      priority: "medium",
      sort_order: 0,
      metadata: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseOrganization.mockReturnValue({ organization });
    mockedUseSupabase.mockReturnValue({ supabase: supabaseClient, isLoaded: true });
    mockWorkflowService.getWorkflow.mockResolvedValue(workflow);
    mockStepService.getStepsByWorkflow.mockResolvedValue(steps);
    mockObjectService.getObjectsByWorkflow.mockResolvedValue(objects);
  });

  it("loads workflow data and manages step/object mutations", async () => {
    const { result } = renderHook(() => useWorkflow(workflowId));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockWorkflowService.getWorkflow).toHaveBeenCalledWith(
      supabaseClient,
      workflowId
    );
    expect(mockStepService.getStepsByWorkflow).toHaveBeenCalledWith(
      supabaseClient,
      workflowId
    );
    expect(mockObjectService.getObjectsByWorkflow).toHaveBeenCalledWith(
      supabaseClient,
      workflowId
    );

    expect(result.current.steps).toHaveLength(2);
    expect(result.current.steps[0].objects.map((obj) => obj.id)).toEqual([100]);
    expect(result.current.steps[1].objects.map((obj) => obj.id)).toEqual([101]);

    const newObject: ScadaObject = {
      id: 102,
      created_at: "2024-01-02",
      updated_at: "2024-01-02",
      project_id: workflow.project_id,
      workflow_id: [workflowId],
      step_id: [1],
      title: "Test",
      description_md: null,
      assignee: null,
      due_date: null,
      priority: "high",
      sort_order: 1,
      metadata: null,
    };
    mockObjectService.createObject.mockResolvedValueOnce(newObject);

    await act(async () => {
      await result.current.createRealObject(1, { title: "Test", priority: "high" });
    });

    expect(result.current.steps[0].objects.map((obj) => obj.id)).toEqual([100, 102]);

    mockObjectService.moveObject.mockResolvedValueOnce(undefined as any);
    await act(async () => {
      await result.current.moveObject(102, 2, 0);
    });

    expect(result.current.steps[0].objects.map((obj) => obj.id)).toEqual([100]);
    expect(result.current.steps[1].objects.map((obj) => obj.id)).toEqual([102, 101]);

    const createdStep: Step = {
      id: 3,
      created_at: "2024-01-03",
      workflow_id: workflowId,
      title: "Review",
      position: 2,
    };
    mockStepService.createStep.mockResolvedValueOnce(createdStep);

    await act(async () => {
      await result.current.createStep("Review");
    });

    expect(result.current.steps).toHaveLength(3);
    expect(result.current.steps[2]).toMatchObject({ ...createdStep, objects: [] });

    const updatedStep: Step = { ...steps[1], title: "In QA" };
    mockStepService.updateStepTitle.mockResolvedValueOnce(updatedStep);

    await act(async () => {
      await result.current.updateStep(2, "In QA");
    });

    const stepTitles = result.current.steps.map((step) => step.title);
    expect(stepTitles).toEqual(["To Do", "In QA", "Review"]);
    expect(result.current.error).toBeNull();
  });

  it.each([
    {
      name: "createRealObject",
      action: async (hook: ReturnType<typeof renderHook>) => {
        mockObjectService.createObject.mockRejectedValueOnce(new Error("obj err"));
        await hook.result.current.createRealObject(1, { title: "Bad" });
      },
      expectedError: "obj err",
    },
    {
      name: "moveObject",
      action: async (hook: ReturnType<typeof renderHook>) => {
        mockObjectService.moveObject.mockRejectedValueOnce(new Error("move err"));
        await hook.result.current.moveObject(100, 2, 0);
      },
      expectedError: "move err",
    },
    {
      name: "createStep",
      action: async (hook: ReturnType<typeof renderHook>) => {
        mockStepService.createStep.mockRejectedValueOnce(new Error("step err"));
        await hook.result.current.createStep("Broken");
      },
      expectedError: "step err",
    },
    {
      name: "updateStep",
      action: async (hook: ReturnType<typeof renderHook>) => {
        mockStepService.updateStepTitle.mockRejectedValueOnce(new Error("update err"));
        await hook.result.current.updateStep(1, "Oops");
      },
      expectedError: "update err",
    },
  ])("sets error message when %s fails", async ({ action, expectedError }) => {
    const hook = renderHook(() => useWorkflow(workflowId));
    await waitFor(() => expect(hook.result.current.loading).toBe(false));

    await act(async () => {
      await action(hook);
    });

    await waitFor(() => expect(hook.result.current.error).toBe(expectedError));
  });
});
