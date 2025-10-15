import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestSupabaseClient } from "./setup";
import { boardService } from "../services";
import {
  generateTestId,
  createTestBoard,
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
  let testUserId: string;
  let createdBoardIds: number[] = [];

  beforeEach(() => {
    supabase = createTestSupabaseClient();
    testUserId = generateTestId("user");
    createdBoardIds = [];
  });

  afterEach(async () => {
    // Cleanup all created boards
    for (const boardId of createdBoardIds) {
      await cleanupTestData(supabase, "boards", "id", boardId);
    }
  });

  it("should create a board using helper function", async () => {
    const board = await createTestBoard(supabase, testUserId, {
      title: "My Custom Board",
      color: "#00FF00",
    });

    createdBoardIds.push(board.id);

    expect(board).toBeDefined();
    expect(board.title).toBe("My Custom Board");
    expect(board.color).toBe("#00FF00");
    expect(isValidTimestamp(board.created_at)).toBe(true);
    expect(hasRequiredFields(board, ["id", "title", "user_id"])).toBe(true);
  });

  it("should demonstrate timestamp comparison with wait helper", async () => {
    const board = await createTestBoard(supabase, testUserId);
    createdBoardIds.push(board.id);

    const originalUpdatedAt = board.updated_at;

    // Wait to ensure timestamp difference
    await wait(100);

    const updatedBoard = await boardService.updateBoard(supabase, board.id, {
      title: "Updated Title",
    });

    expect(updatedBoard.updated_at).not.toBe(originalUpdatedAt);
    expect(new Date(updatedBoard.updated_at).getTime()).toBeGreaterThan(
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
