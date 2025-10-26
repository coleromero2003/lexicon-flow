import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import { useOrganizationUsers } from "../useOrganizationUsers";

vi.mock("@clerk/nextjs", () => ({
  useOrganization: vi.fn(),
}));

import { useOrganization } from "@clerk/nextjs";
const mockUseOrganization = vi.mocked(useOrganization);

describe("useOrganizationUsers", () => {
  beforeEach(() => {
    mockUseOrganization.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty users when organization is not loaded", async () => {
    mockUseOrganization.mockReturnValue({
      organization: null,
      isLoaded: false,
    });

    const { result } = renderHook(() => useOrganizationUsers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.users).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("formats memberships with public user data", async () => {
    const getMemberships = vi.fn().mockResolvedValue({
      data: [
        {
          id: "mem_1",
          role: "admin",
          publicUserData: {
            userId: "user_1",
            identifier: "alice@example.com",
            firstName: "Alice",
            lastName: "Anderson",
            imageUrl: "https://example.com/alice.png",
          },
        },
        {
          id: "mem_2",
          role: "member",
          publicUserData: {
            userId: "user_2",
            identifier: "jane@example.com",
            firstName: "Jane",
            lastName: "",
            imageUrl: "",
          },
        },
        {
          id: "mem_3",
          role: "member",
          publicUserData: null,
        },
      ],
    });

    mockUseOrganization.mockReturnValue({
      organization: { getMemberships },
      isLoaded: true,
    });

    const { result } = renderHook(() => useOrganizationUsers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(getMemberships).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
    expect(result.current.users).toEqual([
      {
        id: "mem_1",
        userId: "user_1",
        email: "alice@example.com",
        name: "Alice Anderson",
        imageUrl: "https://example.com/alice.png",
        role: "admin",
      },
      {
        id: "mem_2",
        userId: "user_2",
        email: "jane@example.com",
        name: "Jane",
        imageUrl: "",
        role: "member",
      },
    ]);
  });

  it("captures errors when fetching memberships fails", async () => {
    const error = new Error("Network failure");
    const getMemberships = vi.fn().mockRejectedValue(error);

    mockUseOrganization.mockReturnValue({
      organization: { getMemberships },
      isLoaded: true,
    });

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { result } = renderHook(() => useOrganizationUsers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.users).toEqual([]);
    expect(result.current.error).toBe("Network failure");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to load organization users:",
      error
    );
    consoleErrorSpy.mockRestore();
  });
});
