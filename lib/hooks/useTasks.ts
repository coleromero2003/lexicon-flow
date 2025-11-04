"use client";

import { useCallback, useEffect, useState } from "react";
import { useOrganization, useUser } from "@clerk/nextjs";
import { useSupabase } from "../supabase/SupabaseProvider";
import { Task } from "../supabase/models";
import { taskService } from "../services";

interface UseTasksOptions {
  /**
   * If true, fetches all tasks for the organization (admin view).
   * If false, fetches only tasks assigned to the current user.
   */
  fetchAll?: boolean;

  /**
   * If true, only fetches standalone tasks (not linked to any object).
   */
  standaloneOnly?: boolean;
}

export function useTasks(options: UseTasksOptions = {}) {
  const { supabase } = useSupabase();
  const { organization } = useOrganization();
  const { user } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { fetchAll = false, standaloneOnly = false } = options;

  const loadTasks = useCallback(async () => {
    if (!supabase || !organization || !user) return;

    try {
      setLoading(true);
      setError(null);

      let data: Task[];

      if (standaloneOnly) {
        // Fetch standalone tasks only
        data = await taskService.getStandaloneTasks(supabase);
      } else {
        // Fetch all tasks for the organization
        data = await taskService.getTasksByOrg(supabase);
      }

      // Filter by user if not fetchAll
      if (!fetchAll && user.id) {
        data = data.filter((task) =>
          task.assignee && task.assignee.includes(user.id)
        );
      }

      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [supabase, organization, user, fetchAll, standaloneOnly]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const createTask = useCallback(
    async (
      task: Omit<Task, "id" | "created_at" | "updated_at">
    ): Promise<Task> => {
      if (!supabase) throw new Error("Supabase client not initialized");
      if (!organization) throw new Error("Organization not found");

      try {
        const newTask = await taskService.createTask(supabase, {
          ...task,
          org_id: organization.id,
        });

        setTasks((prev) => [newTask, ...prev]);
        return newTask;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create task");
        throw err;
      }
    },
    [supabase, organization]
  );

  const updateTask = useCallback(
    async (taskId: number, updates: Partial<Task>): Promise<Task> => {
      if (!supabase) throw new Error("Supabase client not initialized");

      try {
        const updated = await taskService.updateTask(supabase, taskId, updates);

        setTasks((prev) =>
          prev.map((task) => (task.id === taskId ? updated : task))
        );
        return updated;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update task");
        throw err;
      }
    },
    [supabase]
  );

  const deleteTask = useCallback(
    async (taskId: number): Promise<void> => {
      if (!supabase) throw new Error("Supabase client not initialized");

      try {
        await taskService.deleteTask(supabase, taskId);
        setTasks((prev) => prev.filter((task) => task.id !== taskId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete task");
        throw err;
      }
    },
    [supabase]
  );

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    reloadTasks: loadTasks,
  };
}
