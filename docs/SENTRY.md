# Sentry Monitoring Setup

This document explains the Sentry error monitoring and performance tracking implementation in Lexicon Flow.

## Overview

Sentry is fully integrated to provide:
- **Error tracking** for both client and server-side errors
- **Performance monitoring** with transaction tracing
- **User context tracking** integrated with Clerk authentication
- **Session replay** for debugging user issues
- **User feedback** collection
- **Release tracking** for deployment monitoring

## Configuration Files

### Client-Side Configuration
**File:** [instrumentation-client.ts](../instrumentation-client.ts)

Configures Sentry for browser environments with:
- Session replay (masked by default for privacy)
- Browser tracing for performance monitoring
- User feedback widget
- Environment-based sampling rates (100% dev, 10% prod)
- Sensitive data filtering

### Server-Side Configuration
**File:** [sentry.server.config.ts](../sentry.server.config.ts)

Configures Sentry for Node.js server environments with:
- Prisma and Postgres integrations
- Performance profiling
- Environment-based sampling
- Request filtering for sensitive data

### Edge Runtime Configuration
**File:** [sentry.edge.config.ts](../sentry.edge.config.ts)

Configures Sentry for Edge Runtime (middleware, edge routes) with:
- Lightweight configuration for edge environments
- Performance tracing
- Request filtering

### Instrumentation
**File:** [instrumentation.ts](../instrumentation.ts)

Initializes Sentry based on runtime environment (nodejs/edge) and captures Next.js request errors.

### Middleware Integration
**File:** [middleware.ts](../middleware.ts)

Integrates Sentry with Clerk middleware to:
- Automatically set user context from Clerk authentication
- Tag errors with organization IDs
- Track request breadcrumbs

## Utility Functions

**File:** [lib/sentry.ts](../lib/sentry.ts)

Provides helper functions for common Sentry operations:

### User Context
```typescript
import { setSentryUser, setSentryOrganization } from '@/lib/sentry';

// Set user context
setSentryUser(clerkUser);

// Set organization context
setSentryOrganization(orgId, orgName);
```

### Event Tracking
```typescript
import { trackEvent, trackScadaOperation } from '@/lib/sentry';

// Track custom events
trackEvent('user_action', { action: 'create_project' });

// Track SCADA-specific operations
trackScadaOperation('object_update', projectId, true, { objectId });
```

### Performance Tracking
```typescript
import { withSentryTracking, trackDatabaseQuery } from '@/lib/sentry';

// Wrap functions with automatic error tracking
const trackedFunction = withSentryTracking(
  myFunction,
  'operation_name'
);

// Track database query performance
const startTime = Date.now();
// ... execute query ...
trackDatabaseQuery(query, Date.now() - startTime, error);
```

## Environment Variables

Add to your `.env` file (optional):
```bash
# Enable Sentry in development (disabled by default)
SENTRY_ENABLED=true

# Sentry build configuration is in .env.sentry-build-plugin
```

## Build Configuration

**File:** [next.config.ts](../next.config.ts)

The Next.js config is wrapped with `withSentryConfig` which:
- Uploads source maps for better stack traces
- Configures tunnel route (`/monitoring`) to bypass ad blockers
- Enables automatic Vercel Cron monitoring
- Tree-shakes debug statements in production

## Error Boundary

**File:** [app/global-error.tsx](../app/global-error.tsx)

Provides a global error boundary that:
- Captures unhandled errors
- Shows user-friendly error UI
- Includes error digest for support
- Offers retry and home navigation options

## Features

### 1. Automatic Error Tracking
All unhandled errors are automatically captured and sent to Sentry with full context.

### 2. User Context
Every error includes:
- User ID from Clerk
- Organization ID
- Request path and method
- Browser/OS information

### 3. Performance Monitoring
Tracks:
- Page load times
- API response times
- Database query performance
- Custom operation timing

### 4. Session Replay
Records user sessions (with privacy controls):
- Text is masked by default
- Media is blocked
- 10% sampling in production
- 100% on error

### 5. Breadcrumbs
Tracks user activity before errors:
- Navigation events
- API calls
- User interactions
- Custom events

### 6. User Feedback
Users can submit feedback directly in the app when errors occur.

## Best Practices

### 1. Add Context to Errors
```typescript
import * as Sentry from '@sentry/nextjs';

try {
  // risky operation
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      section: 'workflows',
      operation: 'create',
    },
    extra: {
      workflowId,
      stepCount,
    },
  });
  throw error;
}
```

### 2. Track Custom Events
```typescript
// Track business-critical events
Sentry.captureMessage('Project created', {
  level: 'info',
  tags: {
    projectId,
    organizationId,
  },
});
```

### 3. Add Breadcrumbs
```typescript
// Add context before operations
Sentry.addBreadcrumb({
  category: 'workflow',
  message: 'Starting workflow execution',
  level: 'info',
  data: { workflowId, stepCount },
});
```

### 4. Set User Context in Components
```typescript
'use client';

import { useUser } from '@clerk/nextjs';
import { setSentryUser } from '@/lib/sentry';
import { useEffect } from 'react';

export function UserProvider({ children }) {
  const { user } = useUser();

  useEffect(() => {
    setSentryUser(user);
  }, [user]);

  return <>{children}</>;
}
```

## Ignored Errors

The following errors are automatically filtered to reduce noise:
- Browser extension errors
- Network connectivity errors
- ResizeObserver errors
- Ad blocker interference

## Data Privacy

Sensitive data is automatically filtered:
- Authorization headers
- Cookies
- Passwords in URLs
- API keys and tokens

## Sampling Rates

### Production
- **Error tracking:** 100% (all errors captured)
- **Performance tracing:** 10% (sample of transactions)
- **Session replay:** 10% (sample of sessions)
- **Replay on error:** 100% (always replay when error occurs)

### Development
- **Error tracking:** 100%
- **Performance tracing:** 100%
- **Session replay:** 100%
- Only sent if `SENTRY_ENABLED=true` in `.env`

## Accessing Sentry Dashboard

Visit your Sentry dashboard at:
https://lexicon-flow.sentry.io/issues/?project=4510201646350336

## Troubleshooting

### Errors not appearing in Sentry
1. Check that DSN is configured correctly
2. Verify network isn't blocking Sentry requests
3. Check browser console for Sentry errors
4. In development, set `SENTRY_ENABLED=true`

### Source maps not working
1. Ensure `.env.sentry-build-plugin` has auth token
2. Check build logs for upload errors
3. Verify organization and project names in `next.config.ts`

### Performance issues
1. Reduce sampling rates in production
2. Disable session replay if not needed
3. Filter out noisy breadcrumbs

## Related Files

- [instrumentation-client.ts](../instrumentation-client.ts) - Client config
- [sentry.server.config.ts](../sentry.server.config.ts) - Server config
- [sentry.edge.config.ts](../sentry.edge.config.ts) - Edge config
- [lib/sentry.ts](../lib/sentry.ts) - Utility functions
- [middleware.ts](../middleware.ts) - User context tracking
- [app/global-error.tsx](../app/global-error.tsx) - Error boundary
- [next.config.ts](../next.config.ts) - Build configuration

## Support

For Sentry-specific issues, see [Sentry Next.js documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/).
