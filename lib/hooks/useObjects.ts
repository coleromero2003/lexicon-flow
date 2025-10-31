"use client";

import { useOrganization } from "@clerk/nextjs";
import {
  objectService,
  objectRelationService,
  objectSubtaskService,
  objectFileService,
  objectLexiconService,
  fileService,
  lexiconService,
  stepService,
  workflowService,
} from "../services";
import { useEffect, useState } from "react";
import {
  ScadaObject,
  ObjectRelation,
  ObjectSubtask,
  FileMeta,
  LexiconItem,
  ObjectLexiconLink,
  Workflow,
  Step,
} from "../supabase/models";
import { useSupabase } from "../supabase/SupabaseProvider";

export interface ObjectWithAllDetails extends ScadaObject {
  workflows: Array<{
    workflow: Workflow;
    step: Step | null;
  }>;
  relations: Array<{
    relation: ObjectRelation;
    relatedObject: ScadaObject;
  }>;
  subtasks: ObjectSubtask[];
  files: FileMeta[];
  lexiconLinks: Array<{
    link: ObjectLexiconLink;
    lexiconItem: LexiconItem;
  }>;
}

export function useObject(objectId: number) {
  const { supabase } = useSupabase();
  const { organization } = useOrganization();

  const [object, setObject] = useState<ObjectWithAllDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (objectId && organization) {
      loadObject();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectId, organization, supabase]);

  async function loadObject() {
    if (!objectId) return;
    if (!supabase) return;

    try {
      setLoading(true);
      setError(null);

      // Get the base object
      const baseObject = await objectService.getObject(supabase, objectId);

      if (!baseObject) {
        throw new Error("Object not found");
      }

      // Get workflows and steps
      const workflowsWithSteps = await Promise.all(
        (baseObject.workflow_id || []).map(async (wfId, index) => {
          const workflow = await workflowService.getWorkflow(supabase, wfId);
          if (!workflow) {
            throw new Error(`Workflow ${wfId} not found`);
          }
          const stepId = baseObject.step_id?.[index];
          let step = null;
          if (stepId) {
            step = await stepService.getStep(supabase, stepId);
          }
          return { workflow, step };
        })
      );

      // Get relations
      const relations = await objectRelationService.getRelationsByObject(
        supabase,
        objectId
      );

      // For each relation, get the related object details
      const relationsWithObjects = (
        await Promise.all(
          relations.map(async (relation) => {
            const relatedObjectId =
              relation.src_object_id === objectId
                ? relation.dst_object_id
                : relation.src_object_id;
            const relatedObject = await objectService.getObject(
              supabase,
              relatedObjectId
            );
            return relatedObject
              ? {
                  relation,
                  relatedObject,
                }
              : null;
          })
        )
      ).filter((item): item is { relation: ObjectRelation; relatedObject: ScadaObject } => item !== null);

      // Get subtasks
      const subtasks = await objectSubtaskService.getSubtasksByObject(
        supabase,
        objectId
      );

      // Get files
      const fileLinks = await objectFileService.getFilesByObject(
        supabase,
        objectId
      );
      const files = (
        await Promise.all(
          fileLinks.map((link) => fileService.getFile(supabase, link.file_id))
        )
      ).filter((file): file is FileMeta => file !== null);

      // Get lexicon links
      const lexiconLinks = await objectLexiconService.getLexiconByObject(
        supabase,
        objectId
      );
      const lexiconLinksWithItems = (
        await Promise.all(
          lexiconLinks.map(async (link) => {
            const lexiconItem = await lexiconService.getLexiconItem(
              supabase,
              link.lexicon_id
            );
            return lexiconItem
              ? {
                  link,
                  lexiconItem,
                }
              : null;
          })
        )
      ).filter((item): item is { link: ObjectLexiconLink; lexiconItem: LexiconItem } => item !== null);

      // Combine all data
      const objectWithDetails: ObjectWithAllDetails = {
        ...baseObject,
        workflows: workflowsWithSteps,
        relations: relationsWithObjects,
        subtasks,
        files,
        lexiconLinks: lexiconLinksWithItems,
      };

      setObject(objectWithDetails);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load object.");
    } finally {
      setLoading(false);
    }
  }

  async function updateObject(updates: Partial<ScadaObject>) {
    if (!supabase) throw new Error("Supabase client not initialized");
    if (!objectId) throw new Error("Object ID not provided");

    try {
      const updatedObject = await objectService.updateObject(
        supabase,
        objectId,
        updates
      );

      // Reload the full object to get all relationships
      await loadObject();

      return updatedObject;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update object."
      );
      throw err;
    }
  }

  async function toggleSubtask(subtaskId: number, isDone: boolean) {
    if (!supabase) throw new Error("Supabase client not initialized");

    try {
      await objectSubtaskService.updateSubtask(supabase, subtaskId, {
        is_done: isDone,
      });

      // Update local state
      setObject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          subtasks: prev.subtasks.map((st) =>
            st.id === subtaskId ? { ...st, is_done: isDone } : st
          ),
        };
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update subtask."
      );
      throw err;
    }
  }

  return {
    object,
    loading,
    error,
    updateObject,
    toggleSubtask,
    reloadObject: loadObject,
  };
}
