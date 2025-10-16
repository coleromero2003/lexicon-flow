"use client";

import React from "react";
import Navbar from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useWorkflow } from "@/lib/hooks/useWorkflows";
import { StepWithObjects, ScadaObject } from "@/lib/supabase/models";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { Calendar, MoreHorizontal, Plus, User, ArrowLeft } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function DroppableStep({
  step,
  children,
  onCreateObject,
  onEditStep,
}: {
  step: StepWithObjects;
  children: React.ReactNode;
  onCreateObject: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onEditStep: (step: StepWithObjects) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: step.id });
  return (
    <div
      ref={setNodeRef}
      className={`w-full lg:flex-shrink-0 lg:w-80 ${
        isOver ? "bg-blue-50 rounded-lg" : ""
      }`}
    >
      <div
        className={`bg-white rounded-lg shadow-sm border ${
          isOver ? "ring-2 ring-blue-300" : ""
        }`}
      >
        {/* Step Header */}
        <div className="p-3 sm:p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                {step.title}
              </h3>
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                {step.objects.length}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="flex-shrink-0"
              onClick={() => onEditStep(step)}
            >
              <MoreHorizontal />
            </Button>
          </div>
        </div>

        {/* step content */}
        <div className="p-2">
          {children}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                className="w-full mt-3 text-gray-500 hover:text-gray-700"
              >
                <Plus />
                Add Object
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
              <DialogHeader>
                <DialogTitle>Create New Object</DialogTitle>
                <p className="text-sm text-gray-600">Add an object to the workflow</p>
              </DialogHeader>

              <form className="space-y-4" onSubmit={onCreateObject}>
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Enter object title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Enter object description"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Assignee</Label>
                  <Input
                    id="assignee"
                    name="assignee"
                    placeholder="Who should work on this?"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select name="priority" defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["low", "medium", "high", "urgent"].map((priority, key) => (
                        <SelectItem key={key} value={priority}>
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" id="dueDate" name="dueDate" />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="submit">Create Object</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

function SortableObject({ object }: { object: ScadaObject }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: object.id });

  const styles = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  function getPriorityColor(priority: "low" | "medium" | "high" | "urgent"): string {
    switch (priority) {
      case "urgent":
        return "bg-red-600";
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-yellow-500";
    }
  }
  return (
    <div ref={setNodeRef} style={styles} {...listeners} {...attributes}>
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-3 sm:p-4">
          <div className="space-y-2 sm:space-y-3">
            {/* Object Header */}
            <div className="flex items-start justify-between">
              <h4 className="font-medium text-gray-900 text-sm leading-tight flex-1 min-w-0 pr-2">
                {object.title}
              </h4>
            </div>

            {/* Object Description */}
            <p className="text-xs text-gray-600 line-clamp-2">
              {object.description_md || "No description."}
            </p>

            {/* Object Meta */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
                {object.assignee && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <User className="h-3 w-3" />
                    <span className="truncate">{object.assignee}</span>
                  </div>
                )}
                {object.due_date && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span className="truncate">{object.due_date}</span>
                  </div>
                )}
              </div>
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityColor(
                  object.priority
                )}`}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ObjectOverlay({ object }: { object: ScadaObject }) {
  function getPriorityColor(priority: "low" | "medium" | "high" | "urgent"): string {
    switch (priority) {
      case "urgent":
        return "bg-red-600";
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-yellow-500";
    }
  }
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-2 sm:space-y-3">
          {/* Object Header */}
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-gray-900 text-sm leading-tight flex-1 min-w-0 pr-2">
              {object.title}
            </h4>
          </div>

          {/* Object Description */}
          <p className="text-xs text-gray-600 line-clamp-2">
            {object.description_md || "No description."}
          </p>

          {/* Object Meta */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
              {object.assignee && (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <User className="h-3 w-3" />
                  <span className="truncate">{object.assignee}</span>
                </div>
              )}
              {object.due_date && (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  <span className="truncate">{object.due_date}</span>
                </div>
              )}
            </div>
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityColor(
                object.priority
              )}`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function WorkflowPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const workflowId = parseInt(id, 10);
  const {
    workflow,
    createStep,
    updateWorkflow,
    steps,
    createRealObject,
    setSteps,
    moveObject,
    updateStep,
  } = useWorkflow(workflowId);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newColor, setNewColor] = useState("");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreatingStep, setIsCreatingStep] = useState(false);
  const [isEditingStep, setIsEditingStep] = useState(false);

  const [newStepTitle, setNewStepTitle] = useState("");
  const [editingStepTitle, setEditingStepTitle] = useState("");
  const [editingStep, setEditingStep] = useState<StepWithObjects | null>(
    null
  );

  const [filters, setFilters] = useState({
    priority: [] as string[],
    assignee: [] as string[],
    dueDate: null as string | null,
  });

  const [activeObject, setActiveObject] = useState<ScadaObject | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  function handleFilterChange(
    type: "priority" | "assignee" | "dueDate",
    value: string | string[] | null
  ) {
    setFilters((prev) => ({
      ...prev,
      [type]: value,
    }));
  }

  function clearFilters() {
    setFilters({
      priority: [] as string[],
      assignee: [] as string[],
      dueDate: null as string | null,
    });
  }

  async function handleUpdateWorkflow(e: React.FormEvent) {
    e.preventDefault();

    if (!newTitle.trim() || !workflow) return;

    try {
      await updateWorkflow(workflow.id, {
        name: newTitle.trim(),
        color: newColor || workflow.color,
      });
      setIsEditingTitle(false);
    } catch {}
  }

  async function createObject(objectData: {
    title: string;
    description?: string;
    assignee?: string;
    dueDate?: string;
    priority: "low" | "medium" | "high" | "urgent";
  }) {
    const targetStep = steps[0];
    if (!targetStep) {
      throw new Error("No step available to add object");
    }

    await createRealObject(targetStep.id, objectData);
  }

  async function handleCreateObject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const objectData = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || undefined,
      assignee: (formData.get("assignee") as string) || undefined,
      dueDate: (formData.get("dueDate") as string) || undefined,
      priority:
        (formData.get("priority") as "low" | "medium" | "high" | "urgent") || "medium",
    };

    if (objectData.title.trim()) {
      await createObject(objectData);

      const trigger = document.querySelector(
        '[data-state="open"]'
      ) as HTMLElement;
      if (trigger) trigger.click();
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const objectId = Number(event.active.id);
    const object = steps
      .flatMap((step) => step.objects)
      .find((obj) => obj.id === objectId);

    if (object) {
      setActiveObject(object);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = Number(active.id);
    const overId = Number(over.id);

    const sourceStep = steps.find((step) =>
      step.objects.some((obj) => obj.id === activeId)
    );

    const targetStep = steps.find((step) =>
      step.objects.some((obj) => obj.id === overId)
    );

    if (!sourceStep || !targetStep) return;

    if (sourceStep.id === targetStep.id) {
      const activeIndex = sourceStep.objects.findIndex(
        (obj) => obj.id === activeId
      );

      const overIndex = targetStep.objects.findIndex(
        (obj) => obj.id === overId
      );

      if (activeIndex !== overIndex) {
        setSteps((prev: StepWithObjects[]) => {
          const newSteps = [...prev];
          const step = newSteps.find((s) => s.id === sourceStep.id);
          if (step) {
            const objects = [...step.objects];
            const [removed] = objects.splice(activeIndex, 1);
            objects.splice(overIndex, 0, removed);
            step.objects = objects;
          }
          return newSteps;
        });
      }
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const objectId = Number(active.id);
    const overId = Number(over.id);

    const targetStep = steps.find((step) => step.id === overId);
    if (targetStep) {
      const sourceStep = steps.find((step) =>
        step.objects.some((obj) => obj.id === objectId)
      );

      if (sourceStep && sourceStep.id !== targetStep.id) {
        await moveObject(objectId, targetStep.id, targetStep.objects.length);
      }
    } else {
      // Check to see if were dropping on another object
      const sourceStep = steps.find((step) =>
        step.objects.some((obj) => obj.id === objectId)
      );

      const targetStep = steps.find((step) =>
        step.objects.some((obj) => obj.id === overId)
      );

      if (sourceStep && targetStep) {
        const oldIndex = sourceStep.objects.findIndex(
          (obj) => obj.id === objectId
        );

        const newIndex = targetStep.objects.findIndex(
          (obj) => obj.id === overId
        );

        if (oldIndex !== newIndex) {
          await moveObject(objectId, targetStep.id, newIndex);
        }
      }
    }
  }

  async function handleCreateStep(e: React.FormEvent) {
    e.preventDefault();

    if (!newStepTitle.trim()) return;

    await createStep(newStepTitle.trim());

    setNewStepTitle("");
    setIsCreatingStep(false);
  }

  async function handleUpdateStep(e: React.FormEvent) {
    e.preventDefault();

    if (!editingStepTitle.trim() || !editingStep) return;

    await updateStep(editingStep.id, editingStepTitle.trim());

    setEditingStepTitle("");
    setIsEditingStep(false);
    setEditingStep(null);
  }

  function handleEditStep(step: StepWithObjects) {
    setIsEditingStep(true);
    setEditingStep(step);
    setEditingStepTitle(step.title);
  }

  const filteredSteps = steps.map((step) => ({
    ...step,
    objects: step.objects.filter((obj) => {
      // Filter by priority
      if (
        filters.priority.length > 0 &&
        !filters.priority.includes(obj.priority)
      ) {
        return false;
      }

      // Filter by due date
      if (filters.dueDate && obj.due_date) {
        const objDate = new Date(obj.due_date).toDateString();
        const filterDate = new Date(filters.dueDate).toDateString();

        if (objDate !== filterDate) {
          return false;
        }
      }

      return true;
    }),
  }));

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <Navbar
          boardTitle={workflow?.name ?? undefined}
          onEditBoard={() => {
            setNewTitle(workflow?.name ?? "");
            setNewColor(workflow?.color ?? "");
            setIsEditingTitle(true);
          }}
          onFilterClick={() => setIsFilterOpen(true)}
          filterCount={Object.values(filters).reduce(
            (count, v) =>
              count + (Array.isArray(v) ? v.length : v !== null ? 1 : 0),
            0
          )}
        />

        <Dialog open={isEditingTitle} onOpenChange={setIsEditingTitle}>
          <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
            <DialogHeader>
              <DialogTitle>Edit Workflow</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleUpdateWorkflow}>
              <div className="space-y-2">
                <Label htmlFor="workflowTitle">Workflow Name</Label>
                <Input
                  id="workflowTitle"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter workflow name..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Workflow Color</Label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {[
                    "#3b82f6",
                    "#10b981",
                    "#f59e0b",
                    "#ef4444",
                    "#8b5cf6",
                    "#ec4899",
                    "#6366f1",
                    "#6b7280",
                    "#f97316",
                    "#14b8a6",
                    "#06b6d4",
                    "#10b981",
                  ].map((color, key) => (
                    <button
                      key={key}
                      type="button"
                      className={`w-8 h-8 rounded-full ${
                        color === newColor
                          ? "ring-2 ring-offset-2 ring-gray-900"
                          : ""
                      } `}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewColor(color)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditingTitle(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
            <DialogHeader>
              <DialogTitle>Filter Objects</DialogTitle>
              <p className="text-sm text-gray-600">
                Filter objects by priority, assignee, or due date
              </p>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <div className="flex flex-wrap gap-2">
                  {["low", "medium", "high", "urgent"].map((priority, key) => (
                    <Button
                      onClick={() => {
                        const newPriorities = filters.priority.includes(
                          priority
                        )
                          ? filters.priority.filter((p) => p !== priority)
                          : [...filters.priority, priority];

                        handleFilterChange("priority", newPriorities);
                      }}
                      key={key}
                      variant={
                        filters.priority.includes(priority)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                    >
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={filters.dueDate || ""}
                  onChange={(e) =>
                    handleFilterChange("dueDate", e.target.value || null)
                  }
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant={"outline"}
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
                <Button type="button" onClick={() => setIsFilterOpen(false)}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Workflow Content */}
        <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.push(`/workflows?projectId=${projectId}`)}
          >
            <ArrowLeft className="mr-2" />
            Back to Workflows
          </Button>

          {/* Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Total Objects: </span>
                {steps.reduce((sum, step) => sum + step.objects.length, 0)}
              </div>
            </div>

            {/* Add object dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus />
                  Add Object
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
                <DialogHeader>
                  <DialogTitle>Create New Object</DialogTitle>
                  <p className="text-sm text-gray-600">
                    Add an object to the workflow
                  </p>
                </DialogHeader>

                <form className="space-y-4" onSubmit={handleCreateObject}>
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="Enter object title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Enter object description"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Assignee</Label>
                    <Input
                      id="assignee"
                      name="assignee"
                      placeholder="Who should work on this?"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select name="priority" defaultValue="medium">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["low", "medium", "high", "urgent"].map((priority, key) => (
                          <SelectItem key={key} value={priority}>
                            {priority.charAt(0).toUpperCase() +
                              priority.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input type="date" id="dueDate" name="dueDate" />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="submit">Create Object</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Workflow Steps */}
          <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div
              className="flex flex-col lg:flex-row lg:space-x-6 lg:overflow-x-auto
            lg:pb-6 lg:px-2 lg:-mx-2 lg:[&::-webkit-scrollbar]:h-2
            lg:[&::-webkit-scrollbar-track]:bg-gray-100
            lg:[&::-webkit-scrollbar-thumb]:bg-gray-300 lg:[&::-webkit-scrollbar-thumb]:rounded-full
            space-y-4 lg:space-y-0"
            >
              {filteredSteps.map((step, key) => (
                <DroppableStep
                  key={key}
                  step={step}
                  onCreateObject={handleCreateObject}
                  onEditStep={handleEditStep}
                >
                  <SortableContext
                    items={step.objects.map((obj) => obj.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {step.objects.map((obj, key) => (
                        <SortableObject object={obj} key={key} />
                      ))}
                    </div>
                  </SortableContext>
                </DroppableStep>
              ))}

              <div className="w-full lg:flex-shrink-0 lg:w-80">
                <Button
                  variant="outline"
                  className="w-full h-full min-h-[200px] border-dashed border-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setIsCreatingStep(true)}
                >
                  <Plus />
                  Add another step
                </Button>
              </div>

              <DragOverlay>
                {activeObject ? <ObjectOverlay object={activeObject} /> : null}
              </DragOverlay>
            </div>
          </DndContext>
        </main>
      </div>

      <Dialog open={isCreatingStep} onOpenChange={setIsCreatingStep}>
        <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
          <DialogHeader>
            <DialogTitle>Create New Step</DialogTitle>
            <p className="text-sm text-gray-600">
              Add new step to organize your objects
            </p>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreateStep}>
            <div className="space-y-2">
              <Label>Step Title</Label>
              <Input
                id="stepTitle"
                value={newStepTitle}
                onChange={(e) => setNewStepTitle(e.target.value)}
                placeholder="Enter step title..."
                required
              />
            </div>
            <div className="space-x-2 flex justify-end">
              <Button
                type="button"
                onClick={() => setIsCreatingStep(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button type="submit">Create Step</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditingStep} onOpenChange={setIsEditingStep}>
        <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
          <DialogHeader>
            <DialogTitle>Edit Step</DialogTitle>
            <p className="text-sm text-gray-600">
              Update the title of your step
            </p>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleUpdateStep}>
            <div className="space-y-2">
              <Label>Step Title</Label>
              <Input
                id="stepTitle"
                value={editingStepTitle}
                onChange={(e) => setEditingStepTitle(e.target.value)}
                placeholder="Enter step title..."
                required
              />
            </div>
            <div className="space-x-2 flex justify-end">
              <Button
                type="button"
                onClick={() => {
                  setIsEditingStep(false);
                  setEditingStepTitle("");
                  setEditingStep(null);
                }}
                variant="outline"
              >
                Cancel
              </Button>
              <Button type="submit">Edit Step</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
