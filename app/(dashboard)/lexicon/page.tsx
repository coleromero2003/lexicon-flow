import { connection } from "next/server";
import { Suspense } from "react";
import LexiconClientPage from "./lexicon-client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Server Component wrapper for Client Component page
// Ensures dynamic rendering for lexicon list page
export default async function LexiconPage() {
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
      <LexiconClientPage />
    </Suspense>
  );
}
