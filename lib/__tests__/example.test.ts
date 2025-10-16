import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestSupabaseClient } from "./setup";
import {
  generateTestId,
  createTestProject,
  cleanupTestData,
  wait,
  isValidTimestamp,
  hasRequiredFields,
} from "./helpers";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Example test suite demonstrating how to use test helpers
 * This is a simplified example - refer to services.test.ts for comprehensive tests
 */
describe("Example Test Suite with Helpers", () => {
  let supabase: SupabaseClient;
  let testOrgId: string;
  let createdProjectIds: number[] = [];

  beforeEach(() => {
    supabase = createTestSupabaseClient();
    testOrgId = generateTestId("org");
    createdProjectIds = [];
  });

  afterEach(async () => {
    // Cleanup all created projects
    for (const projectId of createdProjectIds) {
      await cleanupTestData(supabase, "projects", "id", projectId);
    }
  });

  it("should create a project using helper function", async () => {
    const project = await createTestProject(supabase, testOrgId, {
      name: "My Custom Project",
      code: "MCP",
    });

    createdProjectIds.push(project.id);

    expect(project).toBeDefined();
    expect(project.name).toBe("My Custom Project");
    expect(project.code).toBe("MCP");
    expect(isValidTimestamp(project.created_at)).toBe(true);
    expect(hasRequiredFields(project, ["id", "name", "org_id"])).toBe(true);
  });

  it("should demonstrate timestamp comparison with wait helper", async () => {
    const project = await createTestProject(supabase, testOrgId);
    createdProjectIds.push(project.id);

    const originalUpdatedAt = project.updated_at;

    // Wait to ensure timestamp difference
    await wait(100);

    // Manually update the project to demonstrate timestamp change
    const { data: updatedProject } = await supabase
      .from("projects")
      .update({ name: "Updated Name", updated_at: new Date().toISOString() })
      .eq("id", project.id)
      .select()
      .single();

    expect(updatedProject?.updated_at).not.toBe(originalUpdatedAt);
    expect(new Date(updatedProject?.updated_at || "").getTime()).toBeGreaterThan(
      new Date(originalUpdatedAt).getTime()
    );
  });

  it("should generate unique test IDs", () => {
    const id1 = generateTestId("test");
    const id2 = generateTestId("test");

    expect(id1).not.toBe(id2);
    expect(id1).toContain("test-");
    expect(id2).toContain("test-");
  });
});
