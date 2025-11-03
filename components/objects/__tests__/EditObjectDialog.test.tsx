import "@testing-library/jest-dom";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

(globalThis as unknown as { React?: typeof React }).React = React;

const mockNewDueDate = new Date(2024, 2, 10);

vi.mock("@/components/ui/dialog", () => {
  const React = require("react");
  return {
    Dialog: ({ children }: React.PropsWithChildren<{ open: boolean }>) => (
      <div data-testid="dialog">{children}</div>
    ),
    DialogContent: ({ children }: React.PropsWithChildren) => (
      <div data-testid="dialog-content">{children}</div>
    ),
    DialogHeader: ({ children }: React.PropsWithChildren) => (
      <div data-testid="dialog-header">{children}</div>
    ),
    DialogTitle: ({ children }: React.PropsWithChildren) => (
      <h2>{children}</h2>
    ),
    DialogDescription: ({ children }: React.PropsWithChildren) => (
      <p>{children}</p>
    ),
  };
});

vi.mock("@/components/ui/popover", () => {
  const React = require("react");
  return {
    Popover: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    PopoverTrigger: ({ children }: React.PropsWithChildren) => <>{children}</>,
    PopoverContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  };
});

vi.mock("@/components/ui/command", () => {
  const React = require("react");
  return {
    Command: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    CommandEmpty: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    CommandGroup: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    CommandInput: (props: React.ComponentProps<"input">) => <input {...props} />,
    CommandItem: ({
      children,
      onSelect,
      value,
    }: React.PropsWithChildren<{ onSelect?: (value: string) => void; value?: string }>) => (
      <div role="option" tabIndex={0} onClick={() => onSelect?.(value ?? "")}>
        {children}
      </div>
    ),
    CommandList: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    CommandSeparator: () => <div role="separator" />, 
  };
});

vi.mock("@/components/ui/select", () => {
  const React = require("react");
  const SelectContext = React.createContext<{
    value?: string;
    onValueChange?: (value: string) => void;
  }>({});

  const Select = ({
    value,
    onValueChange,
    children,
  }: React.PropsWithChildren<{ value?: string; onValueChange?: (value: string) => void }>) => (
    <SelectContext.Provider value={{ value, onValueChange }}>
      <div>{children}</div>
    </SelectContext.Provider>
  );

  const SelectTrigger = ({ children }: React.PropsWithChildren) => {
    const context = React.useContext(SelectContext);
    return (
      <button type="button" data-testid="priority-trigger">
        {context.value}
        {children}
      </button>
    );
  };

  const SelectContent = ({ children }: React.PropsWithChildren) => <div>{children}</div>;

  const SelectValue = () => null;

  const SelectItem = ({
    value,
    children,
  }: React.PropsWithChildren<{ value: string }>) => {
    const context = React.useContext(SelectContext);
    return (
      <div
        role="option"
        tabIndex={0}
        onClick={() => context.onValueChange?.(value)}
        data-value={value}
      >
        {children}
      </div>
    );
  };

  return {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  };
});

vi.mock("@/components/ui/calendar", () => {
  const React = require("react");
  return {
    Calendar: ({ onSelect }: { onSelect?: (date: Date | undefined) => void }) => (
      <button type="button" data-testid="calendar" onClick={() => onSelect?.(mockNewDueDate)}>
        Mock Calendar
      </button>
    ),
  };
});

import { EditObjectDialog } from "../edit-object-dialog";

describe("EditObjectDialog", () => {
  const orgUsers = [
    { userId: "user-1", name: "Alice Johnson" },
    { userId: "user-2", name: "Bob Smith" },
  ];

  const initialValues = {
    title: "Initial Title",
    assignee: ["user-1"],
    dueDate: new Date(2024, 1, 15),
    priority: "medium",
  };

  it("saves updates when submitting", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();

    render(
      <EditObjectDialog
        open
        onOpenChange={onOpenChange}
        onSave={onSave}
        initialValues={initialValues}
        orgUsers={orgUsers}
      />
    );

    const assigneeTrigger = screen.getByRole("combobox");

    expect(screen.getByLabelText(/title/i)).toHaveValue(initialValues.title);
    expect(assigneeTrigger).toHaveTextContent("Alice Johnson");
    expect(screen.getByRole("button", { name: /february 15/i })).toBeInTheDocument();
    expect(screen.getByTestId("priority-trigger")).toHaveTextContent(initialValues.priority);

    await user.clear(screen.getByLabelText(/title/i));
    await user.type(screen.getByLabelText(/title/i), "Updated Title");

    // Click the remove button for Alice to deselect her first
    await user.click(screen.getByLabelText("Remove Alice Johnson"));

    await user.click(screen.getAllByText("Bob Smith")[0]);
    expect(assigneeTrigger).toHaveTextContent("Bob Smith");

    await user.click(screen.getByTestId("calendar"));

    await user.click(screen.getByText(/High/i));

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    expect(onSave).toHaveBeenCalledWith({
      title: "Updated Title",
      assignee: ["user-2"],
      dueDate: mockNewDueDate,
      priority: "high",
    });

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("closes without saving on cancel", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();

    render(
      <EditObjectDialog
        open
        onOpenChange={onOpenChange}
        onSave={onSave}
        initialValues={initialValues}
        orgUsers={orgUsers}
      />
    );

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onSave).not.toHaveBeenCalled();
  });
});
