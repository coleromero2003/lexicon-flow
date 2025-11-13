import { Button } from "@/components/ui/button";

interface PageErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * Standard error state for dashboard pages
 * Provides consistent error UI with optional retry action
 */
export function PageErrorState({
  title = "Error loading data",
  message,
  onRetry,
  retryLabel = "Try again"
}: PageErrorStateProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {title}
          </h2>
          <p className="text-gray-600">{message}</p>
          {onRetry && (
            <Button variant="outline" className="mt-4" onClick={onRetry}>
              {retryLabel}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
