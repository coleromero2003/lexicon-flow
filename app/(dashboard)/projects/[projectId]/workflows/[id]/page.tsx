"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Calendar, MoreHorizontal, Plus, User, Link2, Trash2, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { objectService } from "@/lib/services";
import { useSupabase } from "@/lib/supabase/SupabaseProvider";
import { useOrganizationUsers } from "@/lib/hooks/useOrganizationUsers";
import { OrganizationUserCombobox } from "@/components/people/organization-user-combobox";
import { BackButton } from "@/components/ui/back-button";
import { getPriorityColor } from "@/components/objects/constants";
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
  onDeleteStep,
  onMoveStep,
  onLinkObject,
  organizationUsers,
  loadingUsers,
  assigneeValue,
  onAssigneeChange,
  canMoveLeft,
  canMoveRight,
}: {
  step: StepWithObjects;
  children: React.ReactNode;
  onCreateObject: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onEditStep: (step: StepWithObjects) => void;
  onDeleteStep: (step: StepWithObjects) => void;
  onMoveStep: (step: StepWithObjects, direction: 'left' | 'right') => void;
  onLinkObject: (stepId: number) => void;
  organizationUsers: Array<{ userId: string; name: string; email?: string }>;
  loadingUsers: boolean;
  assigneeValue: string[];
  onAssigneeChange: (userIds: string[]) => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: step.id });
  return (
    <div
      data-testid="step-item"
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0"
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditStep(step)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Step
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onMoveStep(step, 'left')}
                  disabled={!canMoveLeft}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Move Left
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onMoveStep(step, 'right')}
                  disabled={!canMoveRight}
                >
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Move Right
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDeleteStep(step)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Step
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* step content */}
        <div className="p-2">
          {children}
          <div className="flex gap-2 mt-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex-1 text-gray-500 hover:text-gray-700"
                >
                  <Plus />
                  Create New
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
                  <Label>Assignees</Label>
                  <OrganizationUserCombobox
                    users={organizationUsers}
                    value={assigneeValue}
                    onChange={onAssigneeChange}
                    multiple={true}
                    placeholder="Select assignees..."
                    searchPlaceholder="Search users..."
                    emptyText="No users found."
                    loading={loadingUsers}
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
          <Button
            variant="ghost"
            className="flex-1 text-gray-500 hover:text-gray-700"
            onClick={() => onLinkObject(step.id)}
          >
            <Link2 className="h-4 w-4" />
            Link Existing
          </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SortableObject({
  object,
  projectId,
  organizationUsers
}: {
  object: ScadaObject;
  projectId: string;
  organizationUsers: Array<{ userId: string; name: string; email?: string }>;
}) {
  const router = useRouter();
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

  const handleClick = () => {
    // Prevent navigation when dragging
    if (isDragging) return;
    router.push(`/projects/${projectId}/objects/${object.id}`);
  };

  return (
    <div ref={setNodeRef} style={styles} {...listeners} {...attributes}>
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleClick}>
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
              {object.description_md
                ? object.description_md
                    .replace(/[#*_~`>\[\]]/g, '') // Strip markdown symbols
                    .replace(/\n+/g, ' ') // Replace newlines with spaces
                    .trim() || "No description."
                : "No description."}
            </p>

            {/* Object Meta */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
                {object.assignee && object.assignee.length > 0 && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <User className="h-3 w-3" />
                    <span className="truncate">
                      {object.assignee.length === 1
                        ? organizationUsers.find(u => u.userId === object.assignee[0])?.name || object.assignee[0]
                        : `${object.assignee.length} assignees`}
                    </span>
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
            {object.description_md
              ? object.description_md
                  .replace(/[#*_~`>\[\]]/g, '') // Strip markdown symbols
                  .replace(/\n+/g, ' ') // Replace newlines with spaces
                  .trim() || "No description."
              : "No description."}
          </p>

          {/* Object Meta */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
              {object.assignee && object.assignee.length > 0 && (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <User className="h-3 w-3" />
                  <span className="truncate">
                    {object.assignee.length === 1
                      ? "1 assignee"
                      : `${object.assignee.length} assignees`}
                  </span>
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
  const { id, projectId } = useParams<{ id: string; projectId: string }>();
  const workflowId = parseInt(id, 10);
  const {
    workflow,
    createStep,
    updateWorkflow,
    steps,
    createRealObject,
    linkExistingObject,
    setSteps,
    moveObject,
    updateStep,
    deleteStep,
  } = useWorkflow(workflowId);
  const { supabase } = useSupabase();
  const { users: organizationUsers, loading: loadingUsers } = useOrganizationUsers();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newColor, setNewColor] = useState("");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreatingStep, setIsCreatingStep] = useState(false);
  const [isEditingStep, setIsEditingStep] = useState(false);
  const [isLinkingObject, setIsLinkingObject] = useState(false);
  const [isDeletingStep, setIsDeletingStep] = useState(false);

  const [newStepTitle, setNewStepTitle] = useState("");
  const [editingStepTitle, setEditingStepTitle] = useState("");
  const [editingStep, setEditingStep] = useState<StepWithObjects | null>(
    null
  );
  const [stepToDelete, setStepToDelete] = useState<StepWithObjects | null>(
    null
  );

  const [availableObjects, setAvailableObjects] = useState<ScadaObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string>("");
  const [targetStepForLink, setTargetStepForLink] = useState<number | null>(null);

  // Assignee states for the two different create object dialogs (supporting multiple assignees)
  const [stepDialogAssignee, setStepDialogAssignee] = useState<string[]>([]);
  const [mainDialogAssignee, setMainDialogAssignee] = useState<string[]>([]);

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

  // Load available objects when linking dialog opens
  useEffect(() => {
    if (isLinkingObject && supabase && workflow) {
      loadAvailableObjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLinkingObject, supabase, workflow]);

  async function loadAvailableObjects() {
    if (!supabase || !workflow) return;
    try {
      const allObjects = await objectService.getObjectsByProject(
        supabase,
        workflow.project_id
      );
      // Filter out objects already in this workflow
      const objectIdsInWorkflow = steps.flatMap((step) =>
        step.objects.map((obj) => obj.id)
      );
      const available = allObjects.filter(
        (obj) => !objectIdsInWorkflow.includes(obj.id)
      );
      setAvailableObjects(available);
    } catch (error) {
      console.error("Failed to load objects:", error);
    }
  }

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
    assignee: string[];
    dueDate?: string;
    priority: "low" | "medium" | "high" | "urgent";
  }) {
    const targetStep = steps[0];
    if (!targetStep) {
      throw new Error("No step available to add object");
    }

    await createRealObject(targetStep.id, objectData);
  }

  async function handleCreateObjectFromStep(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const objectData = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || undefined,
      assignee: stepDialogAssignee,
      dueDate: (formData.get("dueDate") as string) || undefined,
      priority:
        (formData.get("priority") as "low" | "medium" | "high" | "urgent") || "medium",
    };

    if (objectData.title.trim()) {
      await createObject(objectData);
      setStepDialogAssignee([]); // Reset assignees after creation

      const trigger = document.querySelector(
        '[data-state="open"]'
      ) as HTMLElement;
      if (trigger) trigger.click();
    }
  }

  async function handleCreateObjectFromMain(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const objectData = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || undefined,
      assignee: mainDialogAssignee,
      dueDate: (formData.get("dueDate") as string) || undefined,
      priority:
        (formData.get("priority") as "low" | "medium" | "high" | "urgent") || "medium",
    };

    if (objectData.title.trim()) {
      await createObject(objectData);
      setMainDialogAssignee([]); // Reset assignees after creation

      const trigger = document.querySelector(
        '[data-state="open"]'
      ) as HTMLElement;
      if (trigger) trigger.click();
    }
  }

  function handleOpenLinkDialog(stepId: number) {
    setTargetStepForLink(stepId);
    setIsLinkingObject(true);
  }

  async function handleLinkExistingObject() {
    if (!selectedObjectId || !targetStepForLink) return;

    try {
      await linkExistingObject(parseInt(selectedObjectId, 10), targetStepForLink);
      setIsLinkingObject(false);
      setSelectedObjectId("");
      setTargetStepForLink(null);
    } catch (error) {
      console.error("Failed to link object:", error);
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

  function handleDeleteStepClick(step: StepWithObjects) {
    setStepToDelete(step);
    setIsDeletingStep(true);
  }

  async function handleConfirmDeleteStep() {
    if (!stepToDelete) return;

    try {
      await deleteStep(stepToDelete.id);
      setIsDeletingStep(false);
      setStepToDelete(null);
    } catch (error) {
      console.error("Failed to delete step:", error);
    }
  }

  async function handleMoveStep(step: StepWithObjects, direction: 'left' | 'right') {
    const currentIndex = steps.findIndex(s => s.id === step.id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= steps.length) return;

    // Optimistically update the UI
    const newSteps = [...steps];
    const [movedStep] = newSteps.splice(currentIndex, 1);
    newSteps.splice(newIndex, 0, movedStep);
    setSteps(newSteps);

    // Update the positions in the database
    try {
      if (!supabase) throw new Error("Supabase client not initialized");

      // Update both steps' positions
      const { stepService } = await import("@/lib/services");
      await Promise.all([
        stepService.updateStepPosition(supabase, step.id, newIndex),
        stepService.updateStepPosition(supabase, newSteps[currentIndex].id, currentIndex),
      ]);
    } catch (error) {
      console.error("Failed to reorder steps:", error);
      // Revert on error
      setSteps(steps);
    }
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
      <div className="min-h-screen bg-gray-50 ">

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
          <BackButton fallbackHref={`/projects/${projectId}/workflows`} className="mb-4" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {workflow ? `Steps for ${workflow.name}` : 'Steps for an unassigned workflow'}
              </h1>

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

                <form className="space-y-4" onSubmit={handleCreateObjectFromMain}>
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
                    <Label>Assignees</Label>
                    <OrganizationUserCombobox
                      users={organizationUsers}
                      value={mainDialogAssignee}
                      onChange={setMainDialogAssignee}
                      multiple={true}
                      placeholder="Select assignees..."
                      searchPlaceholder="Search users..."
                      emptyText="No users found."
                      loading={loadingUsers}
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
            space-y-4 lg:space-y-0 max-w-full"
            >
              {filteredSteps.map((step, key) => (
                <DroppableStep
                  key={key}
                  step={step}
                  onCreateObject={handleCreateObjectFromStep}
                  onEditStep={handleEditStep}
                  onDeleteStep={handleDeleteStepClick}
                  onMoveStep={handleMoveStep}
                  onLinkObject={handleOpenLinkDialog}
                  organizationUsers={organizationUsers}
                  loadingUsers={loadingUsers}
                  assigneeValue={stepDialogAssignee}
                  onAssigneeChange={setStepDialogAssignee}
                  canMoveLeft={key > 0}
                  canMoveRight={key < filteredSteps.length - 1}
                >
                  <SortableContext
                    items={step.objects.map((obj) => obj.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {step.objects.map((obj, key) => (
                        <SortableObject
                          object={obj}
                          projectId={projectId}
                          organizationUsers={organizationUsers}
                          key={key}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DroppableStep>
              ))}

              <div className="w-full lg:flex-shrink-0 lg:w-80">
                <Button
                  data-testid="add-step-btn"
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

      <Dialog open={isLinkingObject} onOpenChange={setIsLinkingObject}>
        <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
          <DialogHeader>
            <DialogTitle>Link Existing Object</DialogTitle>
            <p className="text-sm text-gray-600">
              Select an object from the project to link to this workflow
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Object</Label>
              <Select value={selectedObjectId} onValueChange={setSelectedObjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an object..." />
                </SelectTrigger>
                <SelectContent>
                  {availableObjects.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500 text-center">
                      No available objects to link
                    </div>
                  ) : (
                    availableObjects.map((obj) => (
                      <SelectItem key={obj.id} value={obj.id.toString()}>
                        {obj.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-x-2 flex justify-end">
              <Button
                type="button"
                onClick={() => {
                  setIsLinkingObject(false);
                  setSelectedObjectId("");
                  setTargetStepForLink(null);
                }}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleLinkExistingObject}
                disabled={!selectedObjectId}
              >
                Link Object
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Step Confirmation Dialog */}
      <AlertDialog open={isDeletingStep} onOpenChange={setIsDeletingStep}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Step</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{stepToDelete?.title}&rdquo;? This action cannot be undone.
              {stepToDelete && stepToDelete.objects.length > 0 && (
                <span className="block mt-2 text-red-600 font-semibold">
                  Warning: This step contains {stepToDelete.objects.length} object{stepToDelete.objects.length !== 1 ? 's' : ''}.
                  Deleting this step will not delete the objects, but they will be removed from this workflow.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStepToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteStep}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
