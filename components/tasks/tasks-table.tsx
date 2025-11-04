"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Task, ObjectPriority, ScadaObject } from "@/lib/supabase/models";
import { format } from "date-fns";
import {
  MoreVertical,
  Edit2,
  Trash2,
  Link2,
  ExternalLink,
  Search,
  Filter,
} from "lucide-react";
import Link from "next/link";

interface OrgUser {
  userId: string;
  name: string;
}

interface TasksTableProps {
  tasks: Task[];
  objects?: ScadaObject[];
  orgUsers: OrgUser[];
  onToggle: (taskId: number, isDone: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onLinkToObject?: (task: Task) => void;
  showObjectColumn?: boolean;
}

const PRIORITY_CONFIG: Record<
  ObjectPriority,
  { label: string; color: string }
> = {
  low: { label: "Low", color: "bg-gray-100 text-gray-700 border-gray-300" },
  medium: {
    label: "Medium",
    color: "bg-blue-100 text-blue-700 border-blue-300",
  },
  high: {
    label: "High",
    color: "bg-orange-100 text-orange-700 border-orange-300",
  },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700 border-red-300" },
};

export function TasksTable({
  tasks,
  objects = [],
  orgUsers,
  onToggle,
  onEdit,
  onDelete,
  onLinkToObject,
  showObjectColumn = true,
}: TasksTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");

  // Create a map of object IDs to objects for quick lookup
  const objectsMap = useMemo(() => {
    const map = new Map<number, ScadaObject>();
    objects.forEach((obj) => map.set(obj.id, obj));
    return map;
  }, [objects]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDetails = task.details?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDetails) return false;
      }

      // Priority filter
      if (priorityFilter !== "all" && task.priority !== priorityFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === "completed" && !task.is_done) return false;
      if (statusFilter === "active" && task.is_done) return false;

      // Assignee filter
      if (assigneeFilter !== "all") {
        if (!task.assignee || !task.assignee.includes(assigneeFilter)) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, searchQuery, priorityFilter, statusFilter, assigneeFilter]);

  const getAssigneeNames = (assigneeIds: string[]) => {
    return assigneeIds
      .map((id) => orgUsers.find((u) => u.userId === id)?.name || "Unknown")
      .join(", ");
  };

  const getLinkedObject = (objectId: number | null) => {
    if (!objectId) return null;
    return objectsMap.get(objectId);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Priority Filter */}
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        {/* Assignee Filter */}
        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            {orgUsers.map((user) => (
              <SelectItem key={user.userId} value={user.userId}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Done</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assignees</TableHead>
              <TableHead>Due Date</TableHead>
              {showObjectColumn && <TableHead>Object</TableHead>}
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showObjectColumn ? 7 : 6}
                  className="text-center text-gray-500 py-8"
                >
                  No tasks found
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task) => {
                const linkedObject = getLinkedObject(task.object_id);
                const priorityConfig =
                  PRIORITY_CONFIG[task.priority || "medium"];

                return (
                  <TableRow key={task.id}>
                    {/* Checkbox */}
                    <TableCell>
                      <Checkbox
                        checked={task.is_done}
                        onCheckedChange={(checked) =>
                          onToggle(task.id, checked as boolean)
                        }
                      />
                    </TableCell>

                    {/* Task Title & Details */}
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span
                          className={`font-medium ${
                            task.is_done
                              ? "line-through text-gray-400"
                              : "text-gray-900"
                          }`}
                        >
                          {task.title}
                        </span>
                        {task.details && (
                          <span className="text-xs text-gray-600 line-clamp-1">
                            {task.details}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Priority */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${priorityConfig.color}`}
                      >
                        {priorityConfig.label}
                      </Badge>
                    </TableCell>

                    {/* Assignees */}
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {task.assignee && task.assignee.length > 0
                          ? getAssigneeNames(task.assignee)
                          : "Unassigned"}
                      </span>
                    </TableCell>

                    {/* Due Date */}
                    <TableCell>
                      {task.due_date ? (
                        <span className="text-sm text-gray-600">
                          {format(new Date(task.due_date), "MMM d, yyyy")}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">No date</span>
                      )}
                    </TableCell>

                    {/* Linked Object */}
                    {showObjectColumn && (
                      <TableCell>
                        {linkedObject ? (
                          <Link
                            href={`/projects/${linkedObject.project_id}/objects/${linkedObject.id}`}
                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            <span className="line-clamp-1">
                              {linkedObject.title}
                            </span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </Link>
                        ) : (
                          <span className="text-sm text-gray-400">
                            No object
                          </span>
                        )}
                      </TableCell>
                    )}

                    {/* Actions */}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(task)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {onLinkToObject && !task.object_id && (
                            <DropdownMenuItem onClick={() => onLinkToObject(task)}>
                              <Link2 className="h-4 w-4 mr-2" />
                              Link to Object
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(task.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        Showing {filteredTasks.length} of {tasks.length} tasks
      </div>
    </div>
  );
}
