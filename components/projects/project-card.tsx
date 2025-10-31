import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Project } from "@/lib/supabase/models";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  className?: string;
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  const createdAt = new Date(project.created_at);
  const updatedAt = new Date(project.updated_at);

  return (
    <Link href={`/projects/${project.id}`} className="block">
      <Card data-testid="project-card" className={cn("group cursor-pointer transition-shadow hover:shadow-lg", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-4 rounded bg-blue-500" />
            <Badge className="text-xs" variant="secondary">
              {project.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <CardTitle className="mb-2 text-base sm:text-lg transition-colors group-hover:text-blue-600">
            {project.name}
          </CardTitle>
          {project.code ? (
            <Badge variant="outline" className="mb-2">
              {project.code}
            </Badge>
          ) : null}
          <CardDescription className="mb-4 text-sm">
            {project.description || "No description"}
          </CardDescription>
          <div className="flex flex-col space-y-1 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <span>
              Created {createdAt.toLocaleDateString()}
            </span>
            <span>
              Updated {updatedAt.toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
