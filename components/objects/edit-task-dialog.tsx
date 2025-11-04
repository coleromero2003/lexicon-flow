"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Task, ObjectPriority } from "@/lib/supabase/models";

interface OrgUser {
  userId: string;
  name: string;
}

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onSubmit: (
    taskId: number,
    updates: {
      title?: string;
      details?: string | null;
      assignee?: string[];
      due_date?: string | null;
      priority?: ObjectPriority;
    }
  ) => Promise<void>;
  orgUsers: OrgUser[];
}

const PRIORITY_OPTIONS: { value: ObjectPriority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "text-gray-600" },
  { value: "medium", label: "Medium", color: "text-blue-600" },
  { value: "high", label: "High", color: "text-orange-600" },
  { value: "urgent", label: "Urgent", color: "text-red-600" },
];

export function EditTaskDialog({
  open,
  onOpenChange,
  task,
  onSubmit,
  orgUsers,
}: EditTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [priority, setPriority] = useState<ObjectPriority>("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when task changes or dialog opens
  useEffect(() => {
    if (task && open) {
      setTitle(task.title);
      setDetails(task.details || "");
      setSelectedAssignees(task.assignee || []);
      setDueDate(task.due_date ? new Date(task.due_date) : undefined);
      setPriority(task.priority || "medium");
    }
  }, [task, open]);

  const handleSubmit = async () => {
    if (!task || !title.trim()) return;

    try {
      setIsSubmitting(true);
      await onSubmit(task.id, {
        title: title.trim(),
        details: details.trim() || null,
        assignee: selectedAssignees,
        due_date: dueDate ? dueDate.toISOString().split('T')[0] : null,
        priority,
      });

      onOpenChange(false);
    } catch (err) {
      console.error("Failed to update task", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAssignee = (userId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update task details, assignees, priority, and due date.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              placeholder="Enter task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Details */}
          <div className="space-y-2">
            <Label htmlFor="edit-details">Details</Label>
            <Textarea
              id="edit-details"
              placeholder="Add additional details (optional)"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="edit-priority">Priority</Label>
            <Select value={priority} onValueChange={(value) => setPriority(value as ObjectPriority)}>
              <SelectTrigger id="edit-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className={option.color}>{option.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assignees */}
          <div className="space-y-2">
            <Label>Assignees</Label>
            <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
              {orgUsers.length === 0 ? (
                <p className="text-sm text-gray-500">No users available</p>
              ) : (
                <div className="space-y-2">
                  {orgUsers.map((user) => (
                    <label
                      key={user.userId}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAssignees.includes(user.userId)}
                        onChange={() => toggleAssignee(user.userId)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{user.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {dueDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDueDate(undefined)}
                className="text-xs"
              >
                Clear date
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
