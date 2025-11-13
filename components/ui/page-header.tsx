import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Standard page header with title, description, and optional actions
 * Provides consistent header UI across all dashboard pages
 */
export function PageHeader({
  title,
  description,
  actions,
  className
}: PageHeaderProps) {
  return (
    <div className={cn(
      "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8",
      className
    )}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl mb-2">
          {title}
        </h1>
        {description && (
          <p className="text-gray-600">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
