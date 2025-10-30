"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { FileText } from "lucide-react";

import { PdfViewerDialog } from "@/components/file-viewer/pdf-viewer-dialog";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ConnectionsCard,
  DescriptionCard,
  EditObjectSheet,
  FilesCard,
  LexiconCard,
  LinkObjectDialog,
  ObjectHeader,
  PropertiesCard,
  SubtasksCard,
  WorkflowsCard,
  PRIORITIES,
  RELATION_KIND_OPTIONS,
} from "@/components/objects";
import type { PriorityValue } from "@/components/objects";
import { useObject } from "@/lib/hooks/useObjects";
import { useSupabaseFileViewer } from "@/lib/hooks/useSupabaseFileViewer";
import { useSubtasks } from "@/lib/hooks/useSubtasks";
import { useObjectFiles } from "@/lib/hooks/useObjectFiles";
import { useObjectRelations } from "@/lib/hooks/useObjectRelations";
import { useObjectLexicon } from "@/lib/hooks/useObjectLexicon";
import { useOrganizationUsers } from "@/lib/hooks/useOrganizationUsers";
import { useMetadataSuggestions } from "@/lib/hooks/useMetadataSuggestions";
import { useFileUpload } from "@/lib/hooks/useFileUpload";
import { usePdfGeneration } from "@/lib/hooks/usePdfGeneration";
import { useSupabase } from "@/lib/supabase/SupabaseProvider";
import { objectService, projectService, workflowService } from "@/lib/services";
import type { RelationKind, ScadaObject, Workflow } from "@/lib/supabase/models";
import { FileDown, FilePlus2 } from "lucide-react";

export default function ObjectPage() {
  const { objectId, projectId } = useParams<{
    objectId: string;
    projectId: string;
  }>();
  const router = useRouter();

  const parsedObjectId = Number(objectId);
  const parsedProjectId = Number(projectId);

  const { supabase } = useSupabase();
  const [projectName, setProjectName] = useState<string>("");

  // Load project name for breadcrumbs
  useEffect(() => {
    async function loadProject() {
      if (parsedProjectId && supabase) {
        try {
          const project = await projectService.getProjectById(
            supabase,
            parsedProjectId
          );
          setProjectName(project.name);
        } catch (err) {
          console.error("Failed to load project:", err);
        }
      }
    }
    loadProject();
  }, [parsedProjectId, supabase]);

  const { object, loading, error, updateObject } = useObject(parsedObjectId);
  const subtasksHook = useSubtasks(parsedObjectId);
  const {
    files: objectFiles,
    deleteFile,
    unlinkFile,
    reloadFiles,
  } = useObjectFiles(parsedObjectId);
  const relationsHook = useObjectRelations(parsedObjectId);
  const lexiconHook = useObjectLexicon(parsedObjectId);
  const { users: organizationUsers } = useOrganizationUsers();
  const { suggestions: metadataSuggestions } =
    useMetadataSuggestions(parsedProjectId);
  const { uploadObjectFile, isUploading: isUploadingFile } = useFileUpload();
  const { isGenerating, isMerging, generateAndDownloadReport, mergeAndDownloadPdfs } = usePdfGeneration();

  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [editSheetKey, setEditSheetKey] = useState(0);
  type EditInitialValues = {
    title: string;
    assignee: string[];
    dueDate: Date | undefined;
    priority: PriorityValue;
  };

  const [editInitialValues, setEditInitialValues] = useState<EditInitialValues>(
    {
      title: "",
      assignee: [],
      dueDate: undefined,
      priority: (PRIORITIES[1]?.value ?? "medium") as PriorityValue,
    }
  );

  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [projectObjects, setProjectObjects] = useState<ScadaObject[]>([]);
  const [isLoadingProjectObjects, setIsLoadingProjectObjects] = useState(false);
  const [isLinkingObject, setIsLinkingObject] = useState(false);

  const [projectWorkflows, setProjectWorkflows] = useState<Workflow[]>([]);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false);

  const descriptionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadProjectObjects = useCallback(async () => {
    if (!parsedProjectId || !supabase) return;

    try {
      setIsLoadingProjectObjects(true);
      const objects = await objectService.getObjectsByProject(
        supabase,
        parsedProjectId
      );
      setProjectObjects(objects);
    } catch (err) {
      console.error("Failed to load project objects", err);
      toast.error("Failed to load project objects");
    } finally {
      setIsLoadingProjectObjects(false);
    }
  }, [parsedProjectId, supabase]);

  const loadProjectWorkflows = useCallback(async () => {
    if (!parsedProjectId || !supabase) return;

    try {
      setIsLoadingWorkflows(true);
      const workflows = await workflowService.getWorkflowsByProject(
        supabase,
        parsedProjectId
      );
      setProjectWorkflows(workflows);
    } catch (err) {
      console.error("Failed to load project workflows", err);
      toast.error("Failed to load project workflows");
    } finally {
      setIsLoadingWorkflows(false);
    }
  }, [parsedProjectId, supabase]);

  useEffect(() => {
    loadProjectObjects();
    loadProjectWorkflows();
  }, [loadProjectObjects, loadProjectWorkflows]);

  const storageBucket = useMemo(
    () => "lexicon-files",
    []
  );

  const linkedObjectIds = useMemo(
    () => relationsHook.relations.map((relation) => relation.relatedObject.id),
    [relationsHook.relations]
  );

  const linkableObjects = useMemo(
    () =>
      projectObjects
        .filter(
          (projectObject) =>
            projectObject.id !== parsedObjectId &&
            !linkedObjectIds.includes(projectObject.id)
        )
        .sort((a, b) => a.title.localeCompare(b.title)),
    [linkedObjectIds, parsedObjectId, projectObjects]
  );

  const handleFileViewerError = useCallback((error: Error) => {
    console.error("Failed to open file", error);
    toast.error(error.message || "Failed to open file");
  }, []);

  const {
    openFile: openObjectFile,
    setViewerOpen,
    state: {
      isViewerOpen,
      viewerFile,
      viewerUrl,
      viewerLoading,
      viewingFileId,
    },
  } = useSupabaseFileViewer({
    supabase,
    bucket: storageBucket,
    onError: handleFileViewerError,
  });

  useEffect(() => {
    if (!object) return;

    setEditInitialValues({
      title: object.title,
      assignee: object.assignee || [],
      dueDate: object.due_date ? new Date(object.due_date) : undefined,
      priority: ((object.priority as PriorityValue) ||
        PRIORITIES[1]?.value ||
        "medium") as PriorityValue,
    });
  }, [object]);

  useEffect(() => {
    return () => {
      if (descriptionTimerRef.current) {
        clearTimeout(descriptionTimerRef.current);
      }
    };
  }, []);

  const handleDescriptionChange = useCallback(
    (newMarkdown: string) => {
      if (!supabase) return;

      if (descriptionTimerRef.current) {
        clearTimeout(descriptionTimerRef.current);
      }

      descriptionTimerRef.current = setTimeout(async () => {
        try {
          await objectService.updateObject(supabase, parsedObjectId, {
            description_md: newMarkdown,
          });
          toast.success("Description saved");
        } catch (err) {
          console.error("Failed to update description", err);
          toast.error("Failed to update description");
        }
      }, 1000);
    },
    [parsedObjectId, supabase]
  );

  const handleOpenEditSheet = () => {
    setEditSheetKey((key) => key + 1);
    setIsEditSheetOpen(true);
  };

  const handleSaveEdit = async ({
    title,
    assignee,
    dueDate,
    priority,
  }: {
    title: string;
    assignee: string[];
    dueDate: Date | undefined;
    priority: string;
  }) => {
    try {
      await updateObject({
        title,
        assignee: assignee || [],
        due_date: dueDate ? dueDate.toISOString() : null,
        priority: priority as PriorityValue,
      });
      toast.success("Object updated successfully");
    } catch (err) {
      console.error("Failed to update object", err);
      toast.error("Failed to update object");
      throw err;
    }
  };

  const handleToggleSubtask = async (subtaskId: number, isDone: boolean) => {
    try {
      await subtasksHook.toggleSubtask(subtaskId, isDone);
      toast.success(isDone ? "Subtask completed" : "Subtask reopened");
    } catch (err) {
      console.error("Failed to toggle subtask", err);
      toast.error("Failed to update subtask");
      throw err;
    }
  };

  const handleAddSubtask = async (title: string) => {
    if (!title.trim()) return;

    try {
      await subtasksHook.createSubtask(title.trim());
      toast.success("Subtask added");
    } catch (err) {
      console.error("Failed to add subtask", err);
      toast.error("Failed to add subtask");
      throw err;
    }
  };

  const handleDeleteSubtask = async (subtaskId: number) => {
    try {
      await subtasksHook.deleteSubtask(subtaskId);
      toast.success("Subtask deleted");
    } catch (err) {
      console.error("Failed to delete subtask", err);
      toast.error("Failed to delete subtask");
      throw err;
    }
  };

  const handleReorderSubtasks = async (
    reordered: typeof subtasksHook.subtasks
  ) => {
    try {
      await subtasksHook.reorderSubtasks(reordered);
      toast.success("Subtasks reordered");
    } catch (err) {
      console.error("Failed to reorder subtasks", err);
      toast.error("Failed to reorder subtasks");
      throw err;
    }
  };

  const handleMetadataUpdate = async (metadata: Record<string, unknown>) => {
    try {
      await updateObject({ metadata });
      toast.success("Properties updated");
    } catch (err) {
      console.error("Failed to update properties", err);
      toast.error("Failed to update properties");
      throw err;
    }
  };

  const handleUnlinkFile = async (fileId: number) => {
    try {
      await unlinkFile(fileId);
      toast.success("File unlinked");
    } catch (err) {
      console.error("Failed to unlink file", err);
      toast.error("Failed to unlink file");
      throw err;
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    try {
      await deleteFile(fileId);
      toast.success("File deleted permanently");
    } catch (err) {
      console.error("Failed to delete file", err);
      toast.error("Failed to delete file");
      throw err;
    }
  };

  const handleUploadClick = useCallback(() => {
    if (isUploadingFile) return;
    fileInputRef.current?.click();
  }, [isUploadingFile]);

  const handleFileSelected = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) return;

      if (!object) {
        toast.error("Object data is still loading");
        event.target.value = "";
        return;
      }

      try {
        await uploadObjectFile({
          file,
          projectId: parsedProjectId,
          objectId: parsedObjectId,
          objectSlug: object.title,
        });

        await reloadFiles();
        toast.success("File uploaded");
      } catch (err) {
        console.error("Failed to upload file", err);
        toast.error(
          err instanceof Error ? err.message : "Failed to upload file"
        );
      } finally {
        event.target.value = "";
      }
    },
    [object, parsedObjectId, parsedProjectId, reloadFiles, uploadObjectFile]
  );

  const handleViewFile = openObjectFile;

  const handleOpenLinkDialog = useCallback(() => {
    void loadProjectObjects();
    setIsLinkDialogOpen(true);
  }, [loadProjectObjects]);

  const handleLinkObjects = useCallback(
    async (targetObjectId: number, relationKind: RelationKind) => {
      try {
        setIsLinkingObject(true);
        await relationsHook.createRelation(targetObjectId, relationKind);
        toast.success("Connection created");
        setIsLinkDialogOpen(false);
      } catch (err) {
        console.error("Failed to create relation", err);
        toast.error("Failed to create connection");
        throw err;
      } finally {
        setIsLinkingObject(false);
      }
    },
    [relationsHook]
  );

  const handleDeleteRelation = async (relationId: number) => {
    try {
      await relationsHook.deleteRelation(relationId);
      toast.success("Connection removed");
    } catch (err) {
      console.error("Failed to delete relation", err);
      toast.error("Failed to delete connection");
      throw err;
    }
  };

  const handleUnlinkLexicon = async (lexiconId: number) => {
    try {
      await lexiconHook.unlinkLexiconItem(lexiconId);
      toast.success("Lexicon item removed");
    } catch (err) {
      console.error("Failed to unlink lexicon item", err);
      toast.error("Failed to unlink lexicon item");
      throw err;
    }
  };

  const handleAddWorkflow = async (workflowId: number, stepId: number) => {
    if (!object || !supabase) return;

    try {
      // Add the workflow and step IDs to the object's arrays
      const currentWorkflowIds = object.workflow_id || [];
      const currentStepIds = object.step_id || [];

      await updateObject({
        workflow_id: [...currentWorkflowIds, workflowId],
        step_id: [...currentStepIds, stepId],
      });

      toast.success("Object added to workflow");
    } catch (err) {
      console.error("Failed to add object to workflow", err);
      toast.error("Failed to add object to workflow");
      throw err;
    }
  };

  const handleRemoveWorkflow = async (workflowId: number) => {
    if (!object || !supabase) return;

    try {
      // Find the index of the workflow to remove
      const workflowIndex = (object.workflow_id || []).indexOf(workflowId);
      if (workflowIndex === -1) return;

      // Remove the workflow and its corresponding step
      const newWorkflowIds = [...(object.workflow_id || [])];
      const newStepIds = [...(object.step_id || [])];

      newWorkflowIds.splice(workflowIndex, 1);
      newStepIds.splice(workflowIndex, 1);

      await updateObject({
        workflow_id: newWorkflowIds,
        step_id: newStepIds,
      });

      toast.success("Object removed from workflow");
    } catch (err) {
      console.error("Failed to remove object from workflow", err);
      toast.error("Failed to remove object from workflow");
      throw err;
    }
  };

  if (loading || subtasksHook.loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-6 sm:py-8">
          <Skeleton className="h-10 w-32 mb-4" />
          <div className="mb-6 sm:mb-8">
            <Skeleton className="h-10 w-96 mb-2" />
            <Skeleton className="h-4 w-64 mb-4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !object) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <EmptyState
            icon={<FileText className="h-12 w-12" />}
            title="Object not found"
            description={
              error ||
              "The object you&rsquo;re looking for doesn&rsquo;t exist or has been deleted."
            }
            action={
              <Button variant="outline" onClick={() => router.push(`/projects/${projectId}/objects`)}>
                Go Back
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelected}
        className="hidden"
      />

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <Breadcrumb className="mb-4">
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
              <BreadcrumbLink asChild>
                <Link href={`/projects/${projectId}`}>{projectName || "Project"}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/projects/${projectId}/objects`}>Objects</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{object.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <BackButton fallbackHref={`/projects/${projectId}/objects`} className="mb-4" />

        <ObjectHeader
          object={object}
          orgUsers={organizationUsers.map(({ userId, name }) => ({
            userId,
            name,
          }))}
          onEdit={handleOpenEditSheet}
          onBack={() => router.push(`/projects/${projectId}/objects`)}
        />

        {/* PDF Generation Actions */}
        <div className="flex gap-2 mb-4">
          <Button
            onClick={() => generateAndDownloadReport(parsedObjectId, object.title)}
            disabled={isGenerating}
            variant="outline"
          >
            <FileDown className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating..." : "Generate Purchase Report"}
          </Button>

          {objectFiles.filter(f => f.mime_type === "application/pdf").length > 1 && (
            <Button
              onClick={() => {
                const pdfFileIds = objectFiles
                  .filter(f => f.mime_type === "application/pdf")
                  .map(f => f.id);
                mergeAndDownloadPdfs(pdfFileIds, `merged-${object.title}.pdf`);
              }}
              disabled={isMerging}
              variant="outline"
            >
              <FilePlus2 className="h-4 w-4 mr-2" />
              {isMerging ? "Merging..." : `Merge ${objectFiles.filter(f => f.mime_type === "application/pdf").length} PDFs`}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6 lg:gap-8">
          <div className="space-y-6">
            <DescriptionCard
              description={object.description_md || ""}
              onChange={handleDescriptionChange}
            />

            <WorkflowsCard
              workflows={object.workflows}
              availableWorkflows={projectWorkflows}
              onAddWorkflow={handleAddWorkflow}
              onRemoveWorkflow={handleRemoveWorkflow}
              loading={isLoadingWorkflows}
            />

            <SubtasksCard
              subtasks={subtasksHook.subtasks}
              onToggle={handleToggleSubtask}
              onAdd={handleAddSubtask}
              onDelete={handleDeleteSubtask}
              onReorder={handleReorderSubtasks}
            />

            <FilesCard
              files={objectFiles}
              onUpload={handleUploadClick}
              onUnlink={handleUnlinkFile}
              onDelete={handleDeleteFile}
              onView={handleViewFile}
              isUploading={isUploadingFile}
              viewingFileId={viewingFileId}
            />
          </div>

          <div className="space-y-6">
            <PropertiesCard
              metadata={object.metadata || {}}
              suggestions={metadataSuggestions}
              onUpdate={handleMetadataUpdate}
            />

            <ConnectionsCard
              relations={relationsHook.relations}
              onAdd={handleOpenLinkDialog}
              onDelete={handleDeleteRelation}
              onNavigate={(relatedObjectId) =>
                router.push(`/projects/${projectId}/objects/${relatedObjectId}`)
              }
            />

            <LexiconCard
              lexiconLinks={lexiconHook.lexiconLinks}
              onUnlink={handleUnlinkLexicon}
            />
          </div>
        </div>
      </main>

      <EditObjectSheet
        key={editSheetKey}
        open={isEditSheetOpen}
        onOpenChange={setIsEditSheetOpen}
        initialValues={editInitialValues}
        orgUsers={organizationUsers.map(({ userId, name }) => ({
          userId,
          name,
        }))}
        onSave={handleSaveEdit}
      />

      <LinkObjectDialog
        open={isLinkDialogOpen}
        onOpenChange={setIsLinkDialogOpen}
        objects={linkableObjects.map((objectItem) => ({
          id: objectItem.id,
          title: objectItem.title,
          description: objectItem.description_md,
        }))}
        relationKinds={RELATION_KIND_OPTIONS}
        onSubmit={handleLinkObjects}
        isSubmitting={isLinkingObject}
        isLoadingObjects={isLoadingProjectObjects}
      />

      <PdfViewerDialog
        open={isViewerOpen}
        onOpenChange={setViewerOpen}
        file={viewerFile}
        url={viewerUrl}
        loading={viewerLoading}
      />
    </div>
  );
}
