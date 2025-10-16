// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://f8557317d4f9b889d094806915218d4c@o4510201646153728.ingest.us.sentry.io/4510201646350336",

  // Environment configuration
  environment: process.env.NODE_ENV || "development",

  // Set sample rate based on environment
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Profile 10% of transactions in production, 100% in development
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // This is useful for SCADA applications where user context is important
  sendDefaultPii: true,

  // Ignore common non-critical errors
  ignoreErrors: [
    // Browser extensions
    "top.GLOBALS",
    "chrome-extension://",
    "moz-extension://",
    // Network errors
    "NetworkError",
    "Failed to fetch",
    // Random plugins/extensions
    "atomicFindClose",
    // Facebook borked
    "fb_xd_fragment",
  ],

  // Filter out sensitive data
  beforeSend(event) {
    // Remove IP address
    if (event.request) {
      delete event.request.env;
    }

    // Filter sensitive headers
    if (event.request?.headers) {
      delete event.request.headers.Authorization;
      delete event.request.headers.Cookie;
    }

    return event;
  },

  // Configure integrations
  integrations: [
    Sentry.prismaIntegration(),
    Sentry.postgresIntegration(),
  ],
});
