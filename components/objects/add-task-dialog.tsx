"use client";

import { useState } from "react";
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
import { ObjectPriority } from "@/lib/supabase/models";

interface OrgUser {
  userId: string;
  name: string;
}

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: {
    title: string;
    details?: string;
    assignee?: string[];
    dueDate?: Date;
    priority?: ObjectPriority;
  }) => Promise<void>;
  orgUsers: OrgUser[];
}

const PRIORITY_OPTIONS: { value: ObjectPriority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "text-gray-600" },
  { value: "medium", label: "Medium", color: "text-blue-600" },
  { value: "high", label: "High", color: "text-orange-600" },
  { value: "urgent", label: "Urgent", color: "text-red-600" },
];

export function AddTaskDialog({
  open,
  onOpenChange,
  onSubmit,
  orgUsers,
}: AddTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [priority, setPriority] = useState<ObjectPriority>("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        title: title.trim(),
        details: details.trim() || undefined,
        assignee: selectedAssignees.length > 0 ? selectedAssignees : undefined,
        dueDate,
        priority,
      });

      // Reset form
      setTitle("");
      setDetails("");
      setSelectedAssignees([]);
      setDueDate(undefined);
      setPriority("medium");
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to create task", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setTitle("");
    setDetails("");
    setSelectedAssignees([]);
    setDueDate(undefined);
    setPriority("medium");
    onOpenChange(false);
  };

  const toggleAssignee = (userId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Create a new task with details, assignees, priority, and due date.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Details */}
          <div className="space-y-2">
            <Label htmlFor="details">Details</Label>
            <Textarea
              id="details"
              placeholder="Add additional details (optional)"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={(value) => setPriority(value as ObjectPriority)}>
              <SelectTrigger id="priority">
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
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
