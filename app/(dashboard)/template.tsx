import { connection } from "next/server";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Template component for all dashboard routes
// This wraps all dashboard pages in a Suspense boundary and opts into dynamic rendering
// Required for Cache Components mode with Client Component pages
export default async function DashboardTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  // Opt into dynamic rendering for all dashboard routes
  // Dashboard pages are client components with user-specific data
  await connection();

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
