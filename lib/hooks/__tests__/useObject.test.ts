import { act, renderHook, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import type {
  FileMeta,
  LexiconItem,
  ObjectFileLink,
  ObjectLexiconLink,
  ObjectRelation,
  ObjectSubtask,
  ScadaObject,
  Step,
  Workflow,
} from "@/lib/supabase/models";

const {
  mockUseSupabase,
  mockUseOrganization,
  mockObjectService,
  mockWorkflowService,
  mockStepService,
  mockObjectRelationService,
  mockObjectSubtaskService,
  mockObjectFileService,
  mockFileService,
  mockObjectLexiconService,
  mockLexiconService,
} = vi.hoisted(() => {
  const mockUseSupabase = vi.fn();
  const mockUseOrganization = vi.fn();
  const mockObjectService = {
    getObject: vi.fn(),
    updateObject: vi.fn(),
  };
  const mockWorkflowService = {
    getWorkflow: vi.fn(),
  };
  const mockStepService = {
    getStep: vi.fn(),
  };
  const mockObjectRelationService = {
    getRelationsByObject: vi.fn(),
  };
  const mockObjectSubtaskService = {
    getSubtasksByObject: vi.fn(),
    updateSubtask: vi.fn(),
  };
  const mockObjectFileService = {
    getFilesByObject: vi.fn(),
  };
  const mockFileService = {
    getFile: vi.fn(),
  };
  const mockObjectLexiconService = {
    getLexiconByObject: vi.fn(),
  };
  const mockLexiconService = {
    getLexiconItem: vi.fn(),
  };

  return {
    mockUseSupabase,
    mockUseOrganization,
    mockObjectService,
    mockWorkflowService,
    mockStepService,
    mockObjectRelationService,
    mockObjectSubtaskService,
    mockObjectFileService,
    mockFileService,
    mockObjectLexiconService,
    mockLexiconService,
  };
});

vi.mock("@/lib/supabase/SupabaseProvider", () => ({
  useSupabase: () => mockUseSupabase(),
}));

vi.mock("@clerk/nextjs", () => ({
  useOrganization: () => mockUseOrganization(),
}));

vi.mock("@/lib/services", () => ({
  objectService: mockObjectService,
  workflowService: mockWorkflowService,
  stepService: mockStepService,
  objectRelationService: mockObjectRelationService,
  objectSubtaskService: mockObjectSubtaskService,
  objectFileService: mockObjectFileService,
  objectLexiconService: mockObjectLexiconService,
  fileService: mockFileService,
  lexiconService: mockLexiconService,
}));

import { useObject } from "@/lib/hooks/useObjects";

describe("useObject", () => {
  const mockSupabase = { key: "supabase" } as const;

  beforeEach(() => {
    vi.resetAllMocks();
    mockUseSupabase.mockReturnValue({ supabase: mockSupabase });
    mockUseOrganization.mockReturnValue({ organization: { id: "org_123" } });
  });

  function createBaseObject(overrides: Partial<ScadaObject> = {}): ScadaObject {
    return {
      id: 1,
      created_at: "2024-01-01",
      updated_at: "2024-01-02",
      project_id: 99,
      workflow_id: [],
      step_id: [],
      title: "Base Object",
      description_md: null,
      assignee: "user_1",
      due_date: null,
      priority: "high",
      sort_order: 1,
      metadata: {},
      ...overrides,
    };
  }

  test("loadObject combines all related data into ObjectWithAllDetails", async () => {
    const baseObject = createBaseObject({
      workflow_id: [101, 102],
      step_id: [201, null],
    });
    const workflowOne: Workflow = {
      id: 101,
      created_at: "2024-01-01",
      updated_at: "2024-01-02",
      project_id: 99,
      name: "Workflow A",
      description: null,
      color: "red",
    };
    const workflowTwo: Workflow = {
      id: 102,
      created_at: "2024-01-01",
      updated_at: "2024-01-02",
      project_id: 99,
      name: "Workflow B",
      description: null,
      color: "blue",
    };
    const stepOne: Step = {
      id: 201,
      created_at: "2024-01-01",
      workflow_id: 101,
      title: "Step A",
      position: 1,
    };
    const relations: ObjectRelation[] = [
      {
        id: 500,
        created_at: "2024-01-01",
        relation_kind: "contains",
        src_object_id: 1,
        dst_object_id: 2,
      },
    ];
    const relatedObject = createBaseObject({ id: 2, title: "Related" });
    const subtasks: ObjectSubtask[] = [
      {
        id: 700,
        object_id: 1,
        title: "Subtask",
        is_done: false,
        sort_order: 1,
      },
    ];
    const fileLinks: ObjectFileLink[] = [
      {
        object_id: 1,
        file_id: 900,
      },
    ];
    const file: FileMeta = {
      id: 900,
      created_at: "2024-01-01",
      uploaded_by: null,
      org_id: "org_123",
      project_id: 99,
      storage_key: "file-key",
      filename: "diagram.pdf",
      mime_type: "application/pdf",
      size_bytes: 1234,
      sha256: "hash",
    };
    const lexiconLinks: ObjectLexiconLink[] = [
      {
        object_id: 1,
        lexicon_id: 300,
        note: "See component",
      },
    ];
    const lexiconItem: LexiconItem = {
      id: 300,
      created_at: "2024-01-01",
      updated_at: "2024-01-02",
      org_id: "org_123",
      type: "part",
      name: "Component",
      sku: "SKU-1",
      manufacturer: "Maker",
      attributes: { material: "steel" },
      version: 1,
    };

    mockObjectService.getObject
      .mockResolvedValueOnce(baseObject)
      .mockResolvedValueOnce(relatedObject);
    mockWorkflowService.getWorkflow
      .mockResolvedValueOnce(workflowOne)
      .mockResolvedValueOnce(workflowTwo);
    mockStepService.getStep.mockResolvedValueOnce(stepOne);
    mockObjectRelationService.getRelationsByObject.mockResolvedValueOnce(
      relations
    );
    mockObjectSubtaskService.getSubtasksByObject.mockResolvedValueOnce(
      subtasks
    );
    mockObjectFileService.getFilesByObject.mockResolvedValueOnce(fileLinks);
    mockFileService.getFile.mockResolvedValueOnce(file);
    mockObjectLexiconService.getLexiconByObject.mockResolvedValueOnce(
      lexiconLinks
    );
    mockLexiconService.getLexiconItem.mockResolvedValueOnce(lexiconItem);

    const { result } = renderHook(() => useObject(1));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockObjectService.getObject).toHaveBeenNthCalledWith(1, mockSupabase, 1);
    expect(mockObjectRelationService.getRelationsByObject).toHaveBeenCalledWith(
      mockSupabase,
      1
    );

    expect(result.current.object).toEqual({
      ...baseObject,
      workflows: [
        { workflow: workflowOne, step: stepOne },
        { workflow: workflowTwo, step: null },
      ],
      relations: [
        {
          relation: relations[0],
          relatedObject,
        },
      ],
      subtasks,
      files: [file],
      lexiconLinks: [
        {
          link: lexiconLinks[0],
          lexiconItem,
        },
      ],
    });
  });

  test("updateObject calls service, reloads state, and surfaces errors", async () => {
    const baseObject = createBaseObject({ workflow_id: null, step_id: null });
    const updatedObject = { ...baseObject, title: "Updated" };

    mockObjectService.getObject
      .mockResolvedValueOnce(baseObject)
      .mockResolvedValueOnce(updatedObject);
    mockObjectRelationService.getRelationsByObject.mockResolvedValue([]);
    mockObjectSubtaskService.getSubtasksByObject.mockResolvedValue([]);
    mockObjectFileService.getFilesByObject.mockResolvedValue([]);
    mockObjectLexiconService.getLexiconByObject.mockResolvedValue([]);
    mockObjectService.updateObject.mockResolvedValue(updatedObject);

    const { result } = renderHook(() => useObject(1));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateObject({ title: "Updated" });
    });

    expect(mockObjectService.updateObject).toHaveBeenCalledWith(
      mockSupabase,
      1,
      { title: "Updated" }
    );
    await waitFor(() => expect(result.current.object?.title).toBe("Updated"));

    const error = new Error("Failed");
    mockObjectService.updateObject.mockRejectedValueOnce(error);

    await act(async () => {
      await expect(
        result.current.updateObject({ title: "Again" })
      ).rejects.toThrow(error);
    });
    await waitFor(() => expect(result.current.error).toBe("Failed"));
  });

  test("toggleSubtask updates subtask state and propagates errors", async () => {
    const baseObject = createBaseObject({ workflow_id: null, step_id: null });
    const subtasks: ObjectSubtask[] = [
      {
        id: 42,
        object_id: 1,
        title: "Check wiring",
        is_done: false,
        sort_order: 1,
      },
    ];

    mockObjectService.getObject.mockResolvedValueOnce(baseObject);
    mockObjectRelationService.getRelationsByObject.mockResolvedValue([]);
    mockObjectSubtaskService.getSubtasksByObject.mockResolvedValueOnce(subtasks);
    mockObjectFileService.getFilesByObject.mockResolvedValue([]);
    mockObjectLexiconService.getLexiconByObject.mockResolvedValue([]);
    mockObjectSubtaskService.updateSubtask.mockResolvedValue(undefined);

    const { result } = renderHook(() => useObject(1));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.toggleSubtask(42, true);
    });

    expect(mockObjectSubtaskService.updateSubtask).toHaveBeenCalledWith(
      mockSupabase,
      42,
      { is_done: true }
    );
    expect(result.current.object?.subtasks).toEqual([
      { ...subtasks[0], is_done: true },
    ]);

    const error = new Error("subtask error");
    mockObjectSubtaskService.updateSubtask.mockRejectedValueOnce(error);

    await act(async () => {
      await expect(
        result.current.toggleSubtask(42, false)
      ).rejects.toThrow(error);
    });
    await waitFor(() => expect(result.current.error).toBe("subtask error"));
  });
});
