"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useOrganization } from "@clerk/nextjs";
import { SupabaseClient } from "@supabase/supabase-js";

import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSupabase } from "@/lib/supabase/SupabaseProvider";
import { fileService, objectService, projectService, workflowService } from "@/lib/services";
import { FileMeta, Project, ScadaObject, Workflow } from "@/lib/supabase/models";
import { formatFileSize } from "@/lib/utils/format-file-size";
import {
  FolderKanban,
  LayoutDashboard,
  ListTree,
  Search,
  Share2,
  Workflow as WorkflowIcon,
} from "lucide-react";

const MAX_WORKFLOWS_IN_ROW = 3;

export default function ProjectDashboardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const projectIdNum = Number(projectId);
  const { organization } = useOrganization();
  const { supabase } = useSupabase();

  const [project, setProject] = useState<Project | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [objects, setObjects] = useState<ScadaObject[]>([]);
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!supabase || !organization || Number.isNaN(projectIdNum)) {
      return;
    }

    let isMounted = true;

    async function loadData(client: SupabaseClient) {
      try {
        setLoading(true);
        setError(null);

        const [projectData, workflowData, objectData, fileData] = await Promise.all([
          projectService.getProjectById(client, projectIdNum),
          workflowService.getWorkflowsByProject(client, projectIdNum),
          objectService.getObjectsByProject(client, projectIdNum),
          fileService.getFilesByProject(client, projectIdNum),
        ]);

        if (!isMounted) return;

        setProject(projectData);
        setWorkflows(workflowData);
        setObjects(objectData);
        setFiles(fileData);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load project dashboard.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData(supabase);

    return () => {
      isMounted = false;
    };
  }, [supabase, organization, projectIdNum]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredWorkflows = useMemo(() => {
    if (!normalizedQuery) {
      return workflows;
    }
    return workflows.filter((workflow) =>
      `${workflow.name} ${workflow.description ?? ""}`
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [workflows, normalizedQuery]);

  const filteredObjects = useMemo(() => {
    if (!normalizedQuery) {
      return objects;
    }
    return objects.filter((obj) =>
      `${obj.title} ${obj.description_md ?? ""}`.toLowerCase().includes(normalizedQuery)
    );
  }, [objects, normalizedQuery]);

  const filteredFiles = useMemo(() => {
    if (!normalizedQuery) {
      return files;
    }
    return files.filter((file) =>
      `${file.filename}`.toLowerCase().includes(normalizedQuery)
    );
  }, [files, normalizedQuery]);

  const visibleWorkflows = filteredWorkflows.slice(0, MAX_WORKFLOWS_IN_ROW);
  const overflowWorkflows = filteredWorkflows.slice(MAX_WORKFLOWS_IN_ROW);

  const hasSearch = normalizedQuery.length > 0;

  function renderLoadingState() {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-6 sm:py-8 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </main>
      </div>
    );
  }

  if (loading) {
    return renderLoadingState();
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-6 sm:py-8">
          <EmptyState
            title="No organization selected"
            description="Please select or create an organization to explore project dashboards."
          />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-6 sm:py-8">
          <EmptyState
            title="Unable to load project dashboard"
            description={error}
            action={
              <Button variant="outline" onClick={() => router.refresh()}>
                Try again
              </Button>
            }
          />
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-6 sm:py-8">
          <EmptyState
            title="Project not found"
            description="We couldn\'t find the requested project."
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-6 sm:py-8 space-y-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{project.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600">
              Overview of workflows, objects, and files in this project.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="default" className="flex items-center gap-2" disabled>
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => router.push(`/projects/${projectId}/graph`)}
            >
              <Share2 className="h-4 w-4" /> Graph view
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search workflows, objects, and files"
              className="pl-9"
            />
          </div>
          {hasSearch && (
            <Button variant="ghost" onClick={() => setSearchQuery("")}>
              Clear search
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Workflows</CardTitle>
              <CardDescription className="text-2xl font-semibold text-gray-900">
                {filteredWorkflows.length}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Objects</CardTitle>
              <CardDescription className="text-2xl font-semibold text-gray-900">
                {filteredObjects.length}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Files</CardTitle>
              <CardDescription className="text-2xl font-semibold text-gray-900">
                {filteredFiles.length}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <WorkflowIcon className="h-5 w-5 text-blue-500" /> Workflows
              </CardTitle>
              <CardDescription>
                A snapshot of the workflows in this project. Use the dropdown to explore the rest.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push(`/projects/${projectId}/workflows`)}>
              Manage workflows
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {visibleWorkflows.length > 0 ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-3 lg:flex-row">
                  {visibleWorkflows.map((workflow) => (
                    <Link
                      key={workflow.id}
                      href={`/projects/${projectId}/workflows/${workflow.id}`}
                      className="flex-1 min-w-[200px]"
                    >
                      <div className="h-full rounded-lg border bg-white p-4 shadow-sm transition hover:border-blue-400 hover:shadow">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-semibold text-gray-900">{workflow.name}</h3>
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: workflow.color }}
                          />
                        </div>
                        {workflow.description && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {workflow.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
                {overflowWorkflows.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="self-start">
                        View all workflows ({filteredWorkflows.length})
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64">
                      <DropdownMenuLabel>All workflows</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {filteredWorkflows.map((workflow) => (
                        <DropdownMenuItem
                          key={workflow.id}
                          onSelect={() => router.push(`/projects/${projectId}/workflows/${workflow.id}`)}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: workflow.color }}
                            />
                            <span className="truncate">{workflow.name}</span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ) : (
              <EmptyState
                title={hasSearch ? "No workflows match your search" : "No workflows yet"}
                description={
                  hasSearch
                    ? "Try adjusting your search to find a workflow."
                    : "Create your first workflow to begin organizing your project."
                }
                action={!hasSearch && (
                  <Button onClick={() => router.push(`/projects/${projectId}/workflows`)}>
                    Create workflow
                  </Button>
                )}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <ListTree className="h-5 w-5 text-emerald-500" /> Objects
              </CardTitle>
              <CardDescription>
                Key SCADA objects that belong to this project.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push(`/projects/${projectId}/objects`)}>
              Manage objects
            </Button>
          </CardHeader>
          <CardContent>
            {filteredObjects.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {filteredObjects.slice(0, 6).map((object) => (
                  <Link
                    key={object.id}
                    href={`/projects/${projectId}/objects/${object.id}`}
                    className="block rounded-lg border bg-white p-4 shadow-sm transition hover:border-emerald-400 hover:shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">{object.title}</h3>
                        {object.description_md && (
                          <p className="mt-1 text-sm text-gray-600 line-clamp-3">
                            {object.description_md}
                          </p>
                        )}
                      </div>
                      <BadgeByPriority priority={object.priority} />
                    </div>
                    <div className="mt-3 text-xs text-gray-500">
                      Updated {new Date(object.updated_at).toLocaleDateString()}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title={hasSearch ? "No objects match your search" : "No objects yet"}
                description={
                  hasSearch
                    ? "Try a different keyword to find objects."
                    : "Objects will appear here once they are created for the project."
                }
              />
            )}
            {filteredObjects.length > 6 && (
              <div className="mt-4">
                <Button variant="outline" className="w-full" onClick={() => router.push(`/projects/${projectId}/objects`)}>
                  View all objects ({filteredObjects.length})
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <FolderKanban className="h-5 w-5 text-purple-500" /> Files
            </CardTitle>
            <CardDescription>Recent project files and documents.</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredFiles.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className="rounded-lg border bg-white p-4 shadow-sm transition hover:border-purple-400 hover:shadow"
                  >
                    <h3 className="text-base font-semibold text-gray-900">{file.filename}</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Uploaded {new Date(file.created_at).toLocaleDateString()} · {formatFileSize(file.size_bytes)}
                    </p>
                    {file.mime_type && (
                      <p className="mt-2 inline-flex rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                        {file.mime_type}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title={hasSearch ? "No files match your search" : "No files yet"}
                description={
                  hasSearch
                    ? "Broaden your search to include other file names."
                    : "Upload files to make them available to the project team."
                }
              />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

type PriorityBadgeProps = {
  priority: ScadaObject["priority"];
};

function BadgeByPriority({ priority }: PriorityBadgeProps) {
  const styles: Record<ScadaObject["priority"], string> = {
    low: "bg-green-100 text-green-700",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-amber-100 text-amber-700",
    urgent: "bg-red-100 text-red-700",
  };

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${styles[priority]}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}

