"use client";

import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import * as XLSX from "xlsx";

import type { FileMeta } from "@/lib/supabase/models";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ExcelViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileMeta | null;
  url: string | null;
  loading: boolean;
  emptyStateMessage?: string;
}

interface ExcelData {
  columns: GridColDef[];
  rows: Record<string, unknown>[];
}

// Create MUI dark theme
const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

export function ExcelViewerDialog({
  open,
  onOpenChange,
  file,
  url,
  loading,
  emptyStateMessage = "Unable to display this Excel file.",
}: ExcelViewerDialogProps) {
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [parseLoading, setParseLoading] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    if (!url || !open) {
      setExcelData(null);
      setParseError(null);
      return;
    }

    const parseExcelFile = async () => {
      try {
        setParseLoading(true);
        setParseError(null);

        // Fetch the Excel file
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch Excel file");
        }

        const arrayBuffer = await response.arrayBuffer();

        // Parse with SheetJS
        const workbook = XLSX.read(arrayBuffer, { type: "array" });

        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error("No sheets found in Excel file");
        }

        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
        }) as unknown[][];

        if (jsonData.length === 0) {
          throw new Error("Excel file is empty");
        }

        // First row as headers
        const headers = jsonData[0] as string[];
        const dataRows = jsonData.slice(1);

        // Generate columns for DataGrid
        const columns: GridColDef[] = headers.map((header, index) => ({
          field: `col${index}`,
          headerName: String(header || `Column ${index + 1}`),
          flex: 1,
          minWidth: 150,
        }));

        // Generate rows for DataGrid
        const rows = dataRows.map((row, rowIndex) => {
          const rowData: Record<string, unknown> = { id: rowIndex };
          headers.forEach((_, colIndex) => {
            rowData[`col${colIndex}`] = row[colIndex] ?? "";
          });
          return rowData;
        });

        setExcelData({ columns, rows });
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        setParseError(
          error instanceof Error ? error.message : "Failed to parse Excel file"
        );
      } finally {
        setParseLoading(false);
      }
    };

    parseExcelFile();
  }, [url, open]);

  const handleDownload = () => {
    if (!url || !file) return;

    // Create a temporary link element to trigger download
    const link = document.createElement("a");
    link.href = url;
    link.download = file.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] w-[95vw] max-w-5xl flex-col overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-left text-lg font-semibold">
              {file?.filename ?? "Excel preview"}
            </DialogTitle>
            {url && !loading && !parseLoading ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            ) : null}
          </div>
        </DialogHeader>
        <div className="flex flex-1 items-center justify-center bg-muted/10 overflow-hidden">
          {loading || parseLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : parseError ? (
            <p className="px-6 text-center text-sm text-destructive">
              {parseError}
            </p>
          ) : excelData && excelData.rows.length > 0 ? (
            <div className="h-full w-full p-4">
              <ThemeProvider theme={darkTheme}>
                <DataGrid
                  rows={excelData.rows}
                  columns={excelData.columns}
                  pageSizeOptions={[25, 50, 100]}
                  initialState={{
                    pagination: {
                      paginationModel: { pageSize: 25 },
                    },
                  }}
                  disableRowSelectionOnClick
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    "& .MuiDataGrid-cell": {
                      borderColor: "divider",
                    },
                    "& .MuiDataGrid-columnHeaders": {
                      borderColor: "divider",
                      backgroundColor: "background.paper",
                    },
                  }}
                />
              </ThemeProvider>
            </div>
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
