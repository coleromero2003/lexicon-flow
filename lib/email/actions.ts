'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { sendTaskAssignmentEmail } from './email-service';
import { Task } from '../supabase/models';

interface SendTaskNotificationParams {
  task: Task;
  assigneeIds: string[];
  assignerName: string;
  organizationName: string;
  objectName?: string;
  projectId?: number;
  objectId?: number;
}

/**
 * Server action to send task assignment notifications
 * This is called from the client and runs on the server
 */
export async function sendTaskNotificationAction(params: SendTaskNotificationParams) {
  try {
    // Verify authentication
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify task belongs to the same organization
    if (params.task.org_id !== orgId) {
      return { success: false, error: 'Forbidden' };
    }

    // Fetch assignee details from Clerk
    const client = await clerkClient();
    const organizationMemberships = await client.organizations.getOrganizationMembershipList({
      organizationId: orgId,
    });

    // Send emails to each assignee
    const emailResults = await Promise.allSettled(
      params.assigneeIds.map(async (assigneeId) => {
        // Find the user in organization members
        const membership = organizationMemberships.data.find(
          (m) => m.publicUserData?.userId === assigneeId
        );

        if (!membership?.publicUserData) {
          throw new Error(`User ${assigneeId} not found in organization`);
        }

        const assigneeEmail = membership.publicUserData.identifier;
        const assigneeName =
          membership.publicUserData.firstName && membership.publicUserData.lastName
            ? `${membership.publicUserData.firstName} ${membership.publicUserData.lastName}`
            : membership.publicUserData.identifier;

        return sendTaskAssignmentEmail({
          assigneeEmail,
          assigneeName,
          assignerName: params.assignerName,
          task: params.task,
          organizationName: params.organizationName,
          objectName: params.objectName,
          projectId: params.projectId,
          objectId: params.objectId,
        });
      })
    );

    // Format results
    const results = emailResults.map((result, index) => ({
      assigneeId: params.assigneeIds[index],
      status: result.status,
      ...(result.status === 'fulfilled'
        ? { success: result.value.success }
        : { error: result.reason?.message || 'Unknown error' }
      ),
    }));

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.length - successCount;

    return {
      success: true,
      message: `Sent ${successCount} email(s), ${failureCount} failed`,
      results,
    };

  } catch (error) {
    console.error('Error sending task notification emails:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
