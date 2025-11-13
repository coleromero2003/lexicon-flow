import * as XLSX from "xlsx";
import type { Part } from "@/lib/supabase/models";

/**
 * Export parts data to CSV format
 */
export function exportPartsToCSV(parts: Part[], filename: string = "parts-list.csv") {
  if (parts.length === 0) {
    throw new Error("No parts to export");
  }

  // Create worksheet from parts data
  const worksheet = XLSX.utils.json_to_sheet(
    parts.map((part) => ({
      "Part Number": part.part_number,
      "Description": part.description,
      "Quantity": part.quantity,
      "Comments": part.comments || "",
      "Ordered": part.ordered ? "Yes" : "No",
      "Ordered Date": part.ordered_date
        ? new Date(part.ordered_date).toLocaleDateString()
        : "",
      "Received": part.received ? "Yes" : "No",
      "Received Date": part.received_date
        ? new Date(part.received_date).toLocaleDateString()
        : "",
      "Delivered": part.delivered ? "Yes" : "No",
      "Delivered Date": part.delivered_date
        ? new Date(part.delivered_date).toLocaleDateString()
        : "",
    }))
  );

  // Create workbook and add worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Parts");

  // Export to CSV
  XLSX.writeFile(workbook, filename, { bookType: "csv" });
}

/**
 * Export parts data to XLSX format
 */
export function exportPartsToXLSX(parts: Part[], filename: string = "parts-list.xlsx") {
  if (parts.length === 0) {
    throw new Error("No parts to export");
  }

  // Create worksheet from parts data
  const worksheet = XLSX.utils.json_to_sheet(
    parts.map((part) => ({
      "Part Number": part.part_number,
      "Description": part.description,
      "Quantity": part.quantity,
      "Comments": part.comments || "",
      "Ordered": part.ordered ? "Yes" : "No",
      "Ordered Date": part.ordered_date
        ? new Date(part.ordered_date).toLocaleDateString()
        : "",
      "Received": part.received ? "Yes" : "No",
      "Received Date": part.received_date
        ? new Date(part.received_date).toLocaleDateString()
        : "",
      "Delivered": part.delivered ? "Yes" : "No",
      "Delivered Date": part.delivered_date
        ? new Date(part.delivered_date).toLocaleDateString()
        : "",
    }))
  );

  // Set column widths for better readability
  worksheet["!cols"] = [
    { wch: 20 }, // Part Number
    { wch: 40 }, // Description
    { wch: 10 }, // Quantity
    { wch: 30 }, // Comments
    { wch: 10 }, // Ordered
    { wch: 15 }, // Ordered Date
    { wch: 10 }, // Received
    { wch: 15 }, // Received Date
    { wch: 10 }, // Delivered
    { wch: 15 }, // Delivered Date
  ];

  // Create workbook and add worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Parts");

  // Export to XLSX
  XLSX.writeFile(workbook, filename);
}

/**
 * Generate a filename for the parts export
 */
export function generatePartsExportFilename(
  objectTitle: string,
  format: "csv" | "xlsx"
): string {
  const sanitizedTitle = objectTitle
    .replace(/[^a-z0-9]/gi, "-")
    .toLowerCase()
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const timestamp = new Date().toISOString().split("T")[0];

  return `parts-list-${sanitizedTitle}-${timestamp}.${format}`;
}
