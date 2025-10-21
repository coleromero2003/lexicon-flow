import { act, renderHook, waitFor } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("../../supabase/SupabaseProvider", () => ({
  useSupabase: vi.fn(),
}));

vi.mock("../../services", () => ({
  objectFileService: {
    getFilesForObject: vi.fn(),
    linkFileToObject: vi.fn(),
  },
}));

import { useObjectFiles } from "../useObjectFiles";
import type { FileMeta } from "../../supabase/models";
import { useSupabase } from "../../supabase/SupabaseProvider";
import { objectFileService } from "../../services";

const mockUseSupabase = vi.mocked(useSupabase);
const mockObjectFileService = vi.mocked(objectFileService);

function createFileMeta(id: number): FileMeta {
  return {
    id,
    created_at: "2024-01-01T00:00:00.000Z",
    uploaded_by: "user",
    org_id: "org",
    project_id: 123,
    storage_key: `file-${id}`,
    filename: `file-${id}.txt`,
    mime_type: "text/plain",
    size_bytes: 10,
    sha256: `hash-${id}`,
  };
}

function createSupabaseMock() {
  const eqMock = vi.fn<[string, number], { eq: any; error: Error | null }>();
  eqMock.mockImplementation(() => ({
    eq: eqMock,
    error: null,
  }));
  const deleteMock = vi.fn(() => ({ eq: eqMock }));
  const fromMock = vi.fn(() => ({ delete: deleteMock }));

  return {
    supabase: { from: fromMock } as unknown,
    fromMock,
    deleteMock,
    eqMock,
  };
}

describe("useObjectFiles", () => {
  const objectId = 42;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads files on mount and updates state", async () => {
    const supabaseMock = createSupabaseMock();
    mockUseSupabase.mockReturnValue({
      supabase: supabaseMock.supabase as any,
      isLoaded: true,
    });

    const initialFiles = [createFileMeta(1), createFileMeta(2)];
    mockObjectFileService.getFilesForObject.mockResolvedValueOnce(initialFiles);

    const { result } = renderHook(() => useObjectFiles(objectId));

    await waitFor(() =>
      expect(mockObjectFileService.getFilesForObject).toHaveBeenCalledWith(
        supabaseMock.supabase,
        objectId
      )
    );

    await waitFor(() => expect(result.current.files).toEqual(initialFiles));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets error state when initial load fails", async () => {
    const supabaseMock = createSupabaseMock();
    mockUseSupabase.mockReturnValue({
      supabase: supabaseMock.supabase as any,
      isLoaded: true,
    });

    mockObjectFileService.getFilesForObject.mockRejectedValueOnce(
      new Error("Load failed")
    );

    const { result } = renderHook(() => useObjectFiles(objectId));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Load failed");
    expect(result.current.files).toEqual([]);
  });

  it("links a file and reloads object files", async () => {
    const supabaseMock = createSupabaseMock();
    mockUseSupabase.mockReturnValue({
      supabase: supabaseMock.supabase as any,
      isLoaded: true,
    });

    const initialFiles = [createFileMeta(1)];
    const updatedFiles = [...initialFiles, createFileMeta(3)];

    mockObjectFileService.getFilesForObject
      .mockResolvedValueOnce(initialFiles)
      .mockResolvedValueOnce(updatedFiles);
    mockObjectFileService.linkFileToObject.mockResolvedValueOnce();

    const { result } = renderHook(() => useObjectFiles(objectId));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.linkFile(3);
    });

    expect(mockObjectFileService.linkFileToObject).toHaveBeenCalledWith(
      supabaseMock.supabase,
      {
        object_id: objectId,
        file_id: 3,
      }
    );
    expect(mockObjectFileService.getFilesForObject).toHaveBeenCalledTimes(2);
    expect(result.current.files).toEqual(updatedFiles);
    expect(result.current.error).toBeNull();
  });

  it("sets error state and rethrows when linkFile fails", async () => {
    const supabaseMock = createSupabaseMock();
    mockUseSupabase.mockReturnValue({
      supabase: supabaseMock.supabase as any,
      isLoaded: true,
    });

    const initialFiles = [createFileMeta(1)];
    mockObjectFileService.getFilesForObject.mockResolvedValueOnce(initialFiles);
    mockObjectFileService.linkFileToObject.mockRejectedValueOnce(
      new Error("Link failed")
    );

    const { result } = renderHook(() => useObjectFiles(objectId));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await expect(result.current.linkFile(2)).rejects.toThrow("Link failed");
    });

    await waitFor(() => expect(result.current.error).toBe("Link failed"));
    expect(mockObjectFileService.getFilesForObject).toHaveBeenCalledTimes(1);
  });

  it("unlinks a file using Supabase delete filters and updates state", async () => {
    const supabaseMock = createSupabaseMock();
    mockUseSupabase.mockReturnValue({
      supabase: supabaseMock.supabase as any,
      isLoaded: true,
    });

    const initialFiles = [createFileMeta(1)];
    mockObjectFileService.getFilesForObject.mockResolvedValueOnce(initialFiles);

    const { result } = renderHook(() => useObjectFiles(objectId));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.unlinkFile(1);
    });

    expect(supabaseMock.fromMock).toHaveBeenCalledWith("object_files");
    expect(supabaseMock.deleteMock).toHaveBeenCalled();
    expect(supabaseMock.eqMock).toHaveBeenNthCalledWith(1, "object_id", objectId);
    expect(supabaseMock.eqMock).toHaveBeenNthCalledWith(2, "file_id", 1);
    expect(result.current.files).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("sets error state and rethrows when unlinkFile fails", async () => {
    const supabaseMock = createSupabaseMock();
    mockUseSupabase.mockReturnValue({
      supabase: supabaseMock.supabase as any,
      isLoaded: true,
    });

    const initialFiles = [createFileMeta(1)];
    mockObjectFileService.getFilesForObject.mockResolvedValueOnce(initialFiles);

    const deleteError = new Error("Delete failed");
    supabaseMock.eqMock.mockImplementationOnce(() => ({
      eq: supabaseMock.eqMock,
      error: null,
    }));
    supabaseMock.eqMock.mockImplementationOnce(() => ({
      eq: supabaseMock.eqMock,
      error: deleteError,
    }));

    const { result } = renderHook(() => useObjectFiles(objectId));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await expect(result.current.unlinkFile(1)).rejects.toThrow("Delete failed");
    });

    await waitFor(() => expect(result.current.error).toBe("Delete failed"));
    expect(result.current.files).toEqual(initialFiles);
  });
});
