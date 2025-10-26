"use client";

import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "../supabase/SupabaseProvider";
import { ObjectSubtask } from "../supabase/models";
import { objectSubtaskService } from "../services";

export function useSubtasks(objectId: number) {
  const { supabase } = useSupabase();
  const [subtasks, setSubtasks] = useState<ObjectSubtask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubtasks = useCallback(async () => {
    if (!supabase || !objectId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await objectSubtaskService.getSubtasksByObject(
        supabase,
        objectId
      );
      setSubtasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subtasks");
    } finally {
      setLoading(false);
    }
  }, [supabase, objectId]);

  useEffect(() => {
    loadSubtasks();
  }, [loadSubtasks]);

  const createSubtask = useCallback(
    async (title: string) => {
      if (!supabase) throw new Error("Supabase client not initialized");

      try {
        const maxOrder =
          subtasks.length > 0
            ? Math.max(...subtasks.map((s) => s.sort_order))
            : 0;

        const newSubtask = await objectSubtaskService.createSubtask(supabase, {
          object_id: objectId,
          title,
          is_done: false,
          sort_order: maxOrder + 1,
        });

        setSubtasks((prev) => [...prev, newSubtask]);
        return newSubtask;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create subtask"
        );
        throw err;
      }
    },
    [supabase, objectId, subtasks]
  );

  const updateSubtask = useCallback(
    async (subtaskId: number, updates: Partial<ObjectSubtask>) => {
      if (!supabase) throw new Error("Supabase client not initialized");

      try {
        const updated = await objectSubtaskService.updateSubtask(
          supabase,
          subtaskId,
          updates
        );

        setSubtasks((prev) =>
          prev.map((st) => (st.id === subtaskId ? updated : st))
        );
        return updated;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update subtask"
        );
        throw err;
      }
    },
    [supabase]
  );

  const toggleSubtask = useCallback(
    async (subtaskId: number, isDone: boolean) => {
      return updateSubtask(subtaskId, { is_done: isDone });
    },
    [updateSubtask]
  );

  const deleteSubtask = useCallback(
    async (subtaskId: number) => {
      if (!supabase) throw new Error("Supabase client not initialized");

      try {
        const { error } = await supabase
          .from("object_subtasks")
          .delete()
          .eq("id", subtaskId);

        if (error) throw error;

        setSubtasks((prev) => prev.filter((st) => st.id !== subtaskId));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete subtask"
        );
        throw err;
      }
    },
    [supabase]
  );

  const reorderSubtasks = useCallback(
    async (reorderedSubtasks: ObjectSubtask[]) => {
      if (!supabase) throw new Error("Supabase client not initialized");

      try {
        // Update sort_order for all subtasks
        const updates = reorderedSubtasks.map((subtask, index) =>
          objectSubtaskService.updateSubtask(supabase, subtask.id, {
            sort_order: index,
          })
        );

        await Promise.all(updates);
        setSubtasks(reorderedSubtasks);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to reorder subtasks"
        );
        throw err;
      }
    },
    [supabase]
  );

  return {
    subtasks,
    loading,
    error,
    createSubtask,
    updateSubtask,
    toggleSubtask,
    deleteSubtask,
    reorderSubtasks,
    reloadSubtasks: loadSubtasks,
  };
}
