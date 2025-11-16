import { connection } from "next/server";
import { Suspense } from "react";
import OrganizationClientPage from "./organization-client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Server Component wrapper for Client Component page
// Ensures dynamic rendering for organization page
export default async function OrganizationPage() {
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
      <OrganizationClientPage />
    </Suspense>
  );
}
