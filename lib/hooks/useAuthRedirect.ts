import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

/**
 * Redirects unauthenticated users to the sign-in page
 * @param redirectTo - Optional path to redirect to (defaults to /sign-in)
 * @returns Object containing isSignedIn and userLoaded status
 */
export function useAuthRedirect(redirectTo: string = "/sign-in") {
  const router = useRouter();
  const { isSignedIn, isLoaded: userLoaded } = useUser();

  useEffect(() => {
    if (userLoaded && !isSignedIn) {
      router.push(redirectTo);
    }
  }, [isSignedIn, userLoaded, router, redirectTo]);

  return { isSignedIn, userLoaded };
}
