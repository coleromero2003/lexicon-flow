import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { OrganizationUserCombobox } from "../organization-user-combobox";

(globalThis as unknown as { React?: typeof React }).React = React;

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

describe("OrganizationUserCombobox", () => {
  const users = [
    { userId: "user-1", name: "Alice Johnson", email: "alice@example.com" },
    { userId: "user-2", name: "Bob Smith", email: "bob@example.com" },
  ];

  it("renders the placeholder when no user is selected", () => {
    render(
      <OrganizationUserCombobox users={users} value={null} onChange={vi.fn()} />
    );

    expect(screen.getByRole("combobox")).toHaveTextContent("Select person...");
  });

  it("allows selecting and clearing a user", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    const { rerender } = render(
      <OrganizationUserCombobox
        users={users}
        value={null}
        onChange={handleChange}
        placeholder="Select assignee..."
        clearLabel="Clear selection"
      />
    );

    await user.click(screen.getByText("Bob Smith"));
    expect(handleChange).toHaveBeenCalledWith("user-2");

    rerender(
      <OrganizationUserCombobox
        users={users}
        value="user-2"
        onChange={handleChange}
        placeholder="Select assignee..."
        clearLabel="Clear selection"
      />
    );

    await user.click(screen.getByText("Clear selection"));
    expect(handleChange).toHaveBeenLastCalledWith(null);
  });
});
