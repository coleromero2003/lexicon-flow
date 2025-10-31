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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, Check, ListTodo, Trash2, GripVertical } from "lucide-react";
import { ObjectSubtask } from "@/lib/supabase/models";
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

interface SortableSubtaskProps {
  subtask: ObjectSubtask;
  onToggle: (id: number, isDone: boolean) => void;
  onDelete: (id: number) => void;
}

function SortableSubtask({ subtask, onToggle, onDelete }: SortableSubtaskProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group bg-white"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <Checkbox
        checked={subtask.is_done}
        onCheckedChange={(checked) => onToggle(subtask.id, checked as boolean)}
      />
      <span
        className={`text-sm flex-1 ${
          subtask.is_done ? "line-through text-gray-400" : "text-gray-900"
        }`}
      >
        {subtask.title}
      </span>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onDelete(subtask.id)}
        className="opacity-0 group-hover:opacity-100 text-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface SubtasksCardProps {
  subtasks: ObjectSubtask[];
  onToggle: (id: number, isDone: boolean) => Promise<void>;
  onAdd: (title: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onReorder: (reordered: ObjectSubtask[]) => Promise<void>;
}

export function SubtasksCard({
  subtasks,
  onToggle,
  onAdd,
  onDelete,
  onReorder,
}: SubtasksCardProps) {
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

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

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    await onAdd(newSubtaskTitle.trim());
    setNewSubtaskTitle("");
    setIsAddingSubtask(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            Subtasks
          </CardTitle>
          <CardDescription>Track progress with subtasks</CardDescription>
        </div>
        {!isAddingSubtask && (
          <Button
            data-testid="add-subtask-btn"
            size="sm"
            variant="outline"
            onClick={() => setIsAddingSubtask(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isAddingSubtask && (
          <div className="mb-4 flex gap-2">
            <Input
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="Subtask title"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddSubtask();
                if (e.key === "Escape") {
                  setIsAddingSubtask(false);
                  setNewSubtaskTitle("");
                }
              }}
              autoFocus
            />
            <Button onClick={handleAddSubtask} size="sm">
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddingSubtask(false);
                setNewSubtaskTitle("");
              }}
            >
              Cancel
            </Button>
          </div>
        )}

        {subtasks.length === 0 && !isAddingSubtask ? (
          <EmptyState
            icon={<ListTodo className="h-8 w-8" />}
            title="No subtasks"
            description="Break down this object into smaller tasks."
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddingSubtask(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Subtask
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
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
