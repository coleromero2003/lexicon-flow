"use client";

import { FileText, Loader2, Plus, Trash2 } from "lucide-react";

import type { FileMeta } from "@/lib/supabase/models";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

interface FilesCardProps {
  files: FileMeta[];
  onUpload?: () => void;
  onUnlink: (fileId: number) => Promise<void>;
  onView?: (file: FileMeta) => void;
  isUploading?: boolean;
  viewingFileId?: number | null;
}

export function FilesCard({
  files,
  onUpload,
  onUnlink,
  onView,
  isUploading = false,
  viewingFileId = null,
}: FilesCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Files
          </CardTitle>
          <CardDescription>Attached documents and files</CardDescription>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onUpload}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              Uploading
            </>
          ) : (
            <>
              <Plus className="mr-1 h-4 w-4" />
              Upload
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-8 w-8" />}
            title="No files"
            description="Upload documents, images, or other files related to this object."
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={onUpload}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    Uploading
                  </>
                ) : (
                  <>
                    <Plus className="mr-1 h-4 w-4" />
                    Upload File
                  </>
                )}
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="group flex cursor-pointer items-center gap-3 rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                onClick={() => onView?.(file)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onView?.(file);
                  }
                }}
                role={onView ? "button" : undefined}
                tabIndex={onView ? 0 : undefined}
              >
                <FileText className="h-8 w-8 flex-shrink-0 text-blue-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {file.filename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {file.size_bytes
                      ? `${(file.size_bytes / 1024).toFixed(2)} KB`
                      : "Unknown size"}
                    {file.mime_type && ` • ${file.mime_type}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {viewingFileId === file.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(event) => {
                      event.stopPropagation();
                      onUnlink(file.id);
                    }}
                    aria-label={`Remove ${file.filename}`}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
