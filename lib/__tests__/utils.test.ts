import { describe, it, expect } from "vitest";

import { cn } from "../utils";

describe("cn", () => {
  it("merges Tailwind classes, keeping the last conflicting value", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("filters out falsy values while preserving truthy classes", () => {
    expect(cn("text-sm", false && "hidden", undefined, "font-bold")).toBe("text-sm font-bold");
  });

  it("deduplicates classes coming from nested arrays and objects", () => {
    expect(
      cn("flex", ["flex", null], {
        "items-center": true,
        hidden: false,
      }),
    ).toBe("flex items-center");
  });
});
