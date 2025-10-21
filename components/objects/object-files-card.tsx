import type { FileMeta } from "@/lib/supabase/models";
import { Paperclip } from "lucide-react";
import { ObjectSection } from "./object-section";

function formatBytes(bytes: number | null) {
  if (!bytes || Number.isNaN(bytes)) return "Unknown size";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size < 10 && unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
}

export function ObjectFilesCard({ files }: { files: FileMeta[] }) {
  const hasFiles = files.length > 0;
  return (
    <ObjectSection
      title="Files"
      description="Drawings, datasheets, and approvals attached to this object."
    >
      {hasFiles ? (
        <ul className="space-y-3 text-sm">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <Paperclip className="text-muted-foreground h-5 w-5" />
                <div>
                  <p className="font-medium text-foreground">{file.filename}</p>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">
                    {file.mime_type ?? "Unknown type"}
                  </p>
                </div>
              </div>
              <span className="text-muted-foreground text-xs">
                {formatBytes(file.size_bytes)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">
          No files linked yet. Attach reference drawings or approvals to improve
          traceability.
        </p>
      )}
    </ObjectSection>
  );
}
