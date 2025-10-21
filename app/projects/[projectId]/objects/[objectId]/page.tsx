"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, FileText } from "lucide-react";

import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ConnectionsCard,
  DescriptionCard,
  EditObjectSheet,
  FilesCard,
  LexiconCard,
  ObjectHeader,
  PropertiesCard,
  SubtasksCard,
  WorkflowsCard,
  PRIORITIES,
  PriorityValue,
} from "@/components/objects";
import { useObject } from "@/lib/hooks/useObjects";
import { useSubtasks } from "@/lib/hooks/useSubtasks";
import { useObjectFiles } from "@/lib/hooks/useObjectFiles";
import { useObjectRelations } from "@/lib/hooks/useObjectRelations";
import { useObjectLexicon } from "@/lib/hooks/useObjectLexicon";
import { useOrganizationUsers } from "@/lib/hooks/useOrganizationUsers";
import { useMetadataSuggestions } from "@/lib/hooks/useMetadataSuggestions";
import { useSupabase } from "@/lib/supabase/SupabaseProvider";
import { objectService } from "@/lib/services";

export default function ObjectPage() {
  const { objectId, projectId } = useParams<{
    objectId: string;
    projectId: string;
  }>();
  const router = useRouter();

  const parsedObjectId = Number(objectId);
  const parsedProjectId = Number(projectId);

  const { supabase } = useSupabase();

  const { object, loading, error, updateObject } = useObject(parsedObjectId);
  const subtasksHook = useSubtasks(parsedObjectId);
  const filesHook = useObjectFiles(parsedObjectId);
  const relationsHook = useObjectRelations(parsedObjectId);
  const lexiconHook = useObjectLexicon(parsedObjectId);
  const { users: organizationUsers } = useOrganizationUsers();
  const { suggestions: metadataSuggestions } = useMetadataSuggestions(
    parsedProjectId
  );

  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [editSheetKey, setEditSheetKey] = useState(0);
  const [editInitialValues, setEditInitialValues] = useState({
    title: "",
    assignee: "",
    dueDate: undefined as Date | undefined,
    priority: PRIORITIES[1]?.value ?? ("medium" as PriorityValue),
  });

  const descriptionTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!object) return;

    setEditInitialValues({
      title: object.title,
      assignee: object.assignee || "",
      dueDate: object.due_date ? new Date(object.due_date) : undefined,
      priority: (object.priority as PriorityValue) || "medium",
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
    assignee: string;
    dueDate: Date | undefined;
    priority: string;
  }) => {
    try {
      await updateObject({
        title,
        assignee: assignee || null,
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

  const handleReorderSubtasks = async (reordered: typeof subtasksHook.subtasks) => {
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
      await filesHook.unlinkFile(fileId);
      toast.success("File removed");
    } catch (err) {
      console.error("Failed to unlink file", err);
      toast.error("Failed to unlink file");
      throw err;
    }
  };

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

  if (loading || subtasksHook.loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar boardTitle="Loading..." />
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
        <Navbar boardTitle="Error" />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <EmptyState
            icon={<FileText className="h-12 w-12" />}
            title="Object not found"
            description={
              error ||
              "The object you're looking for doesn't exist or has been deleted."
            }
            action={
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
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
      <Navbar boardTitle={object.title} />

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <ObjectHeader
          object={object}
          orgUsers={organizationUsers.map(({ userId, name }) => ({
            userId,
            name,
          }))}
          onEdit={handleOpenEditSheet}
          onBack={() => router.back()}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6 lg:gap-8">
          <div className="space-y-6">
            <DescriptionCard
              description={object.description_md || ""}
              onChange={handleDescriptionChange}
            />

            <WorkflowsCard workflows={object.workflows} />

            <SubtasksCard
              subtasks={subtasksHook.subtasks}
              onToggle={handleToggleSubtask}
              onAdd={handleAddSubtask}
              onDelete={handleDeleteSubtask}
              onReorder={handleReorderSubtasks}
            />

            <FilesCard files={filesHook.files} onUnlink={handleUnlinkFile} />
          </div>

          <div className="space-y-6">
            <PropertiesCard
              metadata={object.metadata || {}}
              suggestions={metadataSuggestions}
              onUpdate={handleMetadataUpdate}
            />

            <ConnectionsCard
              relations={relationsHook.relations}
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
    </div>
  );
}
