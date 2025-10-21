import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ObjectPriority } from "@/lib/supabase/models";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  CircleUserRound,
  Clock3,
  ListTodo,
} from "lucide-react";

interface ObjectHeaderProps {
  title: string;
  priority: ObjectPriority;
  assignee: string | null;
  dueDate: string | null;
  updatedAt: string;
  totalSubtasks: number;
  completedSubtasks: number;
}

const priorityCopy: Record<ObjectPriority, { label: string; variant: "default" | "secondary" | "destructive" | "outline" } & {
  className?: string;
}> = {
  low: {
    label: "Low priority",
    variant: "outline",
    className: "border-emerald-200 text-emerald-600 bg-emerald-50", 
  },
  medium: {
    label: "Medium priority",
    variant: "secondary",
    className: "bg-amber-100 text-amber-800 border-transparent",
  },
  high: {
    label: "High priority",
    variant: "destructive",
    className: "bg-orange-600 text-white",
  },
  urgent: {
    label: "Urgent",
    variant: "destructive",
    className: "bg-red-600 text-white",
  },
};

function formatDate(value: string | null) {
  if (!value) return "No due date";
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatRelative(value: string) {
  try {
    const updated = new Date(value).getTime();
    const diff = Date.now() - updated;
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
    const years = Math.floor(months / 12);
    return `${years} year${years === 1 ? "" : "s"} ago`;
  } catch {
    return value;
  }
}

export function ObjectHeader({
  title,
  priority,
  assignee,
  dueDate,
  updatedAt,
  totalSubtasks,
  completedSubtasks,
}: ObjectHeaderProps) {
  const priorityInfo = priorityCopy[priority];
  return (
    <Card className="border border-border/70 bg-gradient-to-br from-background to-muted">
      <CardHeader className="flex flex-col gap-3 pb-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-2xl font-semibold tracking-tight">
              {title}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Detailed operational view and metadata for this SCADA object.
            </CardDescription>
          </div>
          <Badge
            variant={priorityInfo.variant}
            className={cn("px-3 py-1 text-sm", priorityInfo.className)}
          >
            {priorityInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3 rounded-lg bg-background px-3 py-2 shadow-sm">
            <CalendarDays className="text-muted-foreground h-5 w-5" />
            <div>
              <dt className="text-muted-foreground">Due date</dt>
              <dd className="font-medium text-foreground">{formatDate(dueDate)}</dd>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-background px-3 py-2 shadow-sm">
            <CircleUserRound className="text-muted-foreground h-5 w-5" />
            <div>
              <dt className="text-muted-foreground">Assignee</dt>
              <dd className="font-medium text-foreground">
                {assignee ?? "Unassigned"}
              </dd>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-background px-3 py-2 shadow-sm">
            <Clock3 className="text-muted-foreground h-5 w-5" />
            <div>
              <dt className="text-muted-foreground">Last updated</dt>
              <dd className="font-medium text-foreground">
                {formatRelative(updatedAt)}
              </dd>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-background px-3 py-2 shadow-sm">
            <ListTodo className="text-muted-foreground h-5 w-5" />
            <div>
              <dt className="text-muted-foreground">Subtasks</dt>
              <dd className="font-medium text-foreground">
                {completedSubtasks}/{totalSubtasks}
              </dd>
            </div>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
