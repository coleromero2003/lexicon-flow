"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FileRenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalFileName: string;
  onConfirm: (newFileName: string) => void;
  onCancel?: () => void;
}

export function FileRenameDialog({
  open,
  onOpenChange,
  originalFileName,
  onConfirm,
  onCancel,
}: FileRenameDialogProps) {
  const [newFileName, setNewFileName] = useState("");

  // Extract file name without extension and extension
  const getFileNameParts = (fileName: string) => {
    const lastDotIndex = fileName.lastIndexOf(".");
    if (lastDotIndex === -1) {
      return { nameWithoutExt: fileName, extension: "" };
    }
    return {
      nameWithoutExt: fileName.substring(0, lastDotIndex),
      extension: fileName.substring(lastDotIndex),
    };
  };

  const { nameWithoutExt, extension } = getFileNameParts(originalFileName);

  // Initialize with the original file name (without extension)
  useEffect(() => {
    if (open) {
      setNewFileName(nameWithoutExt);
    }
  }, [open, nameWithoutExt]);

  const handleConfirm = () => {
    const trimmedName = newFileName.trim();
    if (!trimmedName) {
      // If the name is empty, use the original name
      onConfirm(originalFileName);
    } else {
      // Append the original extension to the new name
      onConfirm(trimmedName + extension);
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Rename File
          </DialogTitle>
          <DialogDescription>
            Choose a new name for your file before uploading.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="original-name">Original Name</Label>
            <Input
              id="original-name"
              value={originalFileName}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-name">New Name</Label>
            <div className="flex items-center gap-2">
              <Input
                id="new-name"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter new file name"
                autoFocus
                className="flex-1"
              />
              {extension && (
                <span className="text-sm text-muted-foreground">
                  {extension}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              The file extension will be preserved automatically.
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
