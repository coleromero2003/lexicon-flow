import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { SubmittalPDFDialog } from "../submittal-pdf-dialog";
import type { ScadaObject } from "@/lib/supabase/models";

// Mock dependencies
vi.mock("@/lib/supabase/SupabaseProvider", () => ({
  useSupabase: () => ({
    supabase: {
      from: vi.fn(),
    },
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/lib/services", () => ({
  submittalService: {
    getConnectedObjects: vi.fn(),
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe("SubmittalPDFDialog", () => {
  const mockSubmittalObject: ScadaObject = {
    id: 1,
    title: "Test Submittal",
    project_id: 10,
    description_md: "# Title\nTest content",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    workflow_id: null,
    step_id: null,
    assignee: [],
    due_date: null,
    priority: "medium",
    sort_order: 0,
    metadata: null,
  };

  const mockConnectedObjects: ScadaObject[] = [
    {
      id: 2,
      title: "Object 1",
      project_id: 10,
      description_md: "Description 1",
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      workflow_id: null,
      step_id: null,
      assignee: [],
      due_date: null,
      priority: "medium",
      sort_order: 0,
      metadata: null,
    },
    {
      id: 3,
      title: "Object 2",
      project_id: 10,
      description_md: "Description 2",
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      workflow_id: null,
      step_id: null,
      assignee: [],
      due_date: null,
      priority: "medium",
      sort_order: 0,
      metadata: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render dialog when open", () => {
    render(
      <SubmittalPDFDialog
        open={true}
        onOpenChange={vi.fn()}
        submittalObject={mockSubmittalObject}
      />
    );

    expect(screen.getByText("Generate Submittal PDF")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Select the objects to include in the submittal package/
      )
    ).toBeInTheDocument();
  });

  it("should not render dialog when closed", () => {
    render(
      <SubmittalPDFDialog
        open={false}
        onOpenChange={vi.fn()}
        submittalObject={mockSubmittalObject}
      />
    );

    expect(
      screen.queryByText("Generate Submittal PDF")
    ).not.toBeInTheDocument();
  });

  it("should load connected objects when dialog opens", async () => {
    const { submittalService } = await import("@/lib/services");
    vi.mocked(submittalService.getConnectedObjects).mockResolvedValue(
      mockConnectedObjects
    );

    render(
      <SubmittalPDFDialog
        open={true}
        onOpenChange={vi.fn()}
        submittalObject={mockSubmittalObject}
      />
    );

    await waitFor(() => {
      expect(submittalService.getConnectedObjects).toHaveBeenCalledWith(
        expect.anything(),
        1
      );
    });
  });

  it("should display connected objects as checkboxes", async () => {
    const { submittalService } = await import("@/lib/services");
    vi.mocked(submittalService.getConnectedObjects).mockResolvedValue(
      mockConnectedObjects
    );

    render(
      <SubmittalPDFDialog
        open={true}
        onOpenChange={vi.fn()}
        submittalObject={mockSubmittalObject}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Object 1")).toBeInTheDocument();
      expect(screen.getByText("Object 2")).toBeInTheDocument();
    });
  });

  it("should select all objects by default", async () => {
    const { submittalService } = await import("@/lib/services");
    vi.mocked(submittalService.getConnectedObjects).mockResolvedValue(
      mockConnectedObjects
    );

    render(
      <SubmittalPDFDialog
        open={true}
        onOpenChange={vi.fn()}
        submittalObject={mockSubmittalObject}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("2 of 2 objects selected")).toBeInTheDocument();
    });
  });

  it("should allow selecting/deselecting objects", async () => {
    const user = userEvent.setup();
    const { submittalService } = await import("@/lib/services");
    vi.mocked(submittalService.getConnectedObjects).mockResolvedValue(
      mockConnectedObjects
    );

    render(
      <SubmittalPDFDialog
        open={true}
        onOpenChange={vi.fn()}
        submittalObject={mockSubmittalObject}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Object 1")).toBeInTheDocument();
    });

    // Find the checkbox for Object 1
    const checkbox = screen.getByRole("checkbox", { name: /Object 1/i });
    await user.click(checkbox);

    await waitFor(() => {
      expect(screen.getByText("1 of 2 objects selected")).toBeInTheDocument();
    });
  });

  it("should handle 'Select All' button", async () => {
    const user = userEvent.setup();
    const { submittalService } = await import("@/lib/services");
    vi.mocked(submittalService.getConnectedObjects).mockResolvedValue(
      mockConnectedObjects
    );

    render(
      <SubmittalPDFDialog
        open={true}
        onOpenChange={vi.fn()}
        submittalObject={mockSubmittalObject}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Object 1")).toBeInTheDocument();
    });

    // First deselect one object
    const checkbox = screen.getByRole("checkbox", { name: /Object 1/i });
    await user.click(checkbox);

    // Then click Select All
    const selectAllButton = screen.getByRole("button", { name: /Select All/i });
    await user.click(selectAllButton);

    await waitFor(() => {
      expect(screen.getByText("2 of 2 objects selected")).toBeInTheDocument();
    });
  });

  it("should handle 'Deselect All' button", async () => {
    const user = userEvent.setup();
    const { submittalService } = await import("@/lib/services");
    vi.mocked(submittalService.getConnectedObjects).mockResolvedValue(
      mockConnectedObjects
    );

    render(
      <SubmittalPDFDialog
        open={true}
        onOpenChange={vi.fn()}
        submittalObject={mockSubmittalObject}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Object 1")).toBeInTheDocument();
    });

    const deselectAllButton = screen.getByRole("button", {
      name: /Deselect All/i,
    });
    await user.click(deselectAllButton);

    await waitFor(() => {
      expect(screen.getByText("0 of 2 objects selected")).toBeInTheDocument();
    });
  });

  it("should allow selecting a spec object", async () => {
    const user = userEvent.setup();
    const { submittalService } = await import("@/lib/services");
    vi.mocked(submittalService.getConnectedObjects).mockResolvedValue(
      mockConnectedObjects
    );

    render(
      <SubmittalPDFDialog
        open={true}
        onOpenChange={vi.fn()}
        submittalObject={mockSubmittalObject}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Object 1")).toBeInTheDocument();
    });

    // Find and open the spec dropdown
    const specSelect = screen.getByRole("combobox");
    await user.click(specSelect);

    // Select Object 1 as the spec
    const option = await screen.findByRole("option", { name: /Object 1/i });
    await user.click(option);

    // Verify selection
    expect(specSelect).toHaveTextContent("Object 1");
  });

  it("should show error when no objects selected on generate", async () => {
    const user = userEvent.setup();
    const { toast } = await import("sonner");
    const { submittalService } = await import("@/lib/services");
    vi.mocked(submittalService.getConnectedObjects).mockResolvedValue(
      mockConnectedObjects
    );

    render(
      <SubmittalPDFDialog
        open={true}
        onOpenChange={vi.fn()}
        submittalObject={mockSubmittalObject}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Object 1")).toBeInTheDocument();
    });

    // Deselect all objects
    const deselectAllButton = screen.getByRole("button", {
      name: /Deselect All/i,
    });
    await user.click(deselectAllButton);

    // Try to generate PDF
    const generateButton = screen.getByRole("button", {
      name: /Generate PDF/i,
    });
    await user.click(generateButton);

    expect(toast.error).toHaveBeenCalledWith(
      "Please select at least one object"
    );
  });

  it("should call API and download PDF on successful generation", async () => {
    const user = userEvent.setup();
    const { toast } = await import("sonner");
    const { submittalService } = await import("@/lib/services");
    const mockOnOpenChange = vi.fn();

    vi.mocked(submittalService.getConnectedObjects).mockResolvedValue(
      mockConnectedObjects
    );

    const mockBlob = new Blob(["pdf content"], { type: "application/pdf" });
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    } as Response);

    // Mock URL.createObjectURL and document.createElement
    const mockUrl = "blob:http://localhost/mock-url";
    global.URL.createObjectURL = vi.fn(() => mockUrl);
    global.URL.revokeObjectURL = vi.fn();

    const mockLink = {
      href: "",
      download: "",
      click: vi.fn(),
    };
    const originalCreateElement = document.createElement.bind(document);
    document.createElement = vi.fn((tagName: string) => {
      if (tagName === "a") {
        return mockLink as unknown as HTMLAnchorElement;
      }
      return originalCreateElement(tagName);
    });

    render(
      <SubmittalPDFDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        submittalObject={mockSubmittalObject}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Object 1")).toBeInTheDocument();
    });

    // Click generate PDF
    const generateButton = screen.getByRole("button", {
      name: /Generate PDF/i,
    });
    await user.click(generateButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/submittal/pdf",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: expect.any(String),
        })
      );
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Submittal PDF generated successfully"
      );
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("should show error message when connected objects are empty", async () => {
    const { submittalService } = await import("@/lib/services");
    vi.mocked(submittalService.getConnectedObjects).mockResolvedValue([]);

    render(
      <SubmittalPDFDialog
        open={true}
        onOpenChange={vi.fn()}
        submittalObject={mockSubmittalObject}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          /No connected objects found. Connect objects to this submittal/
        )
      ).toBeInTheDocument();
    });
  });

  it("should disable generate button when loading", async () => {
    const { submittalService } = await import("@/lib/services");
    vi.mocked(submittalService.getConnectedObjects).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <SubmittalPDFDialog
        open={true}
        onOpenChange={vi.fn()}
        submittalObject={mockSubmittalObject}
      />
    );

    const generateButton = screen.getByRole("button", {
      name: /Generate PDF/i,
    });
    expect(generateButton).toBeDisabled();
  });
});
