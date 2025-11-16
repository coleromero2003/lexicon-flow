import { connection } from "next/server";
import { Suspense } from "react";
import PartsClientPage from "./page-client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Server Component wrapper for parts page
// Required for Cache Components mode with Client Component pages
export default async function PartsPage() {
  await connection();
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner />
        </div>
      }
    >
      <PartsClientPage />
    </Suspense>
  );
}
