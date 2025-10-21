import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../supabase/SupabaseProvider", () => ({
  useSupabase: vi.fn(),
}));

vi.mock("@clerk/nextjs", () => ({
  useOrganization: vi.fn(),
  useUser: vi.fn(),
}));

vi.mock("../../services", () => ({
  fileService: {
    uploadFileMeta: vi.fn(),
  },
  objectFileService: {
    linkFileToObject: vi.fn(),
  },
  lexiconFileService: {
    linkFileToLexicon: vi.fn(),
  },
}));

import { useFileUpload } from "../useFileUpload";
import { useSupabase } from "../../supabase/SupabaseProvider";
import { useOrganization, useUser } from "@clerk/nextjs";
import {
  fileService,
  lexiconFileService,
  objectFileService,
} from "../../services";
import type { FileMeta } from "../../supabase/models";

const mockUseSupabase = vi.mocked(useSupabase);
const mockUseOrganization = vi.mocked(useOrganization);
const mockUseUser = vi.mocked(useUser);
const mockFileService = vi.mocked(fileService);
const mockObjectFileService = vi.mocked(objectFileService);
const mockLexiconFileService = vi.mocked(lexiconFileService);

function createSupabaseMock() {
  const uploadMock = vi.fn().mockResolvedValue({ data: null, error: null });
  const fromMock = vi.fn(() => ({ upload: uploadMock }));

  return {
    supabase: {
      storage: {
        from: fromMock,
      },
    } as any,
    uploadMock,
    fromMock,
  };
}

function createFileMeta(overrides: Partial<FileMeta> = {}): FileMeta {
  return {
    id: 99,
    created_at: "2024-01-01T00:00:00.000Z",
    uploaded_by: "user-1",
    org_id: "org_123",
    project_id: overrides.project_id ?? 10,
    storage_key: overrides.storage_key ?? "acme/project/object/file.pdf",
    filename: overrides.filename ?? "file.pdf",
    mime_type: overrides.mime_type ?? "application/pdf",
    size_bytes: overrides.size_bytes ?? 2048,
    sha256: overrides.sha256 ?? null,
    ...overrides,
  };
}

describe("useFileUpload", () => {
  const defaultOrganization = {
    organization: {
      id: "org_123",
      slug: "acme-inc",
    },
    isLoaded: true,
  };

  const defaultUser = {
    user: {
      id: "user-1",
    },
    isLoaded: true,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET = "test-files";

    mockUseOrganization.mockReturnValue(defaultOrganization as any);
    mockUseUser.mockReturnValue(defaultUser as any);
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET;
  });

  it("uploads an object file and links it to the object", async () => {
    const supabaseMock = createSupabaseMock();
    mockUseSupabase.mockReturnValue({
      supabase: supabaseMock.supabase,
      isLoaded: true,
    });

    const fileMeta = createFileMeta({
      storage_key: "acme-inc/project-1/object-2/test-file.pdf",
      project_id: 1,
      filename: "test-file.pdf",
    });

    mockFileService.uploadFileMeta.mockResolvedValue(fileMeta);
    mockObjectFileService.linkFileToObject.mockResolvedValue();

    const testFile = new File(["dummy"], "test file.pdf", {
      type: "application/pdf",
    });

    const { result } = renderHook(() => useFileUpload());

    await act(async () => {
      const created = await result.current.uploadObjectFile({
        file: testFile,
        projectId: 1,
        objectId: 2,
        projectSlug: "Project 1",
        objectSlug: "Object 2",
      });

      expect(created).toEqual(fileMeta);
    });

    expect(supabaseMock.fromMock).toHaveBeenCalledWith("test-files");
    expect(supabaseMock.uploadMock).toHaveBeenCalledWith(
      "acme-inc/project-1/object-2/test-file.pdf",
      testFile,
      expect.objectContaining({
        upsert: true,
        contentType: "application/pdf",
        cacheControl: "3600",
      })
    );

    expect(mockFileService.uploadFileMeta).toHaveBeenCalledWith(
      supabaseMock.supabase,
      expect.objectContaining({
        storage_key: "acme-inc/project-1/object-2/test-file.pdf",
        project_id: 1,
        filename: "test-file.pdf",
      })
    );

    expect(mockObjectFileService.linkFileToObject).toHaveBeenCalledWith(
      supabaseMock.supabase,
      {
        object_id: 2,
        file_id: fileMeta.id,
      }
    );

    expect(result.current.error).toBeNull();
    expect(result.current.isUploading).toBe(false);
  });

  it("uploads a lexicon file and links it to the lexicon item", async () => {
    const supabaseMock = createSupabaseMock();
    mockUseSupabase.mockReturnValue({
      supabase: supabaseMock.supabase,
      isLoaded: true,
    });

    const fileMeta = createFileMeta({
      storage_key: "acme-inc/lexicon/valve/test-file.pdf",
      project_id: null,
      filename: "test-file.pdf",
    });

    mockFileService.uploadFileMeta.mockResolvedValue(fileMeta);
    mockLexiconFileService.linkFileToLexicon.mockResolvedValue();

    const testFile = new File(["dummy"], "test file.pdf", {
      type: "application/pdf",
    });

    const { result } = renderHook(() => useFileUpload());

    await act(async () => {
      const created = await result.current.uploadLexiconFile({
        file: testFile,
        lexiconId: 3,
        lexiconSlug: "Valve",
      });

      expect(created).toEqual(fileMeta);
    });

    expect(supabaseMock.fromMock).toHaveBeenCalledWith("test-files");
    expect(supabaseMock.uploadMock).toHaveBeenCalledWith(
      "acme-inc/lexicon/valve/test-file.pdf",
      testFile,
      expect.objectContaining({
        upsert: true,
        cacheControl: "3600",
      })
    );

    expect(mockFileService.uploadFileMeta).toHaveBeenCalledWith(
      supabaseMock.supabase,
      expect.objectContaining({
        storage_key: "acme-inc/lexicon/valve/test-file.pdf",
        project_id: null,
      })
    );

    expect(mockLexiconFileService.linkFileToLexicon).toHaveBeenCalledWith(
      supabaseMock.supabase,
      {
        lexicon_id: 3,
        file_id: fileMeta.id,
      }
    );
  });

  it("throws when Supabase client is not initialized", async () => {
    mockUseSupabase.mockReturnValue({
      supabase: null,
      isLoaded: false,
    });

    const testFile = new File(["dummy"], "file.pdf");

    const { result } = renderHook(() => useFileUpload());

    await expect(
      result.current.uploadObjectFile({
        file: testFile,
        projectId: 1,
        objectId: 2,
      })
    ).rejects.toThrow("Supabase client not initialized");
  });

  it("captures and rethrows errors from the storage upload", async () => {
    const supabaseMock = createSupabaseMock();
    supabaseMock.uploadMock.mockResolvedValueOnce({
      data: null,
      error: new Error("Upload failed"),
    });

    mockUseSupabase.mockReturnValue({
      supabase: supabaseMock.supabase,
      isLoaded: true,
    });

    const testFile = new File(["dummy"], "file.pdf");

    const { result } = renderHook(() => useFileUpload());

    await act(async () => {
      await expect(
        result.current.uploadObjectFile({
          file: testFile,
          projectId: 1,
          objectId: 2,
        })
      ).rejects.toThrow("Upload failed");
    });

    expect(result.current.error).toBe("Upload failed");
    expect(result.current.isUploading).toBe(false);
  });
});
