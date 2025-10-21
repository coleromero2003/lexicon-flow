"use client";

import { useParams, useRouter } from "next/navigation";
import { useObject } from "@/lib/hooks/useObjects";
import { useSubtasks } from "@/lib/hooks/useSubtasks";
import { useObjectFiles } from "@/lib/hooks/useObjectFiles";
import { useObjectRelations } from "@/lib/hooks/useObjectRelations";
import { useObjectLexicon } from "@/lib/hooks/useObjectLexicon";
import { useOrganizationUsers } from "@/lib/hooks/useOrganizationUsers";
import { useMetadataSuggestions } from "@/lib/hooks/useMetadataSuggestions";
import { useSupabase } from "@/lib/supabase/SupabaseProvider";
import { objectService } from "@/lib/services";
import Navbar from "@/components/navbar";
import { useState, useCallback, useRef } from "react";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Flag,
  User,
  Plus,
  MoreHorizontal,
  Check,
  FileText,
  Workflow,
  Link2,
  Package,
  ListTodo,
  Settings,
  Trash2,
  Edit3,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { MarkdownEditor } from "@/components/mdx-editor";
import { MetadataEditor } from "@/components/metadata-editor";
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
import { ObjectSubtask } from "@/lib/supabase/models";

const PRIORITIES = [
  { value: "low", label: "Low", color: "bg-green-500" },
  { value: "medium", label: "Medium", color: "bg-yellow-500" },
  { value: "high", label: "High", color: "bg-red-500" },
  { value: "urgent", label: "Urgent", color: "bg-red-600" },
];

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

export default function ObjectPage() {
  const { objectId, projectId } = useParams<{
    objectId: string;
    projectId: string;
  }>();
  const router = useRouter();
  const parsedObjectId = parseInt(objectId, 10);
  const parsedProjectId = parseInt(projectId, 10);

  const { object, loading, error, updateObject } = useObject(parsedObjectId);
  const subtasksHook = useSubtasks(parsedObjectId);
  const filesHook = useObjectFiles(parsedObjectId);
  const relationsHook = useObjectRelations(parsedObjectId);
  const lexiconHook = useObjectLexicon(parsedObjectId);
  const { users: orgUsers } = useOrganizationUsers();
  const { suggestions: metadataSuggestions } = useMetadataSuggestions(parsedProjectId);
  const { supabase } = useSupabase();

  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: "",
    assignee: "",
    dueDate: undefined as Date | undefined,
    priority: "medium",
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Debounce timer ref for auto-save
  const descriptionTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleDescriptionChange = useCallback(
    (newMarkdown: string) => {
      // Clear existing timer
      if (descriptionTimerRef.current) {
        clearTimeout(descriptionTimerRef.current);
      }

      // Set new timer to save after 1 second of no typing
      descriptionTimerRef.current = setTimeout(async () => {
        if (!supabase) return;

        try {
          // Update directly without reloading the entire object to prevent refresh
          await objectService.updateObject(
            supabase,
            parsedObjectId,
            { description_md: newMarkdown }
          );
        } catch (err) {
          console.error("Failed to update description:", err);
          toast.error("Failed to update description");
        }
      }, 1000);
    },
    [supabase, parsedObjectId]
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = subtasksHook.subtasks.findIndex((s) => s.id === active.id);
    const newIndex = subtasksHook.subtasks.findIndex((s) => s.id === over.id);

    const reordered = arrayMove(subtasksHook.subtasks, oldIndex, newIndex);

    try {
      await subtasksHook.reorderSubtasks(reordered);
      toast.success("Subtasks reordered");
    } catch (err) {
      console.error("Failed to reorder subtasks:", err);
      toast.error("Failed to reorder subtasks");
    }
  };

  if (loading || subtasksHook.loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar boardTitle="Loading..." />
        <main className="container mx-auto px-4 py-6 sm:py-8">
          <Skeleton className="h-10 w-32 mb-4" />
          <div className="mb-6 sm:mb-8">
            <Skeleton className="h-10 w-96 mb-2" />
            <Skeleton className="h-4 w-64 mb-4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !object) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar boardTitle="Error" />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <EmptyState
            icon={<FileText className="h-12 w-12" />}
            title="Object not found"
            description={
              error ||
              "The object you're looking for doesn't exist or has been deleted."
            }
            action={
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const handleOpenEditSheet = () => {
    setEditForm({
      title: object.title,
      assignee: object.assignee || "",
      dueDate: object.due_date ? new Date(object.due_date) : undefined,
      priority: object.priority,
    });
    setIsEditSheetOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      await updateObject({
        title: editForm.title,
        assignee: editForm.assignee || null,
        due_date: editForm.dueDate?.toISOString() || null,
        priority: editForm.priority as "low" | "medium" | "high" | "urgent",
      });
      setIsEditSheetOpen(false);
      toast.success("Object updated successfully");
    } catch (err) {
      console.error("Failed to update object:", err);
      toast.error("Failed to update object");
    }
  };

  const handleToggleSubtask = async (subtaskId: number, isDone: boolean) => {
    try {
      await subtasksHook.toggleSubtask(subtaskId, isDone);
      toast.success(isDone ? "Subtask completed" : "Subtask reopened");
    } catch (err) {
      console.error("Failed to toggle subtask:", err);
      toast.error("Failed to update subtask");
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    try {
      await subtasksHook.createSubtask(newSubtaskTitle.trim());
      setNewSubtaskTitle("");
      setIsAddingSubtask(false);
      toast.success("Subtask added");
    } catch (err) {
      console.error("Failed to add subtask:", err);
      toast.error("Failed to add subtask");
    }
  };

  const handleDeleteSubtask = async (subtaskId: number) => {
    try {
      await subtasksHook.deleteSubtask(subtaskId);
      toast.success("Subtask deleted");
    } catch (err) {
      console.error("Failed to delete subtask:", err);
      toast.error("Failed to delete subtask");
    }
  };

  const handleMetadataUpdate = async (newMetadata: Record<string, unknown>) => {
    try {
      await updateObject({ metadata: newMetadata });
      toast.success("Properties updated");
    } catch (err) {
      console.error("Failed to update properties:", err);
      toast.error("Failed to update properties");
    }
  };

  const getPriorityColor = (priority: string) => {
    const p = PRIORITIES.find((pr) => pr.value === priority);
    return p?.color || "bg-gray-500";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar boardTitle={object.title} />

      <main className="container mx-auto px-4 py-6 sm:py-8">
        {/* Back Button */}
        <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Workflow
        </Button>

        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {object.title}
              </h1>
              <p className="text-sm text-gray-500">
                Created {new Date(object.created_at).toLocaleDateString()} •
                Last updated{" "}
                {new Date(object.updated_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenEditSheet}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Edit Object</SheetTitle>
                    <SheetDescription>
                      Make changes to your object details here.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="space-y-4 mt-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={editForm.title}
                        onChange={(e) =>
                          setEditForm({ ...editForm, title: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Assignee</Label>
                      <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={assigneeOpen}
                            className="w-full justify-between"
                          >
                            {editForm.assignee
                              ? orgUsers.find((u) => u.userId === editForm.assignee)
                                  ?.name || editForm.assignee
                              : "Select assignee..."}
                            <User className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search users..." />
                            <CommandList>
                              <CommandEmpty>No user found.</CommandEmpty>
                              <CommandGroup>
                                {orgUsers.map((user) => (
                                  <CommandItem
                                    key={user.userId}
                                    value={user.userId}
                                    onSelect={(currentValue) => {
                                      setEditForm({
                                        ...editForm,
                                        assignee: currentValue,
                                      });
                                      setAssigneeOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        editForm.assignee === user.userId
                                          ? "opacity-100"
                                          : "opacity-0"
                                      }`}
                                    />
                                    {user.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Due Date</Label>
                      <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {editForm.dueDate ? (
                              format(editForm.dueDate, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={editForm.dueDate}
                            onSelect={(date) => {
                              setEditForm({ ...editForm, dueDate: date });
                              setDueDateOpen(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={editForm.priority}
                        onValueChange={(value) =>
                          setEditForm({ ...editForm, priority: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITIES.map((priority) => (
                            <SelectItem key={priority.value} value={priority.value}>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2 h-2 rounded-full ${priority.color}`}
                                />
                                {priority.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleSaveEdit} className="flex-1">
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditSheetOpen(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleOpenEditSheet}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Object
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Meta Information Badges */}
          <div className="flex flex-wrap gap-2">
            {object.assignee && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {orgUsers.find((u) => u.userId === object.assignee)?.name ||
                  object.assignee}
              </Badge>
            )}
            {object.due_date && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                {new Date(object.due_date).toLocaleDateString()}
              </Badge>
            )}
            <Badge variant="secondary" className="flex items-center gap-1">
              <Flag className="h-3 w-3" />
              <span className="capitalize">{object.priority}</span>
            </Badge>
            <div
              className={`w-2 h-2 rounded-full self-center ${getPriorityColor(
                object.priority
              )}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <MarkdownEditor
                  markdown={object.description_md || ""}
                  onChange={handleDescriptionChange}
                  placeholder="Enter object description using markdown..."
                />
              </CardContent>
            </Card>

            {/* Workflows Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Workflow className="h-5 w-5" />
                  Workflows
                </CardTitle>
                <CardDescription>
                  Workflows this object is assigned to
                </CardDescription>
              </CardHeader>
              <CardContent>
                {object.workflows.length === 0 ? (
                  <EmptyState
                    icon={<Workflow className="h-8 w-8" />}
                    title="No workflows"
                    description="This object is not assigned to any workflow yet."
                  />
                ) : (
                  <div className="space-y-3">
                    {object.workflows.map(({ workflow, step }, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: workflow.color }}
                          />
                          <div>
                            <p className="font-medium text-sm text-gray-900">
                              {workflow.name}
                            </p>
                            {workflow.description && (
                              <p className="text-xs text-gray-500">
                                {workflow.description}
                              </p>
                            )}
                          </div>
                        </div>
                        {step && (
                          <Badge variant="outline" className="text-xs">
                            {step.title}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subtasks Card */}
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

                {subtasksHook.subtasks.length === 0 && !isAddingSubtask ? (
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
                      items={subtasksHook.subtasks.map((s) => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {subtasksHook.subtasks.map((subtask) => (
                          <SortableSubtask
                            key={subtask.id}
                            subtask={subtask}
                            onToggle={handleToggleSubtask}
                            onDelete={handleDeleteSubtask}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </CardContent>
            </Card>

            {/* Files Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Files
                  </CardTitle>
                  <CardDescription>Attached documents and files</CardDescription>
                </div>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Upload
                </Button>
              </CardHeader>
              <CardContent>
                {filesHook.files.length === 0 ? (
                  <EmptyState
                    icon={<FileText className="h-8 w-8" />}
                    title="No files"
                    description="Upload documents, images, or other files related to this object."
                    action={
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-1" />
                        Upload File
                      </Button>
                    }
                  />
                ) : (
                  <div className="space-y-2">
                    {filesHook.files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                      >
                        <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.filename}
                          </p>
                          <p className="text-xs text-gray-500">
                            {file.size_bytes
                              ? `${(file.size_bytes / 1024).toFixed(2)} KB`
                              : "Unknown size"}
                            {file.mime_type && ` • ${file.mime_type}`}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => filesHook.unlinkFile(file.id)}
                          className="opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* Properties Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Properties
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MetadataEditor
                  metadata={object.metadata || {}}
                  onUpdate={handleMetadataUpdate}
                  suggestions={metadataSuggestions}
                />
              </CardContent>
            </Card>

            {/* Object Connections Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Link2 className="h-5 w-5" />
                    Connections
                  </CardTitle>
                  <CardDescription>Related objects</CardDescription>
                </div>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {relationsHook.relations.length === 0 ? (
                  <EmptyState
                    icon={<Link2 className="h-8 w-8" />}
                    title="No connections"
                    description="Link this object to related objects in your project."
                  />
                ) : (
                  <div className="space-y-2">
                    {relationsHook.relations.map(({ relation, relatedObject }) => (
                      <div
                        key={relation.id}
                        onClick={() =>
                          router.push(
                            `/projects/${projectId}/objects/${relatedObject.id}`
                          )
                        }
                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              {relatedObject.title}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {relation.relation_kind.replace(/_/g, " ")}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              relationsHook.deleteRelation(relation.id);
                            }}
                            className="opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lexicon Connections Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Lexicon Items
                  </CardTitle>
                  <CardDescription>Linked components</CardDescription>
                </div>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {lexiconHook.lexiconLinks.length === 0 ? (
                  <EmptyState
                    icon={<Package className="h-8 w-8" />}
                    title="No lexicon items"
                    description="Link parts, specs, or documents from your lexicon."
                  />
                ) : (
                  <div className="space-y-2">
                    {lexiconHook.lexiconLinks.map(({ link, lexiconItem }) => (
                      <div
                        key={link.lexicon_id}
                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              {lexiconItem.name}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {lexiconItem.type.replace(/_/g, " ")}
                              </Badge>
                              {lexiconItem.manufacturer && (
                                <p className="text-xs text-gray-500">
                                  {lexiconItem.manufacturer}
                                </p>
                              )}
                            </div>
                            {link.note && (
                              <p className="text-xs text-gray-600 mt-1">
                                {link.note}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              lexiconHook.unlinkLexiconItem(link.lexicon_id)
                            }
                            className="opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
