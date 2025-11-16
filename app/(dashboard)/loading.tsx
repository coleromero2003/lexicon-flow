import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Loading component for all dashboard routes
// This wraps all dashboard pages in a Suspense boundary
// Required for Cache Components mode to handle client components properly
export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <LoadingSpinner />
    </div>
  );
}
