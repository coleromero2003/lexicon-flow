"use client";

import { useCallback, useMemo, useState } from "react";
import { useOrganization, useUser } from "@clerk/nextjs";

import { useSupabase } from "../supabase/SupabaseProvider";
import {
  fileService,
  lexiconFileService,
  objectFileService,
} from "../services";
import type { FileMeta } from "../supabase/models";

type UploadObjectFileParams = {
  file: File;
  projectId: number;
  objectId: number;
  /**
   * Optional human readable identifier used in the storage path.
   * Falls back to the project id when omitted.
   */
  projectSlug?: string;
  /**
   * Optional human readable identifier used in the storage path.
   * Falls back to the object id when omitted.
   */
  objectSlug?: string;
};

type UploadLexiconFileParams = {
  file: File;
  lexiconId: number;
  /** Optional slug used in the storage path. */
  lexiconSlug?: string;
};

const DEFAULT_STORAGE_BUCKET = "lexicon-files";

function sanitizePathSegment(segment: string | number) {
  return String(segment)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function sanitizeFilename(filename: string) {
  return filename
    .trim()
    .replace(/[\\/]/g, "-")
    .replace(/\s+/g, "-");
}

export function useFileUpload() {
  const { supabase } = useSupabase();
  const { organization } = useOrganization();
  const { user } = useUser();

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storageBucket = useMemo(
    () =>
      process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ||
      DEFAULT_STORAGE_BUCKET,
    []
  );

  const ensureSupabase = useCallback(() => {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }
  }, [supabase]);

  const ensureOrganization = useCallback(() => {
    if (!organization) {
      throw new Error("Organization not found");
    }
  }, [organization]);

  const getOrgSegment = useCallback(() => {
    if (!organization) return "";
    return sanitizePathSegment(organization.slug || organization.id);
  }, [organization]);

  const buildObjectStorageKey = useCallback(
    (projectSlug: string | number, objectSlug: string | number, file: File) => {
      const orgSegment = getOrgSegment();
      const projectSegment = sanitizePathSegment(projectSlug);
      const objectSegment = sanitizePathSegment(objectSlug);
      const filename = sanitizeFilename(file.name);

      return [orgSegment, projectSegment, objectSegment, filename]
        .filter(Boolean)
        .join("/");
    },
    [getOrgSegment]
  );

  const buildLexiconStorageKey = useCallback(
    (lexiconSlug: string | number, file: File) => {
      const orgSegment = getOrgSegment();
      const lexiconSegment = sanitizePathSegment(lexiconSlug);
      const filename = sanitizeFilename(file.name);

      return [orgSegment, "lexicon", lexiconSegment, filename]
        .filter(Boolean)
        .join("/");
    },
    [getOrgSegment]
  );

  const uploadObjectFile = useCallback(
    async ({
      file,
      projectId,
      objectId,
      projectSlug,
      objectSlug,
    }: UploadObjectFileParams): Promise<FileMeta> => {
      ensureSupabase();
      ensureOrganization();

      setIsUploading(true);
      setError(null);

      try {
        const storageKey = buildObjectStorageKey(
          projectSlug ?? projectId,
          objectSlug ?? objectId,
          file
        );

        const { error: uploadError } = await supabase!.storage
          .from(storageBucket)
          .upload(storageKey, file, {
            cacheControl: "3600",
            upsert: true,
            contentType: file.type || undefined,
          });

        if (uploadError) throw uploadError;

        const metadata = await fileService.uploadFileMeta(supabase!, {
          uploaded_by: user?.id ?? null,
          org_id: organization!.id,
          project_id: projectId,
          storage_key: storageKey,
          filename: sanitizeFilename(file.name),
          mime_type: file.type || null,
          size_bytes: typeof file.size === "number" ? file.size : null,
          sha256: null,
        });

        await objectFileService.linkFileToObject(supabase!, {
          object_id: objectId,
          file_id: metadata.id,
        });

        return metadata;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to upload object file";
        setError(message);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [
      buildObjectStorageKey,
      ensureOrganization,
      ensureSupabase,
      organization,
      storageBucket,
      supabase,
      user?.id,
    ]
  );

  const uploadLexiconFile = useCallback(
    async ({ file, lexiconId, lexiconSlug }: UploadLexiconFileParams) => {
      ensureSupabase();
      ensureOrganization();

      setIsUploading(true);
      setError(null);

      try {
        const storageKey = buildLexiconStorageKey(
          lexiconSlug ?? lexiconId,
          file
        );

        const { error: uploadError } = await supabase!.storage
          .from(storageBucket)
          .upload(storageKey, file, {
            cacheControl: "3600",
            upsert: true,
            contentType: file.type || undefined,
          });

        if (uploadError) throw uploadError;

        const metadata = await fileService.uploadFileMeta(supabase!, {
          uploaded_by: user?.id ?? null,
          org_id: organization!.id,
          project_id: null,
          storage_key: storageKey,
          filename: sanitizeFilename(file.name),
          mime_type: file.type || null,
          size_bytes: typeof file.size === "number" ? file.size : null,
          sha256: null,
        });

        await lexiconFileService.linkFileToLexicon(supabase!, {
          lexicon_id: lexiconId,
          file_id: metadata.id,
        });

        return metadata;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to upload lexicon file";
        setError(message);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [
      buildLexiconStorageKey,
      ensureOrganization,
      ensureSupabase,
      organization,
      storageBucket,
      supabase,
      user?.id,
    ]
  );

  return {
    uploadObjectFile,
    uploadLexiconFile,
    isUploading,
    error,
  };
}

export type UseFileUploadReturn = ReturnType<typeof useFileUpload>;
