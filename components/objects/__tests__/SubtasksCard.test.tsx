import "@testing-library/jest-dom";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

(globalThis as unknown as { React?: typeof React }).React = React;

let latestDragEnd: ((event: { active: { id: number }; over: { id: number } | null }) => void) | null = null;

vi.mock("@dnd-kit/core", () => {
  const React = require("react");
  return {
    DndContext: ({ onDragEnd, children }: React.PropsWithChildren<{ onDragEnd?: typeof latestDragEnd }>) => {
      latestDragEnd = onDragEnd ?? null;
      return <div data-testid="dnd-context">{children}</div>;
    },
    PointerSensor: vi.fn(),
    KeyboardSensor: vi.fn(),
    closestCenter: vi.fn(),
    useSensor: vi.fn((sensor: unknown) => sensor),
    useSensors: (...sensors: unknown[]) => sensors,
    __triggerDragEnd: (event: { active: { id: number }; over: { id: number } | null }) => {
      latestDragEnd?.(event);
    },
    __reset: () => {
      latestDragEnd = null;
    },
  };
});

vi.mock("@dnd-kit/sortable", () => {
  const React = require("react");
  return {
    SortableContext: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    sortableKeyboardCoordinates: vi.fn(),
    verticalListSortingStrategy: vi.fn(),
    useSortable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      transition: null,
      isDragging: false,
    }),
    arrayMove: <T,>(items: T[], from: number, to: number) => {
      const copy = [...items];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    },
  };
});

import { SubtasksCard } from "../subtasks-card";
import { Task } from "@/lib/supabase/models";

const triggerDragEnd = (event: { active: { id: number }; over: { id: number } | null }) => {
  latestDragEnd?.(event);
};

describe("SubtasksCard", () => {
  beforeEach(() => {
    latestDragEnd = null;
    vi.clearAllMocks();
  });

  const createHandlers = () => ({
    onToggle: vi.fn().mockResolvedValue(undefined),
    onAdd: vi.fn().mockResolvedValue(undefined),
    onDelete: vi.fn().mockResolvedValue(undefined),
    onReorder: vi.fn().mockResolvedValue(undefined),
  });

  it("renders empty state and add CTA when there are no subtasks", () => {
    const handlers = createHandlers();

    render(
      <SubtasksCard
        subtasks={[]}
        onToggle={handlers.onToggle}
        onAdd={handlers.onAdd}
        onDelete={handlers.onDelete}
        onReorder={handlers.onReorder}
      />
    );

    expect(screen.getByText(/no subtasks/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Add$/i })).toBeInTheDocument();
  });

  it("adds a subtask and allows cancelling with escape", async () => {
    const user = userEvent.setup();
    const handlers = createHandlers();

    render(
      <SubtasksCard
        subtasks={[]}
        onToggle={handlers.onToggle}
        onAdd={handlers.onAdd}
        onDelete={handlers.onDelete}
        onReorder={handlers.onReorder}
      />
    );

    await user.click(screen.getByRole("button", { name: /^Add$/i }));

    const input = screen.getByPlaceholderText(/subtask title/i);
    await user.type(input, "  New subtask  ");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(handlers.onAdd).toHaveBeenCalledWith("New subtask");
    });

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/subtask title/i)).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /^Add$/i }));
    const secondInput = screen.getByPlaceholderText(/subtask title/i);
    await user.type(secondInput, "Another subtask");
    await user.keyboard("{Escape}");

    expect(handlers.onAdd).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/subtask title/i)).not.toBeInTheDocument();
    });
  });

  it("toggles, deletes, and reorders subtasks", async () => {
    const user = userEvent.setup();
    const handlers = createHandlers();

    const subtasks: Task[] = [
      { id: 1, object_id: 100, title: "First subtask", is_done: false, sort_order: 0 },
      { id: 2, object_id: 100, title: "Second subtask", is_done: true, sort_order: 1 },
      { id: 3, object_id: 100, title: "Third subtask", is_done: false, sort_order: 2 },
    ];

    render(
      <SubtasksCard
        subtasks={subtasks}
        onToggle={handlers.onToggle}
        onAdd={handlers.onAdd}
        onDelete={handlers.onDelete}
        onReorder={handlers.onReorder}
      />
    );

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);

    await waitFor(() => {
      expect(handlers.onToggle).toHaveBeenCalledWith(subtasks[0].id, true);
    });

    const deleteButtons = Array.from(screen.getAllByRole("button", { hidden: true })).filter((button) =>
      button.classList.contains("text-red-600")
    );
    await user.click(deleteButtons[1]);

    await waitFor(() => {
      expect(handlers.onDelete).toHaveBeenCalledWith(subtasks[1].id);
    });

    triggerDragEnd({ active: { id: subtasks[2].id }, over: { id: subtasks[0].id } });

    await waitFor(() => {
      expect(handlers.onReorder).toHaveBeenCalledWith([
        subtasks[2],
        subtasks[0],
        subtasks[1],
      ]);
    });
  });
});
