import React from "react";
import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach, beforeAll } from "vitest";

const commandMocks = vi.hoisted(() => {
  const React = require("react");
  return {
    Command: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="command">{children}</div>
    ),
    CommandEmpty: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    CommandGroup: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    CommandInput: ({ placeholder }: { placeholder?: string }) => (
      <input placeholder={placeholder} />
    ),
    CommandItem: ({
      children,
      onSelect,
      value,
    }: {
      children: React.ReactNode;
      onSelect?: (value: string) => void;
      value?: string;
    }) => (
      <button type="button" onClick={() => onSelect?.(value ?? "")}>
        {children}
      </button>
    ),
    CommandList: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  };
});

const popoverMocks = vi.hoisted(() => {
  const React = require("react");
  return {
    Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    PopoverTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    PopoverContent: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  };
});

vi.mock("../ui/command", () => commandMocks);
vi.mock("../ui/popover", () => popoverMocks);

type MetadataEditorType = typeof import("../metadata-editor").MetadataEditor;
let MetadataEditorComponent: MetadataEditorType;

beforeAll(async () => {
  ({ MetadataEditor: MetadataEditorComponent } = await import("../metadata-editor"));
});

describe("MetadataEditor", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const baseMetadata = {
    serial_number: "1234",
    location: "Laboratory",
  };

  it("renders provided metadata entries", () => {
    render(
      <MetadataEditorComponent
        metadata={baseMetadata}
        onUpdate={vi.fn()}
        suggestions={[]}
      />
    );

    expect(screen.getByText(/serial number/i)).toBeInTheDocument();
    expect(screen.getByText("1234")).toBeInTheDocument();
    expect(screen.getByText(/location/i)).toBeInTheDocument();
    expect(screen.getByText("Laboratory")).toBeInTheDocument();
  });

  it("adds a new metadata entry using suggestions", async () => {
    const onUpdate = vi.fn();
    const user = userEvent.setup();

    render(
      <MetadataEditorComponent
        metadata={{ serial_number: "1234" }}
        onUpdate={onUpdate}
        suggestions={["serial_number", "model_number", "purchase_date"]}
      />
    );

    await user.click(screen.getByRole("button", { name: /add property/i }));

    const keyInput = screen.getByLabelText(/property name/i);
    await user.click(keyInput);

    const suggestion = await screen.findByText(/model number/i);
    await user.click(suggestion);

    expect(keyInput).toHaveValue("model number");

    const valueInput = screen.getByLabelText(/value/i);
    await user.type(valueInput, "X900");

    await user.click(screen.getByRole("button", { name: /^add$/i }));

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        serial_number: "1234",
        model_number: "X900",
      })
    );
  });

  it("supports editing entries with keyboard controls", async () => {
    const onUpdate = vi.fn();
    const user = userEvent.setup();

    render(
      <MetadataEditorComponent
        metadata={{ serial_number: "1234" }}
        onUpdate={onUpdate}
      />
    );

    const keyLabel = screen.getByText(/serial number/i);
    const row = keyLabel.closest("div")?.parentElement as HTMLElement | null;

    if (!row) {
      throw new Error("Metadata row not found");
    }

    const [initialEditButton] = within(row).getAllByRole("button");
    await user.click(initialEditButton);

    const editInput = screen.getByDisplayValue("1234");
    await user.type(editInput, "5");
    await user.keyboard("{Escape}");

    expect(screen.getByText("1234")).toBeInTheDocument();

    const editButton = within(row).getAllByRole("button")[0];
    await user.click(editButton);

    const editInputAgain = screen.getByDisplayValue("1234");
    await user.clear(editInputAgain);
    await user.type(editInputAgain, "5678");
    await user.keyboard("{Enter}");

    expect(onUpdate).toHaveBeenCalledWith({ serial_number: "5678" });
  });

  it("removes entries when delete is clicked", async () => {
    const onUpdate = vi.fn();
    const user = userEvent.setup();

    render(
      <MetadataEditorComponent metadata={{ ...baseMetadata }} onUpdate={onUpdate} />
    );

    const keyLabel = screen.getByText(/serial number/i);
    const row = keyLabel.closest("div")?.parentElement as HTMLElement | null;

    if (!row) {
      throw new Error("Metadata row not found");
    }

    const buttons = within(row).getAllByRole("button");
    const deleteButton = buttons[1];

    await user.click(deleteButton);

    expect(onUpdate).toHaveBeenCalledWith({ location: "Laboratory" });
  });

  it("disables interactions when disabled is true", async () => {
    const user = userEvent.setup();

    render(
      <MetadataEditorComponent
        metadata={{ ...baseMetadata }}
        onUpdate={vi.fn()}
        disabled
      />
    );

    const addPropertyButton = screen.getByRole("button", { name: /add property/i });
    expect(addPropertyButton).toBeDisabled();

    const keyLabel = screen.getByText(/serial number/i);
    const row = keyLabel.closest("div")?.parentElement as HTMLElement | null;

    if (!row) {
      throw new Error("Metadata row not found");
    }

    const buttons = within(row).getAllByRole("button");
    const editButton = buttons[0];
    const deleteButton = buttons[1];

    expect(editButton).toBeDisabled();
    expect(deleteButton).toBeDisabled();

    await user.click(addPropertyButton);
    expect(screen.queryByLabelText(/property name/i)).not.toBeInTheDocument();
  });

  it("alerts and blocks duplicate keys", async () => {
    const onUpdate = vi.fn();
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
    const user = userEvent.setup();

    render(
      <MetadataEditorComponent
        metadata={{ serial_number: "1234" }}
        onUpdate={onUpdate}
      />
    );

    await user.click(screen.getByRole("button", { name: /add property/i }));

    const keyInput = screen.getByLabelText(/property name/i);
    await user.type(keyInput, "Serial Number");

    const valueInput = screen.getByLabelText(/value/i);
    await user.type(valueInput, "5678");

    await user.click(screen.getByRole("button", { name: /^add$/i }));

    expect(alertMock).toHaveBeenCalledWith("A property with this key already exists");
    expect(onUpdate).not.toHaveBeenCalled();
  });
});
