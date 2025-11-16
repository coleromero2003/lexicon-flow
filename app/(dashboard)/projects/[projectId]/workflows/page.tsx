import { connection } from "next/server";
import { Suspense } from "react";
import WorkflowsClientPage from "./page-client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Server Component wrapper for workflows page
// Required for Cache Components mode with Client Component pages
export default async function WorkflowsPage() {
  await connection();
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner />
        </div>
      }
    >
      <WorkflowsClientPage />
    </Suspense>
  );
}
