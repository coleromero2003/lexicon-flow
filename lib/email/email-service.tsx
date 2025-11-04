import { resend } from './resend-client';
import { TaskAssignmentEmail } from './templates/task-assignment';
import { UserAddedEmail } from './templates/user-added';
import { Task } from '../supabase/models';
import { render } from '@react-email/render';

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface SendTaskAssignmentEmailParams {
  assigneeEmail: string;
  assigneeName: string;
  assignerName: string;
  task: Task;
  organizationName: string;
  objectName?: string;
  projectId?: number;
  objectId?: number;
}

interface SendUserAddedEmailParams {
  userEmail: string;
  userName: string;
  organizationName: string;
  inviterName: string;
}

/**
 * Send task assignment notification email
 */
export async function sendTaskAssignmentEmail({
  assigneeEmail,
  assigneeName,
  assignerName,
  task,
  organizationName,
  objectName,
  projectId,
  objectId,
}: SendTaskAssignmentEmailParams) {
  try {
    // Build task URL based on whether it's linked to an object or standalone
    let taskUrl = `${APP_URL}/tasks`;
    if (projectId && objectId) {
      taskUrl = `${APP_URL}/projects/${projectId}/objects/${objectId}#task-${task.id}`;
    } else {
      taskUrl = `${APP_URL}/tasks#task-${task.id}`;
    }

    // Render the email template
    const emailHtml = await render(
      <TaskAssignmentEmail
        assigneeName={assigneeName}
        assignerName={assignerName}
        taskTitle={task.title}
        taskDetails={task.details || undefined}
        dueDate={task.due_date || undefined}
        priority={task.priority}
        taskUrl={taskUrl}
        organizationName={organizationName}
        objectName={objectName}
      />
    );

    // Send the email
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: assigneeEmail,
      subject: `New Task Assignment: ${task.title}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send task assignment email:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in sendTaskAssignmentEmail:', error);
    return { success: false, error };
  }
}

/**
 * Send welcome email when user is added to organization
 */
export async function sendUserAddedEmail({
  userEmail,
  userName,
  organizationName,
  inviterName,
}: SendUserAddedEmailParams) {
  try {
    const dashboardUrl = `${APP_URL}/dashboard`;

    // Render the email template
    const emailHtml = await render(
      <UserAddedEmail
        userName={userName}
        organizationName={organizationName}
        inviterName={inviterName}
        dashboardUrl={dashboardUrl}
      />
    );

    // Send the email
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: `Welcome to ${organizationName} on Lexicon Flow`,
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send user added email:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in sendUserAddedEmail:', error);
    return { success: false, error };
  }
}

/**
 * Send task assignment emails to multiple assignees
 * Returns array of results for each email sent
 */
export async function sendTaskAssignmentEmails(
  params: SendTaskAssignmentEmailParams[]
) {
  const results = await Promise.allSettled(
    params.map((param) => sendTaskAssignmentEmail(param))
  );

  return results.map((result, index) => ({
    email: params[index].assigneeEmail,
    status: result.status,
    result: result.status === 'fulfilled' ? result.value : result.reason,
  }));
}
