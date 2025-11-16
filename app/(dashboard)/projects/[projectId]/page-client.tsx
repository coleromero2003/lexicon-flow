"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useOrganization, useAuth } from "@clerk/nextjs";
import { SupabaseClient } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { Textarea } from "@/components/ui/textarea";
import { PageLoadingSkeleton } from "@/components/ui/page-loading-skeleton";
import { PageErrorState } from "@/components/ui/page-error-state";
import { SearchInput } from "@/components/ui/search-input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PdfViewerDialog } from "@/components/file-viewer/pdf-viewer-dialog";
import { ExcelViewerDialog } from "@/components/file-viewer/excel-viewer-dialog";
import { FilesCard } from "@/components/objects/files-card";
import { useSupabase } from "@/lib/supabase/SupabaseProvider";
import { useSupabaseFileViewer } from "@/lib/hooks/useSupabaseFileViewer";
import { fileService, objectService, projectService, workflowService } from "@/lib/services";
import { FileMeta, Project, ScadaObject, Workflow } from "@/lib/supabase/models";
import { toast } from "sonner";
import {
  LayoutDashboard,
  ListTree,
  MoreVertical,
  Pencil,
  Share2,
  Trash2,
  Workflow as WorkflowIcon,
} from "lucide-react";

const MAX_WORKFLOWS_IN_ROW = 3;

// Helper to determine if file is an Excel file
function isExcelFile(file: { filename: string; mime_type?: string | null } | null): boolean {
  if (!file) return false;
  const mimeType = (file.mime_type ?? "").toLowerCase();
  const fileName = file.filename.toLowerCase();

  return (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType === "text/csv" ||
    fileName.endsWith(".xlsx") ||
    fileName.endsWith(".xls") ||
    fileName.endsWith(".xlsm") ||
    fileName.endsWith(".xlsb") ||
    fileName.endsWith(".csv")
  );
}

export default function ProjectDashboardClientPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const projectIdNum = Number(projectId);
  const { organization } = useOrganization();
  const { has } = useAuth();
  const { supabase } = useSupabase();

  // Check if user has admin role in the organization
  const isAdmin = has?.({ role: "admin" }) ?? false;

  const [project, setProject] = useState<Project | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [objects, setObjects] = useState<ScadaObject[]>([]);
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state for editing
  const [editForm, setEditForm] = useState({
    name: "",
    code: "",
    description: "",
    status: "",
    start_date: "",
    end_date: "",
  });

  const storageBucket = useMemo(() => "lexicon-files", []);

  const handleFileViewerError = useCallback((error: Error) => {
    console.error("Failed to open file", error);
    toast.error(error.message || "Failed to open file");
  }, []);

  const {
    openFile,
    setViewerOpen,
    state: {
      isViewerOpen,
      viewerFile,
      viewerUrl,
      viewerLoading,
    },
  } = useSupabaseFileViewer({
    supabase,
    bucket: storageBucket,
    onError: handleFileViewerError,
  });

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

  // Handler to open edit dialog and populate form
  const handleOpenEditDialog = () => {
    if (!project) return;
    setEditForm({
      name: project.name,
      code: project.code || "",
      description: project.description || "",
      status: project.status || "",
      start_date: project.start_date || "",
      end_date: project.end_date || "",
    });
    setEditDialogOpen(true);
  };

  // Handler to update project
  const handleUpdateProject = async () => {
    if (!supabase || !project) return;

    try {
      setIsUpdating(true);
      const updates: Partial<Project> = {
        name: editForm.name,
        code: editForm.code || null,
        description: editForm.description || null,
        status: editForm.status,
        start_date: editForm.start_date || null,
        end_date: editForm.end_date || null,
      };

      const updatedProject = await projectService.updateProject(
        supabase,
        projectIdNum,
        updates
      );

      setProject(updatedProject);
      setEditDialogOpen(false);
      toast.success("Project updated successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update project"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // Handler to delete project
  const handleDeleteProject = async () => {
    if (!supabase) return;

    // Additional check: Only admins can delete projects
    if (!isAdmin) {
      toast.error("Only administrators can delete projects");
      setDeleteDialogOpen(false);
      return;
    }

    try {
      setIsDeleting(true);
      await projectService.deleteProject(supabase, projectIdNum);

      toast.success("Project deleted successfully");

      // Navigate back to dashboard after deletion
      router.push("/dashboard");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete project"
      );
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return <PageLoadingSkeleton statsCount={3} />;
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50">
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
      <PageErrorState
        title="Unable to load project dashboard"
        message={error}
        onRetry={() => router.refresh()}
        retryLabel="Try again"
      />
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
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
      <main className="container mx-auto px-4 py-6 sm:py-8 space-y-8">
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Project Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleOpenEditDialog}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Project
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Project
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search workflows, objects, and files"
            className="w-full max-w-xl"
          />
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
            <Button data-testid="create-workflow-btn" variant="outline" size="sm" onClick={() => router.push(`/projects/${projectId}/workflows`)}>
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
                      <div data-testid="workflow-item" className="h-full rounded-lg border bg-white p-4 shadow-sm transition hover:border-blue-400 hover:shadow">
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
            <Button data-testid="create-object-btn" variant="outline" size="sm" onClick={() => router.push(`/projects/${projectId}/objects`)}>
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
                    data-testid="object-item"
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
                      <PriorityBadge priority={object.priority} />
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

        <FilesCard
          files={filteredFiles}
          onView={openFile}
        />
      </main>

      {/* Edit Project Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update the project properties below. All fields except name are optional.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Project Name *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Enter project name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-code">Project Code</Label>
              <Input
                id="edit-code"
                value={editForm.code}
                onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                placeholder="e.g., PROJ-001"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Enter project description"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Input
                id="edit-status"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                placeholder="e.g., Planning, Active, Completed"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-start-date">Start Date</Label>
                <Input
                  id="edit-start-date"
                  type="date"
                  value={editForm.start_date}
                  onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-end-date">End Date</Label>
                <Input
                  id="edit-end-date"
                  type="date"
                  value={editForm.end_date}
                  onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProject} disabled={isUpdating || !editForm.name.trim()}>
              {isUpdating ? "Updating..." : "Update Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project <strong>{project.name}</strong> and all associated
              workflows, objects, and files. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete Project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isExcelFile(viewerFile) ? (
        <ExcelViewerDialog
          open={isViewerOpen}
          onOpenChange={setViewerOpen}
          file={viewerFile}
          url={viewerUrl}
          loading={viewerLoading}
        />
      ) : (
        <PdfViewerDialog
          open={isViewerOpen}
          onOpenChange={setViewerOpen}
          file={viewerFile}
          url={viewerUrl}
          loading={viewerLoading}
        />
      )}
    </div>
  );
}
