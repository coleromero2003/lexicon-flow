"use client";

import { useCallback, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { FileMeta } from "@/lib/supabase/models";

export interface UseSupabaseFileViewerOptions {
  supabase: SupabaseClient | null;
  bucket?: string;
  signedUrlTtl?: number;
  onError?: (error: Error) => void;
}

export interface SupabaseFileViewerState {
  isViewerOpen: boolean;
  viewerFile: FileMeta | null;
  viewerUrl: string | null;
  viewerLoading: boolean;
  viewingFileId: number | null;
}

const DEFAULT_ERROR_MESSAGE = "Failed to open file";

const normalizeError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "string") {
    return new Error(error);
  }

  return new Error(DEFAULT_ERROR_MESSAGE);
};

export const useSupabaseFileViewer = ({
  supabase,
  bucket,
  signedUrlTtl = 60,
  onError,
}: UseSupabaseFileViewerOptions) => {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerFile, setViewerFile] = useState<FileMeta | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewingFileId, setViewingFileId] = useState<number | null>(null);

  const resolvedBucket = useMemo(
    () =>
      bucket ??
      process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ??
      "files",
    [bucket]
  );

  const handleError = useCallback(
    (error: unknown) => {
      const normalizedError = normalizeError(error);
      onError?.(normalizedError);
    },
    [onError]
  );

  const resetViewer = useCallback(() => {
    setIsViewerOpen(false);
    setViewerFile(null);
    setViewerUrl(null);
    setViewerLoading(false);
  }, []);

  const setViewerOpen = useCallback(
    (open: boolean) => {
      setIsViewerOpen(open);
      if (!open) {
        setViewerFile(null);
        setViewerUrl(null);
        setViewerLoading(false);
      }
    },
    []
  );

  const openFile = useCallback(
    async (file: FileMeta) => {
      if (!supabase) {
        handleError(new Error("Supabase client not initialized"));
        return;
      }

      const mimeType = (file.mime_type ?? "").toLowerCase();
      const fileName = file.filename.toLowerCase();
      const isPdf = mimeType.includes("pdf") || fileName.endsWith(".pdf");
      const isImage =
        mimeType.includes("image") ||
        fileName.endsWith(".png") ||
        fileName.endsWith(".jpg") ||
        fileName.endsWith(".jpeg") ||
        fileName.endsWith(".gif") ||
        fileName.endsWith(".webp") ||
        fileName.endsWith(".svg") ||
        fileName.endsWith(".bmp");
      const isExcel =
        mimeType.includes("spreadsheet") ||
        mimeType.includes("excel") ||
        mimeType === "text/csv" ||
        fileName.endsWith(".xlsx") ||
        fileName.endsWith(".xls") ||
        fileName.endsWith(".xlsm") ||
        fileName.endsWith(".xlsb") ||
        fileName.endsWith(".csv");

      const canPreview = isPdf || isImage || isExcel;

      setViewingFileId(file.id);

      if (canPreview) {
        setIsViewerOpen(true);
        setViewerFile(file);
        setViewerUrl(null);
        setViewerLoading(true);
      }

      try {
        const { data, error } = await supabase.storage
          .from(resolvedBucket)
          .createSignedUrl(file.storage_key, signedUrlTtl);

        if (error || !data?.signedUrl) {
          throw error ?? new Error("Unable to generate file link");
        }

        if (canPreview) {
          setViewerUrl(data.signedUrl);
        } else if (typeof window !== "undefined") {
          window.open(data.signedUrl, "_blank", "noopener,noreferrer");
        }
      } catch (error) {
        handleError(error);
        if (canPreview) {
          resetViewer();
        }
      } finally {
        setViewingFileId(null);
        if (canPreview) {
          setViewerLoading(false);
        }
      }
    },
    [handleError, resetViewer, resolvedBucket, signedUrlTtl, supabase]
  );

  return useMemo(
    () => ({
      openFile,
      setViewerOpen,
      state: {
        isViewerOpen,
        viewerFile,
        viewerUrl,
        viewerLoading,
        viewingFileId,
      } as SupabaseFileViewerState,
    }),
    [
      openFile,
      setViewerOpen,
      isViewerOpen,
      viewerFile,
      viewerUrl,
      viewerLoading,
      viewingFileId,
    ]
  );
};

export type UseSupabaseFileViewerReturn = ReturnType<
  typeof useSupabaseFileViewer
>;
