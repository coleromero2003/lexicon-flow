import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Standard page container with consistent layout and styling
 * Used across all dashboard pages for uniform appearance
 */
export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className={cn("container mx-auto px-4 py-6 sm:py-8", className)}>
        {children}
      </main>
    </div>
  );
}
