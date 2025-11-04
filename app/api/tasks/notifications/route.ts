import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sendTaskAssignmentEmail } from '@/lib/email/email-service';
import { createClient } from '@/lib/supabase/server';
import { taskService } from '@/lib/services';

/**
 * API Route: POST /api/tasks/notifications
 *
 * Sends task assignment notification emails to assignees
 *
 * Body params:
 * - taskId: number - The task ID
 * - assigneeIds: string[] - Array of user IDs to notify
 * - assignerName: string - Name of person who assigned the task
 * - organizationName: string - Organization name
 * - objectName?: string - Optional object name if task is linked to object
 * - projectId?: number - Optional project ID for task URL
 * - objectId?: number - Optional object ID for task URL
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      taskId,
      assigneeIds,
      assignerName,
      organizationName,
      objectName,
      projectId,
      objectId,
    } = body;

    // Validate required fields
    if (!taskId || !assigneeIds || !Array.isArray(assigneeIds) || assigneeIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: taskId, assigneeIds' },
        { status: 400 }
      );
    }

    // Get task details from database
    const supabase = await createClient();
    const task = await taskService.getTaskById(supabase, taskId);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Verify task belongs to the same organization
    if (task.org_id !== orgId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Fetch assignee details from Clerk
    // Note: In a real implementation, you'd fetch user details from Clerk
    // For now, we'll use the organization members list
    const { clerkClient } = await import('@clerk/nextjs/server');
    const client = await clerkClient();

    const organizationMemberships = await client.organizations.getOrganizationMembershipList({
      organizationId: orgId,
    });

    // Send emails to each assignee
    const emailResults = await Promise.allSettled(
      assigneeIds.map(async (assigneeId) => {
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
          assignerName,
          task,
          organizationName,
          objectName,
          projectId,
          objectId,
        });
      })
    );

    // Format results
    const results = emailResults.map((result, index) => ({
      assigneeId: assigneeIds[index],
      status: result.status,
      ...(result.status === 'fulfilled'
        ? { success: result.value.success }
        : { error: result.reason?.message || 'Unknown error' }
      ),
    }));

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.length - successCount;

    return NextResponse.json({
      success: true,
      message: `Sent ${successCount} email(s), ${failureCount} failed`,
      results,
    });

  } catch (error) {
    console.error('Error sending task notification emails:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
