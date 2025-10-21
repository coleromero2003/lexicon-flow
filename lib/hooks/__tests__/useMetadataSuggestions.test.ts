import { renderHook, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import { useMetadataSuggestions } from "../useMetadataSuggestions";

const mockUseSupabase = vi.hoisted(() => vi.fn());

vi.mock("../../supabase/SupabaseProvider", () => ({
  useSupabase: () => mockUseSupabase(),
}));

describe("useMetadataSuggestions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads unique, sorted metadata keys into suggestions", async () => {
    const eq = vi.fn().mockResolvedValue({
      data: [
        { metadata: { beta: "value", alpha: "value" } },
        { metadata: { gamma: "value", alpha: "other" } },
        { metadata: null },
      ],
      error: null,
    });
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));

    mockUseSupabase.mockReturnValue({
      supabase: { from } as any,
      isLoaded: true,
    });

    const { result } = renderHook(() => useMetadataSuggestions(123));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(from).toHaveBeenCalledWith("objects");
    expect(select).toHaveBeenCalledWith("metadata");
    expect(eq).toHaveBeenCalledWith("project_id", 123);
    expect(result.current.suggestions).toEqual(["alpha", "beta", "gamma"]);
    expect(result.current.error).toBeNull();
  });

  it("sets error when fetching metadata fails and resets loading", async () => {
    const failure = new Error("Query failed");
    const eq = vi.fn().mockResolvedValue({
      data: null,
      error: failure,
    });
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));

    mockUseSupabase.mockReturnValue({
      supabase: { from } as any,
      isLoaded: true,
    });

    const { result } = renderHook(() => useMetadataSuggestions(456));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("Query failed");
    expect(result.current.suggestions).toEqual([]);
  });
});
