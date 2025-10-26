import React, { useEffect } from "react";
import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const { mockUseSession, mockUseOrganization, createClientMock, mockSupabaseClient } =
  vi.hoisted(() => ({
    mockUseSession: vi.fn(),
    mockUseOrganization: vi.fn(),
    createClientMock: vi.fn(),
    mockSupabaseClient: { id: "mock-client" } as const,
  }));

vi.mock("@clerk/nextjs", () => ({
  useSession: mockUseSession,
  useOrganization: mockUseOrganization,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

type ContextValue = { supabase: unknown; isLoaded: boolean };
let SupabaseProviderComponent: React.ComponentType<{ children: React.ReactNode }>;
let useSupabaseHook: () => ContextValue;

function TestConsumer({ onValue }: { onValue: (value: ContextValue) => void }) {
  const context = useSupabaseHook();

  useEffect(() => {
    onValue(context);
  }, [context, onValue]);

  return null;
}

describe("SupabaseProvider", () => {
  let sessionState: { session: null | { getToken: () => Promise<string> } };

  beforeEach(async () => {
    vi.clearAllMocks();
    sessionState = { session: null };
    mockUseSession.mockImplementation(() => sessionState);
    mockUseOrganization.mockImplementation(() => ({ organization: null }));
    createClientMock.mockReturnValue(mockSupabaseClient);
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    (globalThis as typeof globalThis & { React?: typeof React }).React = React;
    vi.resetModules();
    const module = await import("../SupabaseProvider");
    SupabaseProviderComponent = module.default;
    useSupabaseHook = module.useSupabase as unknown as () => ContextValue;
  });

  it("exposes null client before session and provides client once session is available", async () => {
    const onValue = vi.fn();

    const { rerender } = render(
      <SupabaseProviderComponent>
        <TestConsumer onValue={onValue} />
      </SupabaseProviderComponent>
    );

    await waitFor(() => {
      expect(onValue).toHaveBeenCalled();
    });

    const initialContext = onValue.mock.calls[0][0] as ContextValue;
    expect(initialContext.supabase).toBeNull();
    expect(initialContext.isLoaded).toBe(false);
    expect(createClientMock).not.toHaveBeenCalled();

    const fakeSession = {
      getToken: vi.fn().mockResolvedValue("fake-token"),
    };

    sessionState = { session: fakeSession };

    rerender(
      <SupabaseProviderComponent>
        <TestConsumer onValue={onValue} />
      </SupabaseProviderComponent>
    );

    await waitFor(() => {
      expect(createClientMock).toHaveBeenCalledWith(
        "https://example.supabase.co",
        "anon-key",
        expect.objectContaining({
          accessToken: expect.any(Function),
        })
      );
    });

    await waitFor(() => {
      const latestContext = onValue.mock.calls[onValue.mock.calls.length - 1][0] as ContextValue;
      expect(latestContext.supabase).toBe(mockSupabaseClient);
      expect(latestContext.isLoaded).toBe(true);
    });
  });
});
