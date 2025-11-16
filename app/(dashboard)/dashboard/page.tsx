import { connection } from "next/server";
import { Suspense } from "react";
import DashboardClientPage from "./dashboard-client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Server Component wrapper for Client Component page
// Ensures dynamic rendering for dashboard page
export default async function DashboardPage() {
  // Opt into dynamic rendering
  await connection();

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner />
        </div>
      }
    >
      <DashboardClientPage />
    </Suspense>
  );
}
