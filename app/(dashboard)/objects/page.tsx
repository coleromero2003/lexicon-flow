import { connection } from "next/server";
import { Suspense } from "react";
import ObjectsClientPage from "./objects-client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Server Component wrapper for Client Component page
// Ensures dynamic rendering for objects page
export default async function ObjectsPage() {
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
      <ObjectsClientPage />
    </Suspense>
  );
}
