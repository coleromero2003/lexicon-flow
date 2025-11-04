# Email Notifications with Resend

This document explains how email notifications work in Lexicon Flow and how to integrate them into your UI components.

## Overview

Lexicon Flow uses [Resend](https://resend.com) to send email notifications for:
1. **Task Assignments** - When users are assigned to tasks
2. **Organization Invitations** - When users are added to an organization

## Setup

### 1. Environment Variables

Add the following to your `.env` file:

```bash
# Resend API Key (get from https://resend.com/api-keys)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Email address to send from (must be verified in Resend)
RESEND_FROM_EMAIL=notifications@yourdomain.com

# Application URL (for links in emails)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 2. Clerk Webhook Configuration

To enable organization invitation emails, configure a webhook in your Clerk dashboard:

1. Go to **Webhooks** in Clerk Dashboard
2. Create a new webhook endpoint: `https://yourdomain.com/api/webhooks/clerk`
3. Subscribe to the event: `organizationMembership.created`
4. Copy the webhook secret and add to `.env`:

```bash
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

## Email Templates

Email templates are React components located in `lib/email/templates/`:

- `task-assignment.tsx` - Task assignment notification
- `user-added.tsx` - Welcome email for new organization members

You can customize these templates to match your branding.

## Integrating Task Assignment Notifications

### Basic Usage

Use the helper functions to send notifications when tasks are created or updated:

```tsx
import { useUser, useOrganization } from '@clerk/nextjs';
import { notifyTaskCreated, getNotificationContext } from '@/lib/email/task-notification-helpers';

function MyComponent() {
  const { user } = useUser();
  const { organization } = useOrganization();

  const handleCreateTask = async () => {
    // Create the task
    const newTask = await createTask({
      title: 'New Task',
      assignee: ['user_123', 'user_456'],
      // ... other fields
    });

    // Send notifications to assignees
    const context = getNotificationContext(user, organization);
    await notifyTaskCreated(newTask, context);
  };
}
```

### Example: Standalone Tasks Page

```tsx
// app/(dashboard)/tasks/page.tsx

import { notifyTaskCreated, getNotificationContext } from '@/lib/email/task-notification-helpers';
import { useUser, useOrganization } from '@clerk/nextjs';

export default function TasksPage() {
  const { user } = useUser();
  const { organization } = useOrganization();
  const tasksHook = useTasks({ fetchAll: true, standaloneOnly: true });

  const handleAddTask = async (taskData: {
    title: string;
    details?: string;
    assignee?: string[];
    dueDate?: Date;
    priority?: ObjectPriority;
  }) => {
    try {
      // Create the task
      const newTask = await tasksHook.createTask({
        title: taskData.title,
        details: taskData.details || null,
        assignee: taskData.assignee || [],
        due_date: taskData.dueDate?.toISOString().split('T')[0] || null,
        priority: taskData.priority || 'medium',
        is_done: false,
        sort_order: 0,
        object_id: null,
        org_id: organization!.id,
      });

      // Send email notifications
      const context = getNotificationContext(user, organization);
      await notifyTaskCreated(newTask, context);

      toast.success('Task created and notifications sent!');
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task');
    }
  };

  // ... rest of component
}
```

### Example: Object Subtasks

```tsx
// app/(dashboard)/projects/[projectId]/objects/[objectId]/page.tsx

import { notifyTaskCreated, getNotificationContext } from '@/lib/email/task-notification-helpers';
import { useUser, useOrganization } from '@clerk/nextjs';

export default function ObjectDetailPage({ params }: { params: { projectId: string; objectId: string } }) {
  const { user } = useUser();
  const { organization } = useOrganization();
  const projectId = parseInt(params.projectId);
  const objectId = parseInt(params.objectId);

  const handleAddSubtask = async (
    title: string,
    details?: string,
    assignee?: string[],
    dueDate?: Date,
    priority?: ObjectPriority
  ) => {
    try {
      // Create the subtask
      const newTask = await subtasksHook.createSubtask(
        title,
        details,
        assignee,
        dueDate,
        priority
      );

      // Send email notifications with object context
      const context = getNotificationContext(user, organization, {
        objectName: object?.name,
        projectId,
        objectId,
      });
      await notifyTaskCreated(newTask, context);

      toast.success('Subtask created and notifications sent!');
    } catch (error) {
      console.error('Failed to create subtask:', error);
      toast.error('Failed to create subtask');
    }
  };

  // ... rest of component
}
```

### Example: Updating Task Assignees

```tsx
import { notifyTaskUpdated, getNotificationContext } from '@/lib/email/task-notification-helpers';

const handleEditTask = async (taskId: number, updates: Partial<Task>) => {
  try {
    // Get the old task before updating
    const oldTask = tasks.find(t => t.id === taskId);
    if (!oldTask) return;

    // Update the task
    const updatedTask = await updateTask(taskId, updates);

    // Send notifications to newly added assignees only
    const context = getNotificationContext(user, organization);
    await notifyTaskUpdated(oldTask, updatedTask, context);

    toast.success('Task updated and notifications sent!');
  } catch (error) {
    console.error('Failed to update task:', error);
    toast.error('Failed to update task');
  }
};
```

## API Routes

### Task Notifications API

**Endpoint:** `POST /api/tasks/notifications`

Sends task assignment emails to specified users.

**Request Body:**
```json
{
  "taskId": 123,
  "assigneeIds": ["user_abc", "user_xyz"],
  "assignerName": "John Doe",
  "organizationName": "ACME Corp",
  "objectName": "Motor Controller #5",
  "projectId": 42,
  "objectId": 108
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sent 2 email(s), 0 failed",
  "results": [
    {
      "assigneeId": "user_abc",
      "status": "fulfilled",
      "success": true
    },
    {
      "assigneeId": "user_xyz",
      "status": "fulfilled",
      "success": true
    }
  ]
}
```

## Email Content

### Task Assignment Email

**Subject:** `New Task Assignment: {task.title}`

**Content includes:**
- Task title and details
- Priority badge
- Due date (if set)
- Direct link to the task
- Information about who assigned the task

### User Added Email

**Subject:** `Welcome to {organization.name} on Lexicon Flow`

**Content includes:**
- Welcome message
- Information about who added them
- Overview of Lexicon Flow features
- Link to dashboard

## Error Handling

Email sending failures are logged but don't block task creation/updates. The notification functions return results that you can handle:

```tsx
const result = await notifyTaskCreated(newTask, context);

if (!result.success) {
  console.error('Email notification failed:', result.error);
  // Task was still created successfully, just notify the user
  toast.warning('Task created, but email notifications failed to send');
} else {
  toast.success('Task created and notifications sent!');
}
```

## Testing

### Testing in Development

By default, Resend requires verified domains. For testing:

1. Use the default `onboarding@resend.dev` sender (works in development)
2. Or verify a domain in Resend dashboard

### Testing Webhooks Locally

Use the Clerk CLI to forward webhooks to localhost:

```bash
clerk webhooks listen --url http://localhost:3000/api/webhooks/clerk
```

## Best Practices

1. **Always notify on task creation** - Users should know when they're assigned new tasks
2. **Only notify new assignees on updates** - Don't spam users who were already assigned
3. **Handle errors gracefully** - Don't block task operations if emails fail
4. **Test email content** - Preview emails in Resend dashboard before going live
5. **Monitor email delivery** - Check Resend dashboard for delivery status

## Troubleshooting

### Emails not sending

1. Check `RESEND_API_KEY` is set correctly
2. Verify sender domain in Resend dashboard
3. Check browser console and server logs for errors
4. Verify Clerk organization members have email addresses

### Webhook not triggering

1. Verify `CLERK_WEBHOOK_SECRET` is set
2. Check webhook is subscribed to correct events in Clerk dashboard
3. Test webhook with Clerk's webhook testing tool
4. Check server logs for webhook errors

### Email links broken

1. Verify `NEXT_PUBLIC_APP_URL` matches your actual domain
2. Ensure task IDs are being passed correctly to notification functions

## Future Enhancements

Potential improvements to the email notification system:

- [ ] User preferences for email notifications (opt-out)
- [ ] Digest emails (daily summary of tasks)
- [ ] Task completion notifications
- [ ] Task reminder emails (before due date)
- [ ] Email templates for other events (project invitations, etc.)
- [ ] Track notification history in database
