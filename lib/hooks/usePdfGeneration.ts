"use client";

import { useState } from "react";
import { toast } from "sonner";

export function usePdfGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);

  /**
   * Generate a purchase report PDF for a SCADA object
   */
  async function generatePurchaseReport(objectId: number): Promise<Blob | null> {
    setIsGenerating(true);

    try {
      const response = await fetch("/api/reports/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ objectId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate report");
      }

      const blob = await response.blob();
      toast.success("Purchase report generated successfully!");
      return blob;
    } catch (error) {
      console.error("Error generating purchase report:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to generate purchase report"
      );
      return null;
    } finally {
      setIsGenerating(false);
    }
  }

  /**
   * Download a PDF blob to the user's device
   */
  function downloadPdf(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Generate and download a purchase report
   */
  async function generateAndDownloadReport(objectId: number, objectTitle: string) {
    const blob = await generatePurchaseReport(objectId);
    if (blob) {
      const filename = `purchase-report-${objectTitle.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf`;
      downloadPdf(blob, filename);
    }
  }

  /**
   * Merge multiple PDF files
   */
  async function mergePdfs(fileIds: number[]): Promise<Blob | null> {
    if (fileIds.length === 0) {
      toast.error("No files selected to merge");
      return null;
    }

    setIsMerging(true);

    try {
      const response = await fetch("/api/reports/merge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to merge PDFs");
      }

      const blob = await response.blob();
      toast.success(`Successfully merged ${fileIds.length} PDF files!`);
      return blob;
    } catch (error) {
      console.error("Error merging PDFs:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to merge PDFs"
      );
      return null;
    } finally {
      setIsMerging(false);
    }
  }

  /**
   * Merge and download PDF files
   */
  async function mergeAndDownloadPdfs(fileIds: number[], filename?: string) {
    const blob = await mergePdfs(fileIds);
    if (blob) {
      const defaultFilename = filename || `merged-report-${Date.now()}.pdf`;
      downloadPdf(blob, defaultFilename);
    }
  }

  /**
   * Compile all PDFs for an object (including linked lexicon PDFs)
   */
  async function compilePdfs(objectId: number): Promise<Blob | null> {
    setIsCompiling(true);

    try {
      const response = await fetch("/api/reports/compile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ objectId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to compile PDFs");
      }

      const blob = await response.blob();
      toast.success("Successfully compiled all PDFs!");
      return blob;
    } catch (error) {
      console.error("Error compiling PDFs:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to compile PDFs"
      );
      return null;
    } finally {
      setIsCompiling(false);
    }
  }

  /**
   * Compile and download all PDFs for an object
   */
  async function compileAndDownloadPdfs(objectId: number, objectTitle: string) {
    const blob = await compilePdfs(objectId);
    if (blob) {
      const filename = `compiled-${objectTitle.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf`;
      downloadPdf(blob, filename);
    }
  }

  return {
    isGenerating,
    isMerging,
    isCompiling,
    generatePurchaseReport,
    generateAndDownloadReport,
    mergePdfs,
    mergeAndDownloadPdfs,
    compilePdfs,
    compileAndDownloadPdfs,
    downloadPdf,
  };
}
