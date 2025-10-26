"use client";

import { Loader2 } from "lucide-react";

import type { FileMeta } from "@/lib/supabase/models";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PdfViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileMeta | null;
  url: string | null;
  loading: boolean;
  emptyStateMessage?: string;
}

export function PdfViewerDialog({
  open,
  onOpenChange,
  file,
  url,
  loading,
  emptyStateMessage = "Unable to display this document.",
}: PdfViewerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] w-[95vw] max-w-5xl flex-col overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-left text-lg font-semibold">
              {file?.filename ?? "Document preview"}
            </DialogTitle>
            {url ? (
              <Button variant="outline" size="sm" asChild>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  Open in new tab
                </a>
              </Button>
            ) : null}
          </div>
        </DialogHeader>
        <div className="flex flex-1 items-center justify-center bg-muted/10">
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : url ? (
            <iframe
              src={url}
              className="h-full w-full"
              title={file?.filename ?? "Document preview"}
              loading="lazy"
            />
          ) : (
            <p className="px-6 text-center text-sm text-muted-foreground">
              {emptyStateMessage}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
