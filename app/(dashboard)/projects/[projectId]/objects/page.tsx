import { connection } from "next/server";
import { Suspense } from "react";
import ObjectsClientPage from "./page-client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Server Component wrapper for objects list page
// Required for Cache Components mode with Client Component pages
export default async function ObjectsPage() {
  await connection();
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner />
        </div>
      }
    >
      <ObjectsClientPage />
    </Suspense>
  );
}
