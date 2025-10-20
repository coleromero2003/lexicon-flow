"use client";

import { useParams, useRouter } from "next/navigation";
import { useObject } from "@/lib/hooks/useObjects";
import Navbar from "@/components/navbar";
import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

// Mock data for assignees - replace with actual data from your system
const ASSIGNEES = [
  { value: "john.doe", label: "John Doe" },
  { value: "jane.smith", label: "Jane Smith" },
  { value: "bob.johnson", label: "Bob Johnson" },
  { value: "alice.williams", label: "Alice Williams" },
];

const PRIORITIES = [
  { value: "low", label: "Low", color: "bg-green-500" },
  { value: "medium", label: "Medium", color: "bg-yellow-500" },
  { value: "high", label: "High", color: "bg-red-500" },
  { value: "urgent", label: "Urgent", color: "bg-red-600" },
];

export default function ObjectPage() {
  const { objectId, projectId } = useParams<{
    objectId: string;
    projectId: string;
  }>();
  const router = useRouter();
  const { object, loading, error, updateObject, toggleSubtask } = useObject(
    parseInt(objectId, 10)
  );

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState("");
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: "",
    assignee: "",
    dueDate: undefined as Date | undefined,
    priority: "medium",
  });

  if (loading) {
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
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
            description={error || "The object you're looking for doesn't exist or has been deleted."}
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

  const handleSaveDescription = async () => {
    try {
      await updateObject({ description_md: description });
      setIsEditingDescription(false);
      toast.success("Description updated successfully");
    } catch (err) {
      console.error("Failed to update description:", err);
      toast.error("Failed to update description");
    }
  };

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
      await toggleSubtask(subtaskId, isDone);
      toast.success(isDone ? "Subtask completed" : "Subtask reopened");
    } catch (err) {
      console.error("Failed to toggle subtask:", err);
      toast.error("Failed to update subtask");
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
                              ? ASSIGNEES.find((a) => a.value === editForm.assignee)
                                  ?.label
                              : "Select assignee..."}
                            <User className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search assignee..." />
                            <CommandList>
                              <CommandEmpty>No assignee found.</CommandEmpty>
                              <CommandGroup>
                                {ASSIGNEES.map((assignee) => (
                                  <CommandItem
                                    key={assignee.value}
                                    value={assignee.value}
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
                                        editForm.assignee === assignee.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      }`}
                                    />
                                    {assignee.label}
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
                {object.assignee}
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
                {isEditingDescription ? (
                  <div className="space-y-3">
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-32"
                      placeholder="Enter object description..."
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleSaveDescription} size="sm">
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingDescription(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      setDescription(object.description_md || "");
                      setIsEditingDescription(true);
                    }}
                    className="min-h-20 p-3 rounded-md hover:bg-gray-50 cursor-pointer text-sm text-gray-700"
                  >
                    {object.description_md || (
                      <span className="text-gray-400">
                        Click to add description...
                      </span>
                    )}
                  </div>
                )}
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
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </CardHeader>
              <CardContent>
                {object.subtasks.length === 0 ? (
                  <EmptyState
                    icon={<ListTodo className="h-8 w-8" />}
                    title="No subtasks"
                    description="Break down this object into smaller tasks."
                    action={
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Subtask
                      </Button>
                    }
                  />
                ) : (
                  <div className="space-y-2">
                    {object.subtasks.map((subtask) => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                      >
                        <Checkbox
                          checked={subtask.is_done}
                          onCheckedChange={(checked) =>
                            handleToggleSubtask(subtask.id, checked as boolean)
                          }
                        />
                        <span
                          className={`text-sm flex-1 ${
                            subtask.is_done
                              ? "line-through text-gray-400"
                              : "text-gray-900"
                          }`}
                        >
                          {subtask.title}
                        </span>
                      </div>
                    ))}
                  </div>
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
                {object.files.length === 0 ? (
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
                    {object.files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
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
                {object.metadata && Object.keys(object.metadata).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(object.metadata).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          {key.replace(/_/g, " ")}
                        </p>
                        <p className="text-sm text-gray-900">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Settings className="h-8 w-8" />}
                    title="No properties"
                    description="Add custom properties to organize your object."
                  />
                )}
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
                {object.relations.length === 0 ? (
                  <EmptyState
                    icon={<Link2 className="h-8 w-8" />}
                    title="No connections"
                    description="Link this object to related objects in your project."
                  />
                ) : (
                  <div className="space-y-2">
                    {object.relations.map(({ relation, relatedObject }) => (
                      <div
                        key={relation.id}
                        onClick={() =>
                          router.push(
                            `/projects/${projectId}/objects/${relatedObject.id}`
                          )
                        }
                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {relatedObject.title}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {relation.relation_kind.replace(/_/g, " ")}
                        </p>
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
                {object.lexiconLinks.length === 0 ? (
                  <EmptyState
                    icon={<Package className="h-8 w-8" />}
                    title="No lexicon items"
                    description="Link parts, specs, or documents from your lexicon."
                  />
                ) : (
                  <div className="space-y-2">
                    {object.lexiconLinks.map(({ link, lexiconItem }) => (
                      <div
                        key={link.lexicon_id}
                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
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
