// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://f8557317d4f9b889d094806915218d4c@o4510201646153728.ingest.us.sentry.io/4510201646350336",

  // Environment configuration
  environment: process.env.NODE_ENV || "development",

  // Set sample rate based on environment
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  sendDefaultPii: true,

  // Ignore common non-critical errors
  ignoreErrors: [
    "top.GLOBALS",
    "chrome-extension://",
    "moz-extension://",
    "NetworkError",
    "Failed to fetch",
  ],

  // Filter out sensitive data
  beforeSend(event) {
    // Filter sensitive headers
    if (event.request?.headers) {
      delete event.request.headers.Authorization;
      delete event.request.headers.Cookie;
    }

    return event;
  },
});
