"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileDown, FilePlus2, FileText, FileCheck } from "lucide-react";

type PdfType = "purchase-report" | "merge-pdfs" | "compile-pdfs" | "submittal-pdf";

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
      type: "purchase-report" as PdfType,
      icon: FileDown,
      label: "Purchase Report",
      description: "Generate a detailed purchase report for this object",
    },
    {
      type: "merge-pdfs" as PdfType,
      icon: FilePlus2,
      label: `Merge ${pdfCount} PDFs`,
      description: "Combine all PDF files into a single document",
      disabled: pdfCount < 2,
    },
    {
      type: "compile-pdfs" as PdfType,
      icon: FileText,
      label: "Compile All PDFs",
      description: "Compile all PDFs associated with this object",
    },
    {
      type: "submittal-pdf" as PdfType,
      icon: FileCheck,
      label: "Submittal PDF",
      description: "Generate a submittal package PDF",
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
