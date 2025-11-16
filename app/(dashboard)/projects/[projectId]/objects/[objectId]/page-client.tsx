"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOrganization, useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { notifyTaskCreated, notifyTaskUpdated, getNotificationContext } from "@/lib/email/task-notification-helpers";

import { PdfViewerDialog } from "@/components/file-viewer/pdf-viewer-dialog";
import { ExcelViewerDialog } from "@/components/file-viewer/excel-viewer-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FileRenameDialog } from "@/components/ui/file-rename-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ConnectionsCard,
  DescriptionCard,
  EditObjectDialog,
  FilesCard,
  LexiconCard,
  LinkLexiconDialog,
  LinkObjectDialog,
  ObjectHeader,
  PdfSelectionDialog,
  PropertiesCard,
  SubtasksCard,
  WorkflowsCard,
  PRIORITIES,
  RELATION_KIND_OPTIONS,
} from "@/components/objects";
import type { PriorityValue } from "@/components/objects";
import { PartsTable } from "@/components/parts-table";
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
import { lexiconService, objectService, workflowService } from "@/lib/services";
import { trackScadaOperation } from "@/lib/sentry";
import type {
  LexiconItem,
  RelationKind,
  ScadaObject,
  Workflow,
} from "@/lib/supabase/models";

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

export default function ObjectDetailClientPage() {
  const { objectId, projectId } = useParams<{
    objectId: string;
    projectId: string;
  }>();
  const router = useRouter();
  const { user } = useUser();

  const parsedObjectId = Number(objectId);
  const parsedProjectId = Number(projectId);

  const { supabase } = useSupabase();
  const { organization } = useOrganization();

  const { object, loading, error, updateObject } =
    useObject(parsedObjectId);
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
  const {
    isMerging,
    isCompiling,
    mergeAndDownloadPdfs,
    compileAndDownloadPdfs,
  } = usePdfGeneration();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editDialogKey, setEditDialogKey] = useState(0);
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

  const [isLexiconDialogOpen, setIsLexiconDialogOpen] = useState(false);
  const [availableLexiconItems, setAvailableLexiconItems] = useState<
    LexiconItem[]
  >([]);
  const [isLoadingLexiconItems, setIsLoadingLexiconItems] = useState(false);
  const [isLinkingLexicon, setIsLinkingLexicon] = useState(false);

  const [isPdfSelectionDialogOpen, setIsPdfSelectionDialogOpen] =
    useState(false);

  const [projectWorkflows, setProjectWorkflows] = useState<Workflow[]>([]);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false);

  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingObject, setIsDeletingObject] = useState(false);

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

  const loadAvailableLexiconItems = useCallback(async () => {
    if (!supabase || !organization) {
      setAvailableLexiconItems([]);
      return;
    }

    setIsLoadingLexiconItems(true);
    try {
      const items = await lexiconService.getLexiconItemsForOrg(
        supabase,
        organization.id
      );
      const linkedIds = new Set(
        lexiconHook.lexiconLinks.map((link) => link.link.lexicon_id)
      );
      setAvailableLexiconItems(
        items
          .filter((item) => !linkedIds.has(item.id))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    } catch (err) {
      console.error("Failed to load lexicon items", err);
      toast.error("Failed to load lexicon items");
    } finally {
      setIsLoadingLexiconItems(false);
    }
  }, [lexiconHook.lexiconLinks, organization, supabase]);

  useEffect(() => {
    loadProjectObjects();
    loadProjectWorkflows();
  }, [loadProjectObjects, loadProjectWorkflows]);

  useEffect(() => {
    if (isLexiconDialogOpen) {
      void loadAvailableLexiconItems();
    }
  }, [isLexiconDialogOpen, loadAvailableLexiconItems]);

  const storageBucket = useMemo(() => "lexicon-files", []);

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

  const handleOpenEditDialog = () => {
    setEditDialogKey((key) => key + 1);
    setIsEditDialogOpen(true);
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
      toast.success(isDone ? "Task completed" : "Task reopened");
    } catch (err) {
      console.error("Failed to toggle task", err);
      toast.error("Failed to update task");
      throw err;
    }
  };

  const handleUpdateSubtask = async (
    subtaskId: number,
    updates: Partial<typeof subtasksHook.subtasks[0]>
  ) => {
    try {
      // Get the old task before updating
      const oldTask = subtasksHook.subtasks.find((t) => t.id === subtaskId);

      // Update the task
      const updatedTask = await subtasksHook.updateSubtask(subtaskId, updates);

      // Send email notifications to newly added assignees
      if (oldTask && updatedTask && updates.assignee) {
        const context = getNotificationContext(user || null, organization || null, {
          objectName: object?.title,
          projectId: parsedProjectId,
          objectId: parsedObjectId,
        });
        const result = await notifyTaskUpdated(oldTask, updatedTask, context);

        if (!result.success) {
          console.error("Failed to send email notifications:", 'error' in result ? result.error : 'Unknown error');
          // Don't show error to user, just log it
        }
      }

      toast.success("Task updated");
    } catch (err) {
      console.error("Failed to update task", err);
      toast.error("Failed to update task");
      throw err;
    }
  };

  const handleAddSubtask = async (
    title: string,
    details?: string,
    assignee?: string[],
    dueDate?: Date,
    priority?: "low" | "medium" | "high" | "urgent"
  ) => {
    if (!title.trim()) return;

    try {
      const newTask = await subtasksHook.createSubtask(
        title.trim(),
        details,
        assignee,
        dueDate,
        priority
      );

      // Send email notifications to assignees
      if (assignee && assignee.length > 0) {
        const context = getNotificationContext(user || null, organization || null, {
          objectName: object?.title,
          projectId: parsedProjectId,
          objectId: parsedObjectId,
        });
        const result = await notifyTaskCreated(newTask, context);

        if (!result.success) {
          console.error("Failed to send email notifications:", 'error' in result ? result.error : 'Unknown error');
          // Don't show error to user, just log it
        }
      }

      toast.success("Task added");
    } catch (err) {
      console.error("Failed to add task", err);
      toast.error("Failed to add task");
      throw err;
    }
  };

  const handleDeleteSubtask = async (subtaskId: number) => {
    try {
      await subtasksHook.deleteSubtask(subtaskId);
      toast.success("Task deleted");
    } catch (err) {
      console.error("Failed to delete task", err);
      toast.error("Failed to delete task");
      throw err;
    }
  };

  const handleDeleteObject = async () => {
    if (!supabase) return;

    setIsDeletingObject(true);
    try {
      await objectService.deleteObject(supabase, parsedObjectId);

      // Track successful deletion
      trackScadaOperation(
        "object_delete",
        parsedProjectId.toString(),
        true,
        { objectId: parsedObjectId }
      );

      toast.success("Object deleted successfully");

      // Close dialog first to avoid visual glitches
      setIsDeleteDialogOpen(false);

      // Navigate after a brief delay
      setTimeout(() => {
        router.push(`/projects/${parsedProjectId}/objects`);
      }, 100);
    } catch (err) {
      console.error("Failed to delete object", err);

      // Track failed deletion
      trackScadaOperation(
        "object_delete",
        parsedProjectId.toString(),
        false,
        { objectId: parsedObjectId, error: err instanceof Error ? err.message : "Unknown error" }
      );

      // Show actual error message to user
      const errorMessage = err instanceof Error ? err.message : "Failed to delete object";
      toast.error(errorMessage);
    } finally {
      setIsDeletingObject(false);
    }
  };

  const handleReorderSubtasks = async (
    reordered: typeof subtasksHook.subtasks
  ) => {
    try {
      await subtasksHook.reorderSubtasks(reordered);
      toast.success("Tasks reordered");
    } catch (err) {
      console.error("Failed to reorder tasks", err);
      toast.error("Failed to reorder tasks");
      throw err;
    }
  };

  const handleMetadataUpdate = async (metadata: Record<string, unknown>) => {
    try {
      // Preserve parts_list and parts_table_hidden when updating other metadata
      const currentMetadata = object?.metadata || {};
      const { parts_list, parts_table_hidden } = currentMetadata as {
        parts_list?: unknown;
        parts_table_hidden?: boolean;
      };
const updatedMetadata = {
  ...metadata,
  ...(parts_list !== undefined && !('parts_list' in metadata) && { parts_list }),
  ...(parts_table_hidden !== undefined &&
    !('parts_table_hidden' in metadata) && { parts_table_hidden }),
};
      await updateObject({ metadata: updatedMetadata });
      toast.success("Properties updated");
    } catch (err) {
      console.error("Failed to update properties", err);
      toast.error("Failed to update properties");
      throw err;
    }
  };

  const handleTogglePartsTableVisibility = async () => {
    if (!object) return;

    const currentMetadata = object.metadata || {};
    const isCurrentlyHidden =
      (currentMetadata as { parts_table_hidden?: boolean })
        .parts_table_hidden || false;

    try {
      await handleMetadataUpdate({
        ...currentMetadata,
        parts_table_hidden: !isCurrentlyHidden,
      });
    } catch (err) {
      console.error("Failed to toggle parts table visibility", err);
      toast.error("Failed to toggle parts table visibility");
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

      // Show the rename dialog instead of uploading immediately
      setFileToUpload(file);
      setIsRenameDialogOpen(true);

      // Clear the input so the same file can be selected again
      event.target.value = "";
    },
    [object]
  );

  const handleFileDrop = useCallback(
    async (file: File) => {
      if (!object) {
        toast.error("Object data is still loading");
        return;
      }

      // Show the rename dialog instead of uploading immediately
      setFileToUpload(file);
      setIsRenameDialogOpen(true);
    },
    [object]
  );

  const handleConfirmRename = useCallback(
    async (newFileName: string) => {
      if (!fileToUpload || !object) return;

      try {
        // Create a new File object with the renamed filename
        const renamedFile = new File([fileToUpload], newFileName, {
          type: fileToUpload.type,
        });

        await uploadObjectFile({
          file: renamedFile,
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
        setFileToUpload(null);
      }
    },
    [
      fileToUpload,
      object,
      parsedObjectId,
      parsedProjectId,
      reloadFiles,
      uploadObjectFile,
    ]
  );

  const handleCancelRename = useCallback(() => {
    setFileToUpload(null);
  }, []);

  const handleViewFile = openObjectFile;

  const handleOpenLinkDialog = useCallback(() => {
    void loadProjectObjects();
    setIsLinkDialogOpen(true);
  }, [loadProjectObjects]);

  const handleOpenLexiconDialog = useCallback(() => {
    if (!organization) {
      toast.error("Join an organization to link lexicon items");
      return;
    }

    void loadAvailableLexiconItems();
    setIsLexiconDialogOpen(true);
  }, [loadAvailableLexiconItems, organization]);

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

  const handleLinkLexicon = useCallback(
    async (lexiconId: number, note: string) => {
      try {
        setIsLinkingLexicon(true);
        await lexiconHook.linkLexiconItem(lexiconId, note);
        toast.success("Lexicon item linked");
        setIsLexiconDialogOpen(false);
      } catch (err) {
        console.error("Failed to link lexicon item", err);
        toast.error("Failed to link lexicon item");
        throw err;
      } finally {
        setIsLinkingLexicon(false);
      }
    },
    [lexiconHook]
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
      if (isLexiconDialogOpen) {
        void loadAvailableLexiconItems();
      }
    } catch (err) {
      console.error("Failed to unlink lexicon item", err);
      toast.error("Failed to unlink lexicon item");
      throw err;
    }
  };

  const handleInheritLexiconProperties = async (
    lexiconId: number,
    attributes: Record<string, unknown>
  ) => {
    try {
      if (!object) {
        toast.error("Object data is not available");
        return;
      }

      // Merge the lexicon attributes with existing metadata
      const currentMetadata = object.metadata || {};
      const updatedMetadata = { ...currentMetadata, ...attributes };

      await handleMetadataUpdate(updatedMetadata);
      toast.success(
        `Inherited ${
          Object.keys(attributes).length
        } properties from lexicon item`
      );
    } catch (err) {
      console.error("Failed to inherit lexicon properties", err);
      toast.error("Failed to inherit properties");
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

  const handlePdfTypeSelection = useCallback(
    (type: "merge-pdfs" | "compile-pdfs") => {
      if (!object) return;

      switch (type) {
        case "merge-pdfs": {
          const pdfFileIds = objectFiles
            .filter((f) => f.mime_type === "application/pdf")
            .map((f) => f.id);
          mergeAndDownloadPdfs(pdfFileIds, `merged-${object.title}.pdf`);
          break;
        }
        case "compile-pdfs":
          compileAndDownloadPdfs(parsedObjectId, object.title);
          break;
      }
    },
    [
      object,
      parsedObjectId,
      objectFiles,
      mergeAndDownloadPdfs,
      compileAndDownloadPdfs,
    ]
  );

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
              <Button
                variant="outline"
                onClick={() => router.push(`/projects/${projectId}/objects`)}
              >
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
        <ObjectHeader
          object={object}
          orgUsers={organizationUsers.map(({ userId, name }) => ({
            userId,
            name,
          }))}
          onEdit={handleOpenEditDialog}
          onDelete={() => setIsDeleteDialogOpen(true)}
          isPartsTableHidden={
            (object.metadata as { parts_table_hidden?: boolean })
              ?.parts_table_hidden || false
          }
          onTogglePartsTable={handleTogglePartsTableVisibility}
        />

        <div className="flex gap-2 mb-4 flex-wrap">
          <Button
            onClick={() => setIsPdfSelectionDialogOpen(true)}
            disabled={isMerging || isCompiling}
            variant="outline"
          >
            <FileText className="h-4 w-4 mr-2" />
            {isMerging || isCompiling
              ? "Processing..."
              : "Generate PDF"}
          </Button>
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
              projectId={parsedProjectId}
              onAddWorkflow={handleAddWorkflow}
              onRemoveWorkflow={handleRemoveWorkflow}
              loading={isLoadingWorkflows}
            />

            <SubtasksCard
              subtasks={subtasksHook.subtasks}
              onToggle={handleToggleSubtask}
              onAdd={handleAddSubtask}
              onUpdate={handleUpdateSubtask}
              onDelete={handleDeleteSubtask}
              onReorder={handleReorderSubtasks}
              orgUsers={organizationUsers.map(({ userId, name }) => ({
                userId,
                name,
              }))}
            />

            {!(object.metadata as { parts_table_hidden?: boolean })
              ?.parts_table_hidden && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <PartsTable
                  objectId={parsedObjectId}
                  projectId={parsedProjectId}
                  showProjectColumn={false}
                  showObjectColumn={false}
                />
              </div>
            )}

            <FilesCard
              files={objectFiles}
              onUpload={handleUploadClick}
              onFileDrop={handleFileDrop}
              onUnlink={handleUnlinkFile}
              onDelete={handleDeleteFile}
              onView={handleViewFile}
              isUploading={isUploadingFile}
              viewingFileId={viewingFileId}
            />
          </div>

          <div className="space-y-6">
            <PropertiesCard
              metadata={(() => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { parts_list, parts_table_hidden, ...rest } =
                  object.metadata || {};
                return rest;
              })()}
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
              onAdd={handleOpenLexiconDialog}
              onUnlink={handleUnlinkLexicon}
              onInheritProperties={handleInheritLexiconProperties}
              onNavigate={(lexiconId) => router.push(`/lexicon/${lexiconId}`)}
            />
          </div>
        </div>
      </main>

      <EditObjectDialog
        key={editDialogKey}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
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

      <LinkLexiconDialog
        open={isLexiconDialogOpen}
        onOpenChange={setIsLexiconDialogOpen}
        items={availableLexiconItems.map((item) => ({
          id: item.id,
          name: item.name,
          type: item.type,
        }))}
        onSubmit={handleLinkLexicon}
        isSubmitting={isLinkingLexicon}
        isLoadingItems={isLoadingLexiconItems}
      />

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

      <PdfSelectionDialog
        open={isPdfSelectionDialogOpen}
        onOpenChange={setIsPdfSelectionDialogOpen}
        onSelect={handlePdfTypeSelection}
        pdfCount={objectFiles.filter((f) => f.mime_type === "application/pdf").length}
      />

      <FileRenameDialog
        open={isRenameDialogOpen}
        onOpenChange={setIsRenameDialogOpen}
        originalFileName={fileToUpload?.name ?? ""}
        onConfirm={handleConfirmRename}
        onCancel={handleCancelRename}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Object</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{object?.title}&rdquo;? This
              action cannot be undone. All associated data including files,
              connections, and subtasks will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingObject}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteObject}
              disabled={isDeletingObject}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingObject ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
