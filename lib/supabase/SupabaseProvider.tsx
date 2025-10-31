"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useOrganization, useSession } from "@clerk/nextjs";

type SupabaseContext = {
  supabase: SupabaseClient | null;
  isLoaded: boolean;
};
const Context = createContext<SupabaseContext>({
  supabase: null,
  isLoaded: false,
});

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = useSession();
  const { organization } = useOrganization();
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Track the session user ID to detect actual session changes
  const sessionUserId = session?.user?.id;
  const orgId = organization?.id;

  // Use useMemo to create a stable Supabase client
  const supabase = useMemo(() => {
    if (!session) return null;

    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        accessToken: async () => {
          const token = await session?.getToken({
            template: "supabase",
          });
          return token;
        },
      }
    );

    return client;
    // Only recreate when the actual user ID or org ID changes, not on every session object reference change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUserId, orgId]);

  // Set isLoaded when we have a supabase client
  useEffect(() => {
    if (supabase) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [supabase]);

  return (
    <Context.Provider value={{ supabase, isLoaded }}>
      {/* {!isLoaded ? <div> Loading...</div> : children} */}
      {children}
    </Context.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error("useSupabase needs to be inside the provider");
  }

  return context;
};
