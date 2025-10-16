/**
 * Sentry utilities for Lexicon Flow
 *
 * This module provides helper functions for integrating Sentry monitoring
 * with Clerk authentication and other app-specific features.
 */

import * as Sentry from "@sentry/nextjs";
import type { User } from "@clerk/nextjs/server";

/**
 * Set Sentry user context from Clerk user data
 * Call this after successful authentication to track user information in Sentry
 */
export function setSentryUser(user: User | null) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress,
      username: user.username ?? undefined,
    });
  } else {
    // Clear user context on logout
    Sentry.setUser(null);
  }
}

/**
 * Set organization context in Sentry
 * Useful for tracking errors within specific organizations
 */
export function setSentryOrganization(orgId: string | null, orgName?: string) {
  if (orgId) {
    Sentry.setTag("organization.id", orgId);
    if (orgName) {
      Sentry.setTag("organization.name", orgName);
    }
  } else {
    Sentry.setTag("organization.id", undefined);
    Sentry.setTag("organization.name", undefined);
  }
}

/**
 * Track a custom event in Sentry
 */
export function trackEvent(name: string, data?: Record<string, unknown>) {
  Sentry.captureEvent({
    message: name,
    level: "info",
    extra: data,
  });
}

/**
 * Track a SCADA-specific operation
 * Useful for monitoring critical SCADA operations
 */
export function trackScadaOperation(
  operation: string,
  projectId: string,
  success: boolean,
  metadata?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    category: "scada",
    message: `${operation} - ${success ? "success" : "failed"}`,
    level: success ? "info" : "error",
    data: {
      projectId,
      operation,
      ...metadata,
    },
  });

  if (!success) {
    Sentry.captureMessage(`SCADA operation failed: ${operation}`, {
      level: "warning",
      tags: {
        operation,
        projectId,
      },
      extra: metadata,
    });
  }
}

/**
 * Wrap a function with Sentry error tracking
 * Useful for async operations where you want automatic error capture
 */
export function withSentryTracking<T extends (...args: never[]) => unknown>(
  fn: T,
  operationName: string
): T {
  return ((...args: Parameters<T>) => {
    return Sentry.startSpan(
      {
        name: operationName,
        op: "function",
      },
      () => {
        try {
          return fn(...args);
        } catch (error) {
          Sentry.captureException(error, {
            tags: {
              operation: operationName,
            },
          });
          throw error;
        }
      }
    );
  }) as T;
}

/**
 * Track database query performance
 */
export function trackDatabaseQuery(
  query: string,
  durationMs: number,
  error?: Error
) {
  Sentry.addBreadcrumb({
    category: "database",
    message: query,
    level: error ? "error" : "info",
    data: {
      duration: durationMs,
      error: error?.message,
    },
  });

  if (durationMs > 1000) {
    // Track slow queries
    Sentry.captureMessage(`Slow database query: ${query}`, {
      level: "warning",
      tags: {
        type: "performance",
        category: "database",
      },
      extra: {
        query,
        duration: durationMs,
      },
    });
  }

  if (error) {
    Sentry.captureException(error, {
      tags: {
        type: "database",
      },
      extra: {
        query,
      },
    });
  }
}
