import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";

const isPublicRoute = createRouteMatcher([
  '/.well-known/oauth-authorization-server(.*)',
  '/.well-known/oauth-protected-resource(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return // Allow public access to .well-known endpoints
  await auth.protect() // Protect all other routes

  // Get auth information
  const { userId, orgId } = await auth();

  // Set Sentry user context
  if (userId) {
    Sentry.setUser({ id: userId });

    // Set organization context if available
    if (orgId) {
      Sentry.setTag("organization.id", orgId);
    }
  } else {
    Sentry.setUser(null);
  }

  // Add breadcrumb for request tracking
  Sentry.addBreadcrumb({
    category: "request",
    message: `${req.method} ${req.nextUrl.pathname}`,
    level: "info",
    data: {
      url: req.nextUrl.pathname,
      method: req.method,
    },
  });
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
