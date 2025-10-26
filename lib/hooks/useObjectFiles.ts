"use client";

import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "../supabase/SupabaseProvider";
import { FileMeta } from "../supabase/models";
import { objectFileService, fileService } from "../services";

export function useObjectFiles(objectId: number) {
  const { supabase } = useSupabase();
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    if (!supabase || !objectId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await objectFileService.getFilesForObject(supabase, objectId);
      setFiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [supabase, objectId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const linkFile = useCallback(
    async (fileId: number) => {
      if (!supabase) throw new Error("Supabase client not initialized");

      try {
        await objectFileService.linkFileToObject(supabase, {
          object_id: objectId,
          file_id: fileId,
        });

        await loadFiles();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to link file");
        throw err;
      }
    },
    [supabase, objectId, loadFiles]
  );

  const unlinkFile = useCallback(
    async (fileId: number) => {
      if (!supabase) throw new Error("Supabase client not initialized");

      try {
        const { error } = await supabase
          .from("object_files")
          .delete()
          .eq("object_id", objectId)
          .eq("file_id", fileId);

        if (error) throw error;

        setFiles((prev) => prev.filter((f) => f.id !== fileId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to unlink file");
        throw err;
      }
    },
    [supabase, objectId]
  );

  const deleteFile = useCallback(
    async (fileId: number) => {
      if (!supabase) throw new Error("Supabase client not initialized");

      try {
        await fileService.deleteFile(supabase, fileId);
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete file");
        throw err;
      }
    },
    [supabase]
  );

  return {
    files,
    loading,
    error,
    linkFile,
    unlinkFile,
    deleteFile,
    reloadFiles: loadFiles,
  };
}
