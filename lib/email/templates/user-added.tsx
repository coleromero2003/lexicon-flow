import * as React from 'react';

interface UserAddedEmailProps {
  userName: string;
  organizationName: string;
  inviterName: string;
  dashboardUrl: string;
}

export const UserAddedEmail: React.FC<UserAddedEmailProps> = ({
  userName,
  organizationName,
  inviterName,
  dashboardUrl,
}) => {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.6', color: '#333' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
          <h1 style={{ color: '#2563eb', marginBottom: '20px' }}>
            Welcome to {organizationName}!
          </h1>

          <p>Hi {userName},</p>

          <p>
            Great news! <strong>{inviterName}</strong> has added you to the{' '}
            <strong>{organizationName}</strong> organization on Lexicon Flow.
          </p>

          <div style={{
            backgroundColor: '#f3f4f6',
            padding: '20px',
            borderRadius: '8px',
            marginTop: '20px',
            marginBottom: '20px',
          }}>
            <h2 style={{ marginTop: '0', marginBottom: '10px' }}>
              What is Lexicon Flow?
            </h2>

            <p style={{ marginTop: '10px' }}>
              Lexicon Flow is a comprehensive SCADA project management application that helps teams collaborate on industrial control systems, manage workflows, and track project progress.
            </p>

            <p style={{ marginTop: '10px' }}>
              As a member of <strong>{organizationName}</strong>, you can now:
            </p>

            <ul style={{ marginTop: '10px' }}>
              <li>Access organization projects and SCADA objects</li>
              <li>Collaborate on workflows and tasks</li>
              <li>Manage files and documentation</li>
              <li>Track project progress in real-time</li>
            </ul>
          </div>

          <a
            href={dashboardUrl}
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
            Go to Dashboard
          </a>

          <p style={{ marginTop: '30px', color: '#6b7280', fontSize: '14px' }}>
            If you have any questions, feel free to reach out to {inviterName} or your organization administrator.
          </p>

          <p style={{ marginTop: '10px', color: '#6b7280', fontSize: '14px' }}>
            This email was sent by Lexicon Flow.
          </p>
        </div>
      </body>
    </html>
  );
};

export default UserAddedEmail;
