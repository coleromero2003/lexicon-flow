import { FileMeta } from "@/lib/supabase/models";

export function formatFileSize(sizeBytes: FileMeta["size_bytes"]) {
  if (!sizeBytes || sizeBytes <= 0) {
    return "Unknown size";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = sizeBytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const precision = size < 10 && unitIndex > 0 ? 1 : 0;

  return `${size.toFixed(precision)} ${units[unitIndex]}`;
}
