"use client";

import { ScadaObject } from "@/lib/supabase/models";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Flag,
  User,
  MoreHorizontal,
  Settings,
  Trash2,
  Edit3,
} from "lucide-react";
import { getPriorityColor } from "./constants";

interface ObjectHeaderProps {
  object: ScadaObject;
  orgUsers: Array<{ userId: string; name: string }>;
  onEdit: () => void;
  onDelete?: () => void;
  onBack: () => void;
}

export function ObjectHeader({
  object,
  orgUsers,
  onEdit,
  onDelete,
  onBack,
}: ObjectHeaderProps) {
  return (
    <>
      {/* Back Button */}
      <Button variant="ghost" className="mb-4" onClick={onBack}>
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
              Last updated {new Date(object.updated_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={onDelete}>
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
    </>
  );
}
