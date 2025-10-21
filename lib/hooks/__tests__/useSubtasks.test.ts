import { renderHook, act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSubtasks } from "../useSubtasks";

const hoistedMocks = vi.hoisted(() => ({
  useSupabaseMock: vi.fn(),
  getSubtasksByObject: vi.fn(),
  createSubtaskMock: vi.fn(),
  updateSubtaskMock: vi.fn(),
}));

vi.mock("../../supabase/SupabaseProvider", () => ({
  useSupabase: hoistedMocks.useSupabaseMock,
}));

vi.mock("../../services", () => ({
  objectSubtaskService: {
    getSubtasksByObject: hoistedMocks.getSubtasksByObject,
    createSubtask: hoistedMocks.createSubtaskMock,
    updateSubtask: hoistedMocks.updateSubtaskMock,
  },
}));

const {
  useSupabaseMock,
  getSubtasksByObject,
  createSubtaskMock,
  updateSubtaskMock,
} = hoistedMocks;

describe("useSubtasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads subtasks on mount", async () => {
    const supabaseStub = {} as any;
    const subtasks = [
      { id: 1, object_id: 123, title: "Initial", is_done: false, sort_order: 0 },
    ];
    useSupabaseMock.mockReturnValue({ supabase: supabaseStub });
    getSubtasksByObject.mockResolvedValue(subtasks);

    const { result } = renderHook(() => useSubtasks(123));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.subtasks).toEqual(subtasks);
    expect(getSubtasksByObject).toHaveBeenCalledWith(supabaseStub, 123);
  });

  it("creates subtasks with incremented sort order", async () => {
    const supabaseStub = {} as any;
    const initialSubtasks = [
      { id: 1, object_id: 5, title: "Existing", is_done: false, sort_order: 1 },
    ];
    const createdSubtask = {
      id: 2,
      object_id: 5,
      title: "New",
      is_done: false,
      sort_order: 2,
    };

    useSupabaseMock.mockReturnValue({ supabase: supabaseStub });
    getSubtasksByObject.mockResolvedValue(initialSubtasks);
    createSubtaskMock.mockResolvedValue(createdSubtask);

    const { result } = renderHook(() => useSubtasks(5));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      const response = await result.current.createSubtask("New");
      expect(response).toEqual(createdSubtask);
    });

    expect(createSubtaskMock).toHaveBeenCalledWith(
      supabaseStub,
      expect.objectContaining({
        object_id: 5,
        title: "New",
        sort_order: 2,
      })
    );
    expect(result.current.subtasks).toEqual([...initialSubtasks, createdSubtask]);
  });

  it("updates an existing subtask", async () => {
    const supabaseStub = {} as any;
    const initialSubtasks = [
      { id: 1, object_id: 9, title: "Initial", is_done: false, sort_order: 0 },
    ];
    const updatedSubtask = {
      id: 1,
      object_id: 9,
      title: "Updated",
      is_done: true,
      sort_order: 0,
    };

    useSupabaseMock.mockReturnValue({ supabase: supabaseStub });
    getSubtasksByObject.mockResolvedValue(initialSubtasks);
    updateSubtaskMock.mockResolvedValue(updatedSubtask);

    const { result } = renderHook(() => useSubtasks(9));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      const response = await result.current.updateSubtask(1, {
        title: "Updated",
        is_done: true,
      });
      expect(response).toEqual(updatedSubtask);
    });

    expect(updateSubtaskMock).toHaveBeenCalledWith(supabaseStub, 1, {
      title: "Updated",
      is_done: true,
    });
    expect(result.current.subtasks).toEqual([updatedSubtask]);
  });

  it("toggles a subtask", async () => {
    const supabaseStub = {} as any;
    const initialSubtasks = [
      { id: 1, object_id: 3, title: "Toggle", is_done: false, sort_order: 0 },
    ];
    const toggled = { ...initialSubtasks[0], is_done: true };

    useSupabaseMock.mockReturnValue({ supabase: supabaseStub });
    getSubtasksByObject.mockResolvedValue(initialSubtasks);
    updateSubtaskMock.mockResolvedValue(toggled);

    const { result } = renderHook(() => useSubtasks(3));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.toggleSubtask(1, true);
    });

    expect(updateSubtaskMock).toHaveBeenCalledWith(supabaseStub, 1, {
      is_done: true,
    });
    expect(result.current.subtasks).toEqual([toggled]);
  });

  it("deletes a subtask and calls supabase delete", async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const deleteMock = vi.fn().mockReturnValue({ eq: eqMock });
    const fromMock = vi.fn().mockReturnValue({ delete: deleteMock });
    const supabaseStub = { from: fromMock } as any;

    const initialSubtasks = [
      { id: 1, object_id: 4, title: "Delete", is_done: false, sort_order: 0 },
      { id: 2, object_id: 4, title: "Keep", is_done: false, sort_order: 1 },
    ];

    useSupabaseMock.mockReturnValue({ supabase: supabaseStub });
    getSubtasksByObject.mockResolvedValue(initialSubtasks);

    const { result } = renderHook(() => useSubtasks(4));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteSubtask(1);
    });

    expect(fromMock).toHaveBeenCalledWith("object_subtasks");
    expect(deleteMock).toHaveBeenCalled();
    expect(eqMock).toHaveBeenCalledWith("id", 1);
    expect(result.current.subtasks).toEqual([initialSubtasks[1]]);
  });

  it("reorders subtasks and persists sort order", async () => {
    const supabaseStub = {} as any;
    const initialSubtasks = [
      { id: 1, object_id: 8, title: "First", is_done: false, sort_order: 0 },
      { id: 2, object_id: 8, title: "Second", is_done: false, sort_order: 1 },
    ];
    const reordered = [
      { ...initialSubtasks[1], sort_order: 0 },
      { ...initialSubtasks[0], sort_order: 1 },
    ];

    useSupabaseMock.mockReturnValue({ supabase: supabaseStub });
    getSubtasksByObject.mockResolvedValue(initialSubtasks);
    updateSubtaskMock.mockResolvedValue(null);

    const { result } = renderHook(() => useSubtasks(8));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.reorderSubtasks(reordered);
    });

    expect(updateSubtaskMock).toHaveBeenNthCalledWith(1, supabaseStub, 2, {
      sort_order: 0,
    });
    expect(updateSubtaskMock).toHaveBeenNthCalledWith(2, supabaseStub, 1, {
      sort_order: 1,
    });
    expect(result.current.subtasks).toEqual(reordered);
  });
});
