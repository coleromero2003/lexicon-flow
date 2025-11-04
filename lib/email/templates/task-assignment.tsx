import * as React from 'react';

interface TaskAssignmentEmailProps {
  assigneeName: string;
  assignerName: string;
  taskTitle: string;
  taskDetails?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  taskUrl: string;
  organizationName: string;
  objectName?: string;
}

export const TaskAssignmentEmail: React.FC<TaskAssignmentEmailProps> = ({
  assigneeName,
  assignerName,
  taskTitle,
  taskDetails,
  dueDate,
  priority,
  taskUrl,
  organizationName,
  objectName,
}) => {
  const priorityColors = {
    low: '#22c55e',
    medium: '#eab308',
    high: '#f97316',
    urgent: '#ef4444',
  };

  const priorityColor = priorityColors[priority];

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.6', color: '#333' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
          <h1 style={{ color: '#2563eb', marginBottom: '20px' }}>
            New Task Assignment
          </h1>

          <p>Hi {assigneeName},</p>

          <p>
            <strong>{assignerName}</strong> has assigned you a new task in{' '}
            <strong>{organizationName}</strong>
            {objectName && ` for object "${objectName}"`}.
          </p>

          <div style={{
            backgroundColor: '#f3f4f6',
            padding: '20px',
            borderRadius: '8px',
            marginTop: '20px',
            marginBottom: '20px',
          }}>
            <h2 style={{ marginTop: '0', marginBottom: '10px' }}>
              {taskTitle}
            </h2>

            <div style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '4px',
              backgroundColor: priorityColor,
              color: '#fff',
              fontSize: '12px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}>
              {priority} Priority
            </div>

            {taskDetails && (
              <p style={{ marginTop: '10px', whiteSpace: 'pre-wrap' }}>
                {taskDetails}
              </p>
            )}

            {dueDate && (
              <p style={{ marginTop: '10px' }}>
                <strong>Due Date:</strong> {new Date(dueDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
          </div>

          <a
            href={taskUrl}
            style={{
              display: 'inline-block',
              backgroundColor: '#2563eb',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 'bold',
              marginTop: '10px',
            }}
          >
            View Task
          </a>

          <p style={{ marginTop: '30px', color: '#6b7280', fontSize: '14px' }}>
            This email was sent by Lexicon Flow. If you believe this was sent in error, please contact your organization administrator.
          </p>
        </div>
      </body>
    </html>
  );
};

export default TaskAssignmentEmail;
