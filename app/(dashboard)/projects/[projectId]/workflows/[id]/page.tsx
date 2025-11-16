import { connection } from "next/server";
import { Suspense } from "react";
import WorkflowDetailClientPage from "./page-client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Server Component wrapper for workflow detail page
// Required for Cache Components mode with Client Component pages
export default async function WorkflowDetailPage() {
  await connection();
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner />
        </div>
      }
    >
      <WorkflowDetailClientPage />
    </Suspense>
  );
}
