"use client";

import * as Sentry from "@sentry/nextjs";
import { Component, ErrorInfo, ReactNode } from "react";

interface PageErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface PageErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class PageErrorBoundary extends Component<
  PageErrorBoundaryProps,
  PageErrorBoundaryState
> {
  state: PageErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): PageErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.withScope((scope) => {
      scope.setTag("error_boundary", "PageErrorBoundary");
      scope.setContext("react", {
        componentStack: errorInfo.componentStack,
      });
      scope.setExtra("errorBoundaryProps", {
        hasFallback: Boolean(this.props.fallback),
      });
      scope.setFingerprint(["page-error-boundary", error.name]);
      Sentry.captureException(error);
    });

    if (process.env.NODE_ENV !== "production") {
      console.error("PageErrorBoundary caught an error", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md rounded-lg border bg-background p-6 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We couldn&apos;t render this page. Please refresh and try again.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
