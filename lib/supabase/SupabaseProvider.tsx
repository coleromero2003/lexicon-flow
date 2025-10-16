"use client";

import { createContext, useContext, useEffect, useState } from "react";
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
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (!session) return;
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

    setSupabase(client);
    setIsLoaded(true);
  }, [session, organization]);

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
