/**
 * Client-side utility for sending task assignment notification emails
 *
 * This function calls the API route to send emails to newly assigned users
 */

interface SendTaskNotificationParams {
  taskId: number;
  newAssigneeIds: string[];
  assignerName: string;
  organizationName: string;
  objectName?: string;
  projectId?: number;
  objectId?: number;
}

interface NotificationResult {
  success: boolean;
  message?: string;
  results?: Array<{
    assigneeId: string;
    status: string;
    success?: boolean;
    error?: string;
  }>;
  error?: string;
}

/**
 * Send task assignment notifications to newly assigned users
 *
 * @param params - Notification parameters
 * @returns Promise with notification results
 */
export async function sendTaskNotification(
  params: SendTaskNotificationParams
): Promise<NotificationResult> {
  try {
    const response = await fetch('/api/tasks/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taskId: params.taskId,
        assigneeIds: params.newAssigneeIds,
        assignerName: params.assignerName,
        organizationName: params.organizationName,
        objectName: params.objectName,
        projectId: params.projectId,
        objectId: params.objectId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send notifications');
    }

    const result = await response.json();
    return {
      success: true,
      message: result.message,
      results: result.results,
    };
  } catch (error) {
    console.error('Error sending task notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Helper function to compare old and new assignee lists
 * and return only the newly added assignees
 *
 * @param oldAssignees - Previous assignee IDs
 * @param newAssignees - New assignee IDs
 * @returns Array of newly added assignee IDs
 */
export function getNewlyAddedAssignees(
  oldAssignees: string[],
  newAssignees: string[]
): string[] {
  return newAssignees.filter((id) => !oldAssignees.includes(id));
}
