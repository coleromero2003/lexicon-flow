"use client";

import { Suspense } from "react";
import SupabaseProvider from "@/lib/supabase/SupabaseProvider";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Wrapper for providers that access dynamic data (cookies, session)
// Required for Cache Components mode
export function ProvidersWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner />
        </div>
      }
    >
      <SupabaseProvider>{children}</SupabaseProvider>
    </Suspense>
  );
}
