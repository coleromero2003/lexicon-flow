"use client";

import { useCallback, useEffect, useState } from "react";
import { useOrganization } from "@clerk/nextjs";
import { useSupabase } from "../supabase/SupabaseProvider";
import { Task } from "../supabase/models";
import { taskService } from "../services";

export function useSubtasks(objectId: number) {
  const { supabase } = useSupabase();
  const { organization } = useOrganization();
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubtasks = useCallback(async () => {
    if (!supabase || !objectId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await taskService.getTasksByObject(
        supabase,
        objectId
      );
      setSubtasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [supabase, objectId]);

  useEffect(() => {
    loadSubtasks();
  }, [loadSubtasks]);

  const createSubtask = useCallback(
    async (title: string, details?: string, assignee?: string[], dueDate?: Date, priority?: Task["priority"]) => {
      if (!supabase) throw new Error("Supabase client not initialized");
      if (!organization) throw new Error("Organization not found");

      try {
        const maxOrder =
          subtasks.length > 0
            ? Math.max(...subtasks.map((s) => s.sort_order))
            : 0;

        const newSubtask = await taskService.createTask(supabase, {
          org_id: organization.id,
          object_id: objectId,
          title,
          details: details || null,
          assignee: assignee || [],
          due_date: dueDate ? dueDate.toISOString().split('T')[0] : null,
          priority: priority || "medium",
          is_done: false,
          sort_order: maxOrder + 1,
        });

        setSubtasks((prev) => [...prev, newSubtask]);
        return newSubtask;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create task"
        );
        throw err;
      }
    },
    [supabase, objectId, organization, subtasks]
  );

  const updateSubtask = useCallback(
    async (subtaskId: number, updates: Partial<Task>) => {
      if (!supabase) throw new Error("Supabase client not initialized");

      try {
        const updated = await taskService.updateTask(
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
          err instanceof Error ? err.message : "Failed to update task"
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
        await taskService.deleteTask(supabase, subtaskId);
        setSubtasks((prev) => prev.filter((st) => st.id !== subtaskId));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete task"
        );
        throw err;
      }
    },
    [supabase]
  );

  const reorderSubtasks = useCallback(
    async (reorderedSubtasks: Task[]) => {
      if (!supabase) throw new Error("Supabase client not initialized");

      try {
        // Update sort_order for all subtasks
        const updates = reorderedSubtasks.map((subtask, index) =>
          taskService.updateTask(supabase, subtask.id, {
            sort_order: index,
          })
        );

        await Promise.all(updates);
        setSubtasks(reorderedSubtasks);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to reorder tasks"
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
