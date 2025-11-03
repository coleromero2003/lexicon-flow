import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import type { FileMeta } from "@/lib/supabase/models";
import { PdfViewerDialog } from "../pdf-viewer-dialog";

const createFileMeta = (overrides: Partial<FileMeta> = {}): FileMeta => ({
  id: 1,
  created_at: "2024-01-01T00:00:00.000Z",
  uploaded_by: "user-1",
  org_id: "org-1",
  project_id: 1,
  storage_key: "files/test.pdf",
  filename: "Test Document.pdf",
  mime_type: "application/pdf",
  size_bytes: 1234,
  sha256: "hash",
  ...overrides,
});

describe("PdfViewerDialog", () => {
  it("shows a spinner while loading and hides iframe and fallback text", () => {
    const { baseElement } = render(
      <PdfViewerDialog
        open
        onOpenChange={vi.fn()}
        file={createFileMeta()}
        url={null}
        loading
      />
    );

    expect(baseElement.querySelector(".animate-spin")).toBeInTheDocument();
    expect(document.body.querySelector("iframe")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Unable to display this document.")
    ).not.toBeInTheDocument();
  });

  it("renders iframe and external link when a URL is provided", () => {
    const file = createFileMeta({ filename: "Invoice.pdf" });
    const url = "https://example.com/invoice.pdf";

    render(
      <PdfViewerDialog
        open
        onOpenChange={vi.fn()}
        file={file}
        url={url}
        loading={false}
      />
    );

    const iframe = screen.getByTitle("Invoice.pdf");
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute("src", url);

    const externalLink = screen.getByRole("link", { name: /open in new tab/i });
    expect(externalLink).toBeInTheDocument();
    expect(externalLink).toHaveAttribute("href", url);
  });

  it("shows the fallback message when no URL is available", () => {
    const customMessage = "No preview available for this document.";

    render(
      <PdfViewerDialog
        open
        onOpenChange={vi.fn()}
        file={createFileMeta()}
        url={null}
        loading={false}
        emptyStateMessage={customMessage}
      />
    );

    expect(screen.getByText(customMessage)).toBeInTheDocument();
    expect(document.body.querySelector("iframe")).not.toBeInTheDocument();
  });

  it("notifies when the dialog requests to close", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <PdfViewerDialog
        open
        onOpenChange={onOpenChange}
        file={createFileMeta()}
        url="https://example.com/test.pdf"
        loading={false}
      />
    );

    await user.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders an img element for image files instead of iframe", () => {
    const file = createFileMeta({
      filename: "photo.png",
      mime_type: "image/png",
    });
    const url = "https://example.com/photo.png";

    render(
      <PdfViewerDialog
        open
        onOpenChange={vi.fn()}
        file={file}
        url={url}
        loading={false}
      />
    );

    const img = screen.getByAltText("photo.png");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", url);
    expect(document.body.querySelector("iframe")).not.toBeInTheDocument();
  });

  it("detects image files by file extension when mime type is not available", () => {
    const file = createFileMeta({
      filename: "photo.jpg",
      mime_type: null,
    });
    const url = "https://example.com/photo.jpg";

    render(
      <PdfViewerDialog
        open
        onOpenChange={vi.fn()}
        file={file}
        url={url}
        loading={false}
      />
    );

    const img = screen.getByAltText("photo.jpg");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", url);
  });
});
