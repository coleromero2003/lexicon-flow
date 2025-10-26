"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, User, Check } from "lucide-react";
import { format } from "date-fns";
import { PRIORITIES } from "./constants";

interface EditObjectSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues: {
    title: string;
    assignee: string;
    dueDate: Date | undefined;
    priority: string;
  };
  orgUsers: Array<{ userId: string; name: string }>;
  onSave: (values: {
    title: string;
    assignee: string;
    dueDate: Date | undefined;
    priority: string;
  }) => Promise<void>;
}

export function EditObjectSheet({
  open,
  onOpenChange,
  initialValues,
  orgUsers,
  onSave,
}: EditObjectSheetProps) {
  const [editForm, setEditForm] = useState(initialValues);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);

  const handleSave = async () => {
    await onSave(editForm);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
