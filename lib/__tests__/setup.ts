import { beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

// Setup global test environment
beforeAll(() => {
  // You can add global setup here if needed
  console.log("Setting up test environment...");

  if (typeof window !== "undefined" && !("ResizeObserver" in window)) {
    class TestResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    Object.defineProperty(window, "ResizeObserver", {
      configurable: true,
      writable: true,
      value: TestResizeObserver,
    });

    Object.defineProperty(globalThis, "ResizeObserver", {
      configurable: true,
      writable: true,
      value: TestResizeObserver,
    });
  }

  if (
    typeof window !== "undefined" &&
    !window.HTMLElement.prototype.scrollIntoView
  ) {
    window.HTMLElement.prototype.scrollIntoView = () => {};
  }
});

afterAll(() => {
  // You can add global cleanup here if needed
  console.log("Tearing down test environment...");
});

// Helper function to create a test Supabase client
export function createTestSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || "http://127.0.0.1:54321";
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

  return createClient(supabaseUrl, supabaseAnonKey);
}
