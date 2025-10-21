"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText, Loader2, Plus, Trash2 } from "lucide-react";

interface FileInfo {
  id: number;
  filename: string;
  size_bytes: number | null;
  mime_type: string | null;
}

interface FilesCardProps {
  files: FileInfo[];
  onUpload?: () => void;
  onUnlink: (fileId: number) => Promise<void>;
  isUploading?: boolean;
}

export function FilesCard({
  files,
  onUpload,
  onUnlink,
  isUploading = false,
}: FilesCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
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
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Uploading
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1" />
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
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Uploading
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
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
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
              >
                <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.filename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {file.size_bytes
                      ? `${(file.size_bytes / 1024).toFixed(2)} KB`
                      : "Unknown size"}
                    {file.mime_type && ` • ${file.mime_type}`}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onUnlink(file.id)}
                  className="opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
