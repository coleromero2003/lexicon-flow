import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { FileMeta } from "../../supabase/models";
import { useSupabaseFileViewer } from "../useSupabaseFileViewer";

interface SupabaseStorageMock {
  from: ReturnType<typeof vi.fn>;
  createSignedUrl: ReturnType<typeof vi.fn>;
  client: SupabaseClient;
}

function createSupabaseMock(): SupabaseStorageMock {
  const createSignedUrl = vi.fn();
  const from = vi.fn(() => ({ createSignedUrl }));
  const storage = { from };

  return {
    from,
    createSignedUrl,
    client: { storage } as unknown as SupabaseClient,
  };
}

function createFileMeta(overrides: Partial<FileMeta> = {}): FileMeta {
  return {
    id: 1,
    created_at: "2024-01-01T00:00:00.000Z",
    uploaded_by: "user",
    org_id: "org",
    project_id: 1,
    storage_key: "documents/example.pdf",
    filename: "example.pdf",
    mime_type: "application/pdf",
    size_bytes: 1024,
    sha256: "hash",
    ...overrides,
  } as FileMeta;
}

describe("useSupabaseFileViewer", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("notifies error when Supabase client is missing", async () => {
    const onError = vi.fn();
    const file = createFileMeta();

    const { result } = renderHook(() =>
      useSupabaseFileViewer({ supabase: null, onError })
    );

    await act(async () => {
      await result.current.openFile(file);
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toBe(
      "Supabase client not initialized"
    );
    expect(result.current.state.viewingFileId).toBeNull();
  });

  it("opens PDF files in the in-app viewer and loads a signed URL", async () => {
    const supabase = createSupabaseMock();
    const signedUrl = "https://example.com/signed.pdf";
    supabase.createSignedUrl.mockResolvedValue({
      data: { signedUrl },
      error: null,
    });

    const file = createFileMeta();

    const { result } = renderHook(() =>
      useSupabaseFileViewer({ supabase: supabase.client })
    );

    await act(async () => {
      await result.current.openFile(file);
    });

    expect(supabase.from).toHaveBeenCalledWith("files");
    expect(supabase.createSignedUrl).toHaveBeenCalledWith(
      file.storage_key,
      60
    );
    expect(result.current.state).toMatchObject({
      isViewerOpen: true,
      viewerFile: file,
      viewerUrl: signedUrl,
      viewerLoading: false,
      viewingFileId: null,
    });
  });

  it("opens non-PDF files in a new tab", async () => {
    const supabase = createSupabaseMock();
    const signedUrl = "https://example.com/image.png";
    supabase.createSignedUrl.mockResolvedValue({
      data: { signedUrl },
      error: null,
    });

    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);

    const file = createFileMeta({
      filename: "image.png",
      mime_type: "image/png",
    });

    const { result } = renderHook(() =>
      useSupabaseFileViewer({ supabase: supabase.client })
    );

    await act(async () => {
      await result.current.openFile(file);
    });

    expect(openSpy).toHaveBeenCalledWith(
      signedUrl,
      "_blank",
      "noopener,noreferrer"
    );
    expect(result.current.state).toMatchObject({
      isViewerOpen: false,
      viewerFile: null,
      viewerUrl: null,
      viewerLoading: false,
      viewingFileId: null,
    });
  });

  it("resets viewer state and forwards errors when signed URL generation fails", async () => {
    const supabase = createSupabaseMock();
    const error = new Error("Unable to sign URL");
    supabase.createSignedUrl.mockResolvedValue({
      data: null,
      error,
    });

    const onError = vi.fn();
    const file = createFileMeta();

    const { result } = renderHook(() =>
      useSupabaseFileViewer({ supabase: supabase.client, onError })
    );

    await act(async () => {
      await result.current.openFile(file);
    });

    expect(onError).toHaveBeenCalledWith(error);
    expect(result.current.state).toMatchObject({
      isViewerOpen: false,
      viewerFile: null,
      viewerUrl: null,
      viewerLoading: false,
      viewingFileId: null,
    });
  });
});
