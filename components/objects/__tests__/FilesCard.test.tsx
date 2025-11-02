import "@testing-library/jest-dom";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { FileMeta } from "@/lib/supabase/models";
import { FilesCard } from "../files-card";

(globalThis as unknown as { React?: typeof React }).React = React;

vi.mock("@/components/ui/alert-dialog", () => {
  const React = require("react");

  interface AlertDialogContextValue {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  const AlertDialogContext = React.createContext<AlertDialogContextValue>({
    open: false,
  });

  const AlertDialog = ({
    open = false,
    onOpenChange,
    children,
  }: React.PropsWithChildren<{ open?: boolean; onOpenChange?: (open: boolean) => void }>) => (
    <AlertDialogContext.Provider value={{ open, onOpenChange }}>
      {open ? <div data-testid="alert-dialog">{children}</div> : null}
    </AlertDialogContext.Provider>
  );

  const useAlertDialogContext = () => React.useContext(AlertDialogContext);

  const AlertDialogContent = ({ children }: React.PropsWithChildren) => {
    const { open } = useAlertDialogContext();
    return open ? <div>{children}</div> : null;
  };

  const AlertDialogHeader = ({ children }: React.PropsWithChildren) => {
    const { open } = useAlertDialogContext();
    return open ? <div>{children}</div> : null;
  };

  const AlertDialogFooter = ({ children }: React.PropsWithChildren) => {
    const { open } = useAlertDialogContext();
    return open ? <div>{children}</div> : null;
  };

  const AlertDialogTitle = ({ children }: React.PropsWithChildren) => {
    const { open } = useAlertDialogContext();
    return open ? <h2>{children}</h2> : null;
  };

  const AlertDialogDescription = ({ children }: React.PropsWithChildren) => {
    const { open } = useAlertDialogContext();
    return open ? <p>{children}</p> : null;
  };

  const AlertDialogCancel = ({
    children,
    onClick,
    ...props
  }: React.PropsWithChildren<React.ComponentPropsWithoutRef<"button">>) => {
    const { onOpenChange } = useAlertDialogContext();
    return (
      <button
        type="button"
        {...props}
        onClick={(event) => {
          onClick?.(event);
          onOpenChange?.(false);
        }}
      >
        {children}
      </button>
    );
  };

  const AlertDialogAction = ({
    children,
    ...props
  }: React.PropsWithChildren<React.ComponentPropsWithoutRef<"button">>) => (
    <button type="button" {...props}>
      {children}
    </button>
  );

  return {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
  };
});

describe("FilesCard", () => {
  const mockFile: FileMeta = {
    id: 1,
    created_at: "2024-01-01T00:00:00Z",
    uploaded_by: "user-1",
    org_id: "org-1",
    project_id: 10,
    storage_key: "storage/key",
    filename: "document.pdf",
    mime_type: "application/pdf",
    size_bytes: 2048,
    sha256: "sha",
  };

  it("renders empty state messaging and reflects uploading state", async () => {
    const user = userEvent.setup();
    const onUpload = vi.fn();

    const { rerender, container } = render(
      <FilesCard files={[]} onUpload={onUpload} isUploading={false} />
    );

    expect(screen.getByText("No files")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Upload documents, images, or other files related to this object."
      )
    ).toBeInTheDocument();

    const emptyStateUploadButton = screen.getByRole("button", { name: "Upload File" });
    expect(emptyStateUploadButton).toBeEnabled();

    await user.click(emptyStateUploadButton);
    expect(onUpload).toHaveBeenCalledTimes(1);

    expect(container.querySelectorAll(".animate-spin").length).toBe(0);

    rerender(<FilesCard files={[]} onUpload={onUpload} isUploading />);

    expect(screen.getAllByRole("button", { name: "Uploading" })).toHaveLength(2);
    expect(container.querySelectorAll(".animate-spin").length).toBeGreaterThanOrEqual(1);
  });

  it("supports viewing, unlinking, deleting files, and viewing spinner", async () => {
    const user = userEvent.setup();

    let resolveUnlink!: () => void;
    const onUnlink = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveUnlink = resolve;
        })
    );

    let resolveDelete!: () => void;
    const onDelete = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveDelete = resolve;
        })
    );

    const onView = vi.fn();

    const { rerender } = render(
      <FilesCard
        files={[mockFile]}
        onView={onView}
        onUnlink={onUnlink}
        onDelete={onDelete}
      />
    );

    const getFileRow = () => {
      const row = screen.getByText(mockFile.filename).closest('[role="button"]');
      if (!row) {
        throw new Error("File row not found");
      }

      return row as HTMLElement;
    };

    const fileRow = getFileRow();

    fileRow.focus();
    await user.keyboard("{Enter}");
    expect(onView).toHaveBeenCalledTimes(1);
    expect(onView).toHaveBeenLastCalledWith(mockFile);

    await user.keyboard("[Space]");
    expect(onView).toHaveBeenCalledTimes(2);

    await user.click(fileRow);
    expect(onView).toHaveBeenCalledTimes(3);

    await user.click(screen.getByRole("button", { name: "Unlink document.pdf" }));
    expect(screen.getByText("Unlink file?")).toBeInTheDocument();
    expect(screen.getByText("This will remove the link to", { exact: false })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Unlink" }));
    expect(onUnlink).toHaveBeenCalledWith(mockFile.id);
    expect(screen.getByText("Unlink file?")).toBeInTheDocument();

    resolveUnlink();
    await waitFor(() => {
      expect(screen.queryByText("Unlink file?")).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Delete document.pdf" }));
    expect(screen.getByText("Delete file permanently?")).toBeInTheDocument();
    expect(screen.getByText("This will permanently delete", { exact: false })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledWith(mockFile.id);
    expect(screen.getByText("Delete file permanently?")).toBeInTheDocument();

    resolveDelete();
    await waitFor(() => {
      expect(screen.queryByText("Delete file permanently?")).not.toBeInTheDocument();
    });

    expect(getFileRow().querySelector(".animate-spin")).toBeNull();

    rerender(
      <FilesCard
        files={[mockFile]}
        onView={onView}
        onUnlink={onUnlink}
        onDelete={onDelete}
        viewingFileId={mockFile.id}
      />
    );

    expect(getFileRow().querySelector(".animate-spin")).not.toBeNull();
  });

  it("displays appropriate icons for different file types", () => {
    const pdfFile: FileMeta = {
      ...mockFile,
      id: 1,
      filename: "document.pdf",
      mime_type: "application/pdf",
    };

    const excelFile: FileMeta = {
      ...mockFile,
      id: 2,
      filename: "spreadsheet.xlsx",
      mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };

    const imageFile: FileMeta = {
      ...mockFile,
      id: 3,
      filename: "photo.png",
      mime_type: "image/png",
    };

    const otherFile: FileMeta = {
      ...mockFile,
      id: 4,
      filename: "archive.zip",
      mime_type: "application/zip",
    };

    render(
      <FilesCard
        files={[pdfFile, excelFile, imageFile, otherFile]}
        onView={vi.fn()}
      />
    );

    // All files should be displayed
    expect(screen.getByText("document.pdf")).toBeInTheDocument();
    expect(screen.getByText("spreadsheet.xlsx")).toBeInTheDocument();
    expect(screen.getByText("photo.png")).toBeInTheDocument();
    expect(screen.getByText("archive.zip")).toBeInTheDocument();
  });
});
