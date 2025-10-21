import React from "react";
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlanProvider, usePlan } from "../PlanContext";

describe("PlanContext", () => {
  it("returns free plan state when user has neither pro nor enterprise", () => {
    const { result } = renderHook(() => usePlan(), {
      wrapper: ({ children }) => (
        <PlanProvider hasProPlan={false} hasEnterprisePlan={false}>
          {children}
        </PlanProvider>
      ),
    });

    expect(result.current).toEqual({
      hasProPlan: false,
      hasEnterprisePlan: false,
      isFreeUser: true,
    });
  });

  it("returns pro plan state when user has pro access", () => {
    const { result } = renderHook(() => usePlan(), {
      wrapper: ({ children }) => (
        <PlanProvider hasProPlan hasEnterprisePlan={false}>
          {children}
        </PlanProvider>
      ),
    });

    expect(result.current).toEqual({
      hasProPlan: true,
      hasEnterprisePlan: false,
      isFreeUser: false,
    });
  });

  it("returns enterprise plan state when user has enterprise access", () => {
    const { result } = renderHook(() => usePlan(), {
      wrapper: ({ children }) => (
        <PlanProvider hasProPlan={false} hasEnterprisePlan>
          {children}
        </PlanProvider>
      ),
    });

    expect(result.current).toEqual({
      hasProPlan: false,
      hasEnterprisePlan: true,
      isFreeUser: false,
    });
  });

  it("throws when usePlan is called outside of PlanProvider", () => {
    expect(() => renderHook(() => usePlan())).toThrow(
      "usePlan needs to be inside the provider",
    );
  });
});
