"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { PRIORITIES } from "./constants";
import { OrganizationUserCombobox } from "@/components/people/organization-user-combobox";

interface EditObjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues: {
    title: string;
    assignee: string[];
    dueDate: Date | undefined;
    priority: string;
  };
  orgUsers: Array<{ userId: string; name: string }>;
  onSave: (values: {
    title: string;
    assignee: string[];
    dueDate: Date | undefined;
    priority: string;
  }) => Promise<void>;
}

export function EditObjectDialog({
  open,
  onOpenChange,
  initialValues,
  orgUsers,
  onSave,
}: EditObjectDialogProps) {
  const [editForm, setEditForm] = useState(initialValues);
  const [dueDateOpen, setDueDateOpen] = useState(false);

  const handleSave = async () => {
    await onSave(editForm);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Object</DialogTitle>
          <DialogDescription>
            Make changes to your object details here.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
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
            <Label>Assignees</Label>
            <OrganizationUserCombobox
              users={orgUsers}
              value={editForm.assignee || []}
              onChange={(userIds) =>
                setEditForm({
                  ...editForm,
                  assignee: userIds,
                })
              }
              multiple={true}
              placeholder="Select assignees..."
              searchPlaceholder="Search users..."
              emptyText="No users found."
            />
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
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
