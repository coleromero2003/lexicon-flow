"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FilePlus2, FileText } from "lucide-react";

type PdfType = "merge-pdfs" | "compile-pdfs";

interface PdfSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: PdfType) => void;
  pdfCount: number;
}

export function PdfSelectionDialog({
  open,
  onOpenChange,
  onSelect,
  pdfCount,
}: PdfSelectionDialogProps) {
  const handleSelect = (type: PdfType) => {
    onSelect(type);
    onOpenChange(false);
  };

  const options = [
    {
      type: "merge-pdfs" as PdfType,
      icon: FilePlus2,
      label: `Merge ${pdfCount} PDFs`,
      description: "Combine all PDF files into a single document (no title page)",
      disabled: pdfCount < 2,
    },
    {
      type: "compile-pdfs" as PdfType,
      icon: FileText,
      label: "Compile All PDFs",
      description: "Compile all PDFs with title page, table of contents, and bookmarks",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Select PDF Type</DialogTitle>
          <DialogDescription>
            Choose the type of PDF you want to generate
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <Button
                key={option.type}
                variant="outline"
                className="h-auto py-4 px-4 flex items-start justify-start text-left hover:bg-accent"
                onClick={() => handleSelect(option.type)}
                disabled={option.disabled}
              >
                <Icon className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {option.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
