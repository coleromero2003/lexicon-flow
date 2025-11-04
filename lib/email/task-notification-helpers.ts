/**
 * Helper functions for integrating task assignment notifications
 * into your UI components
 */

import { Task } from '../supabase/models';
import { sendTaskNotification, getNewlyAddedAssignees } from './send-task-notification';

interface NotificationContext {
  assignerName: string;
  organizationName: string;
  objectName?: string;
  projectId?: number;
  objectId?: number;
}

/**
 * Send notifications for a newly created task
 * Call this after successfully creating a task with assignees
 *
 * @example
 * ```tsx
 * const newTask = await createTask({ title, assignee: [userId1, userId2], ... });
 * await notifyTaskCreated(newTask, {
 *   assignerName: currentUser.fullName,
 *   organizationName: organization.name,
 * });
 * ```
 */
export async function notifyTaskCreated(
  task: Task,
  context: NotificationContext
) {
  // Only send notifications if there are assignees
  if (!task.assignee || task.assignee.length === 0) {
    return { success: true, message: 'No assignees to notify' };
  }

  return sendTaskNotification({
    taskId: task.id,
    newAssigneeIds: task.assignee,
    assignerName: context.assignerName,
    organizationName: context.organizationName,
    objectName: context.objectName,
    projectId: context.projectId,
    objectId: context.objectId,
  });
}

/**
 * Send notifications for a task that has been updated
 * Only notifies newly added assignees (not removed ones)
 *
 * @example
 * ```tsx
 * const oldTask = tasks.find(t => t.id === taskId);
 * const updatedTask = await updateTask(taskId, { assignee: [...newAssignees] });
 * await notifyTaskUpdated(oldTask, updatedTask, {
 *   assignerName: currentUser.fullName,
 *   organizationName: organization.name,
 * });
 * ```
 */
export async function notifyTaskUpdated(
  oldTask: Task,
  updatedTask: Task,
  context: NotificationContext
) {
  // Find newly added assignees
  const oldAssignees = oldTask.assignee || [];
  const newAssignees = updatedTask.assignee || [];
  const newlyAdded = getNewlyAddedAssignees(oldAssignees, newAssignees);

  // Only send notifications if there are new assignees
  if (newlyAdded.length === 0) {
    return { success: true, message: 'No new assignees to notify' };
  }

  return sendTaskNotification({
    taskId: updatedTask.id,
    newAssigneeIds: newlyAdded,
    assignerName: context.assignerName,
    organizationName: context.organizationName,
    objectName: context.objectName,
    projectId: context.projectId,
    objectId: context.objectId,
  });
}

/**
 * Convenience function to get notification context from Clerk hooks
 *
 * @example
 * ```tsx
 * const { user } = useUser();
 * const { organization } = useOrganization();
 * const context = getNotificationContext(user, organization);
 * await notifyTaskCreated(newTask, context);
 * ```
 */
export function getNotificationContext(
  user: {
    firstName?: string | null;
    lastName?: string | null;
    primaryEmailAddress?: { emailAddress?: string } | null;
  } | null,
  organization: { name?: string } | null,
  options?: {
    objectName?: string;
    projectId?: number;
    objectId?: number;
  }
): NotificationContext {
  const assignerName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.primaryEmailAddress?.emailAddress || 'A team member';

  const organizationName = organization?.name || 'your organization';

  return {
    assignerName,
    organizationName,
    objectName: options?.objectName,
    projectId: options?.projectId,
    objectId: options?.objectId,
  };
}
