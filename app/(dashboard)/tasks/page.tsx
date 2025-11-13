"use client";

import { useState, useCallback, useEffect } from "react";
import { useOrganization, useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Plus, ListTodo, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TasksTable } from "@/components/tasks/tasks-table";
import { AddTaskDialog } from "@/components/objects/add-task-dialog";
import { EditTaskDialog } from "@/components/objects/edit-task-dialog";
import { LinkTaskToObjectDialog } from "@/components/tasks/link-task-to-object-dialog";
import { useTasks } from "@/lib/hooks/useTasks";
import { useOrganizationUsers } from "@/lib/hooks/useOrganizationUsers";
import { useSupabase } from "@/lib/supabase/SupabaseProvider";
import { Task, ObjectPriority, ScadaObject } from "@/lib/supabase/models";
import { Badge } from "@/components/ui/badge";
import { notifyTaskCreated, notifyTaskUpdated, getNotificationContext } from "@/lib/email/task-notification-helpers";
import { objectService, taskService } from "@/lib/services";

export default function TasksPage() {
  const { organization, membership } = useOrganization();
  const { user } = useUser();
  const { supabase } = useSupabase();
  const { users: organizationUsers } = useOrganizationUsers();

  // Check if user is admin
  const isAdmin = membership?.role === "org:admin";

  // Fetch tasks (all for admins, only assigned for regular users)
  const { tasks, loading, error, updateTask, deleteTask, reloadTasks } = useTasks({
    fetchAll: isAdmin,
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [linkingTask, setLinkingTask] = useState<Task | null>(null);

  const [allObjects, setAllObjects] = useState<ScadaObject[]>([]);
  const [isLoadingObjects, setIsLoadingObjects] = useState(false);

  // Load all objects in the organization for linking
  const loadObjects = useCallback(async () => {
    if (!supabase) return;

    try {
      setIsLoadingObjects(true);
      const objects = await objectService.getObjectsByOrganization(supabase);
      // Sort by title for better UX in the link dialog
      const sortedObjects = objects.sort((a, b) => a.title.localeCompare(b.title));
      setAllObjects(sortedObjects);
    } catch (err) {
      console.error("Failed to load objects", err);
      toast.error("Failed to load objects");
    } finally {
      setIsLoadingObjects(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadObjects();
  }, [loadObjects]);

  const handleAddTask = async (task: {
    title: string;
    details?: string;
    assignee?: string[];
    dueDate?: Date;
    priority?: ObjectPriority;
  }) => {
    if (!organization) {
      toast.error("Organization not found");
      return;
    }

    try {
      if (!supabase) throw new Error("Supabase client not initialized");

      const newTask = await taskService.createTask(supabase, {
        org_id: organization.id,
        object_id: null, // Standalone task
        title: task.title,
        details: task.details || null,
        assignee: task.assignee || [],
        due_date: task.dueDate ? task.dueDate.toISOString().split("T")[0] : null,
        priority: task.priority || "medium",
        is_done: false,
        sort_order: 0,
      });

      toast.success("Task created successfully");

      // Send email notifications to assignees
      if (newTask && task.assignee && task.assignee.length > 0) {
        const context = getNotificationContext(user || null, organization || null);
        const result = await notifyTaskCreated(newTask, context);

        if (!result.success) {
          console.error("Failed to send email notifications:", 'error' in result ? result.error : 'Unknown error');
          // Don't show error to user, just log it
        }
      }

      await reloadTasks();
    } catch (err) {
      console.error("Failed to create task", err);
      toast.error("Failed to create task");
      throw err;
    }
  };

  const handleEditTask = async (taskId: number, updates: Partial<Task>) => {
    try {
      // Get the old task before updating
      const oldTask = tasks.find((t) => t.id === taskId);

      // Update the task
      const updatedTask = await updateTask(taskId, updates);

      // Send email notifications to newly added assignees
      if (oldTask && updatedTask && updates.assignee) {
        const context = getNotificationContext(user || null, organization || null);
        const result = await notifyTaskUpdated(oldTask, updatedTask, context);

        if (!result.success) {
          console.error("Failed to send email notifications:", 'error' in result ? result.error : 'Unknown error');
          // Don't show error to user, just log it
        }
      }

      toast.success("Task updated successfully");
    } catch (err) {
      console.error("Failed to update task", err);
      toast.error("Failed to update task");
      throw err;
    }
  };

  const handleToggleTask = (taskId: number, isDone: boolean) => {
    updateTask(taskId, { is_done: isDone })
      .then(() => toast.success(isDone ? "Task completed" : "Task reopened"))
      .catch((err) => {
        console.error("Failed to toggle task", err);
        toast.error("Failed to update task");
      });
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await deleteTask(taskId);
      toast.success("Task deleted successfully");
    } catch (err) {
      console.error("Failed to delete task", err);
      toast.error("Failed to delete task");
    }
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  const handleOpenLinkDialog = (task: Task) => {
    setLinkingTask(task);
    setIsLinkDialogOpen(true);
  };

  const handleLinkToObject = async (objectId: number) => {
    if (!linkingTask) return;

    try {
      await updateTask(linkingTask.id, { object_id: objectId });
      toast.success("Task linked to object successfully");
      setIsLinkDialogOpen(false);
      setLinkingTask(null);
    } catch (err) {
      console.error("Failed to link task", err);
      toast.error("Failed to link task to object");
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-6 sm:py-8">
          <Skeleton className="h-10 w-64 mb-6" />
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-6 sm:py-8">
          <div className="text-center text-red-600">Error: {error}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <ListTodo className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
            </div>
            {isAdmin && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                <Shield className="h-3 w-3 mr-1" />
                Admin View
              </Badge>
            )}
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>

        {/* Description */}
        <p className="text-gray-600 mb-6">
          {isAdmin
            ? "View and manage all tasks in your organization."
            : "View and manage tasks assigned to you."}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Tasks</CardDescription>
              <CardTitle className="text-3xl">{tasks.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active Tasks</CardDescription>
              <CardTitle className="text-3xl">
                {tasks.filter((t) => !t.is_done).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Completed Tasks</CardDescription>
              <CardTitle className="text-3xl">
                {tasks.filter((t) => t.is_done).length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Tasks Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Tasks</CardTitle>
            <CardDescription>
              {isAdmin
                ? "Manage all tasks across your organization"
                : "Tasks assigned to you"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TasksTable
              tasks={tasks}
              objects={allObjects}
              orgUsers={organizationUsers.map(({ userId, name }) => ({
                userId,
                name,
              }))}
              onToggle={handleToggleTask}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteTask}
              onLinkToObject={handleOpenLinkDialog}
            />
          </CardContent>
        </Card>
      </main>

      {/* Dialogs */}
      <AddTaskDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddTask}
        orgUsers={organizationUsers.map(({ userId, name }) => ({
          userId,
          name,
        }))}
      />

      <EditTaskDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        task={editingTask}
        onSubmit={handleEditTask}
        orgUsers={organizationUsers.map(({ userId, name }) => ({
          userId,
          name,
        }))}
      />

      <LinkTaskToObjectDialog
        open={isLinkDialogOpen}
        onOpenChange={setIsLinkDialogOpen}
        objects={allObjects}
        onSubmit={handleLinkToObject}
        isLoadingObjects={isLoadingObjects}
      />
    </div>
  );
}
