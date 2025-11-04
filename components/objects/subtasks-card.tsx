"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, ListTodo, Trash2, GripVertical, Edit2, User, Calendar as CalendarIcon } from "lucide-react";
import { Task, ObjectPriority } from "@/lib/supabase/models";
import { AddTaskDialog } from "./add-task-dialog";
import { EditTaskDialog } from "./edit-task-dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";

interface OrgUser {
  userId: string;
  name: string;
}

interface SortableSubtaskProps {
  subtask: Task;
  onToggle: (id: number, isDone: boolean) => void;
  onDelete: (id: number) => void;
  onEdit: (task: Task) => void;
  orgUsers: OrgUser[];
}

const PRIORITY_CONFIG: Record<ObjectPriority, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-gray-100 text-gray-700 border-gray-300" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-700 border-blue-300" },
  high: { label: "High", color: "bg-orange-100 text-orange-700 border-orange-300" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700 border-red-300" },
};

function SortableSubtask({ subtask, onToggle, onDelete, onEdit, orgUsers }: SortableSubtaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subtask.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const assignedUsers = orgUsers.filter((user) =>
    subtask.assignee?.includes(user.userId)
  );

  const priorityConfig = PRIORITY_CONFIG[subtask.priority || "medium"];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors group bg-white border border-gray-200"
    >
      <div className="flex items-start gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 mt-1"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <Checkbox
          checked={subtask.is_done}
          onCheckedChange={(checked) => onToggle(subtask.id, checked as boolean)}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span
              className={`text-sm font-medium ${
                subtask.is_done ? "line-through text-gray-400" : "text-gray-900"
              }`}
            >
              {subtask.title}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(subtask)}
                className="h-7 w-7 p-0"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(subtask.id)}
                className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {subtask.details && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {subtask.details}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-2">
            {/* Priority Badge */}
            <Badge variant="outline" className={`text-xs ${priorityConfig.color}`}>
              {priorityConfig.label}
            </Badge>

            {/* Assignees */}
            {assignedUsers.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <User className="h-3 w-3" />
                <span className="line-clamp-1">
                  {assignedUsers.map((u) => u.name).join(", ")}
                </span>
              </div>
            )}

            {/* Due Date */}
            {subtask.due_date && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <CalendarIcon className="h-3 w-3" />
                <span>{format(new Date(subtask.due_date), "MMM d, yyyy")}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface SubtasksCardProps {
  subtasks: Task[];
  onToggle: (id: number, isDone: boolean) => Promise<void>;
  onAdd: (
    title: string,
    details?: string,
    assignee?: string[],
    dueDate?: Date,
    priority?: ObjectPriority
  ) => Promise<void>;
  onUpdate: (
    taskId: number,
    updates: Partial<Task>
  ) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onReorder: (reordered: Task[]) => Promise<void>;
  orgUsers: OrgUser[];
}

export function SubtasksCard({
  subtasks,
  onToggle,
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
  orgUsers,
}: SubtasksCardProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = subtasks.findIndex((s) => s.id === active.id);
    const newIndex = subtasks.findIndex((s) => s.id === over.id);

    const reordered = arrayMove(subtasks, oldIndex, newIndex);
    await onReorder(reordered);
  };

  const handleAddTask = async (task: {
    title: string;
    details?: string;
    assignee?: string[];
    dueDate?: Date;
    priority?: ObjectPriority;
  }) => {
    await onAdd(
      task.title,
      task.details,
      task.assignee,
      task.dueDate,
      task.priority
    );
  };

  const handleEditTask = async (
    taskId: number,
    updates: Partial<Task>
  ) => {
    await onUpdate(taskId, updates);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              Tasks
            </CardTitle>
            <CardDescription>Track progress with detailed tasks</CardDescription>
          </div>
          <Button
            data-testid="add-subtask-btn"
            size="sm"
            variant="outline"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
        </CardHeader>
        <CardContent>
          {subtasks.length === 0 ? (
            <EmptyState
              icon={<ListTodo className="h-8 w-8" />}
              title="No tasks"
              description="Break down this object into smaller tasks."
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Task
                </Button>
              }
            />
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={subtasks.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {subtasks.map((subtask) => (
                    <SortableSubtask
                      key={subtask.id}
                      subtask={subtask}
                      onToggle={onToggle}
                      onDelete={onDelete}
                      onEdit={handleOpenEdit}
                      orgUsers={orgUsers}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <AddTaskDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddTask}
        orgUsers={orgUsers}
      />

      <EditTaskDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        task={editingTask}
        onSubmit={handleEditTask}
        orgUsers={orgUsers}
      />
    </>
  );
}
