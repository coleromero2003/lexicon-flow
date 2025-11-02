import { describe, it, expect, beforeEach, vi } from "vitest";
import { createTestSupabaseClient } from "./setup";
import { submittalService } from "../services";
import type { ScadaObject, LexiconItem, FileMeta } from "../supabase/models";

describe("submittalService", () => {
  const supabase = createTestSupabaseClient();

  describe("getConnectedObjects", () => {
    it("should return empty array when object has no relations", async () => {
      // Mock the supabase response
      const mockFrom = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockOr = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockIn = vi.fn().mockResolvedValue({ data: [], error: null });

      const mockSupabase = {
        from: mockFrom,
      } as any;

      mockFrom.mockImplementation((table: string) => {
        if (table === "object_relations") {
          return { select: mockSelect };
        }
        if (table === "objects") {
          return { select: () => ({ in: mockIn }) };
        }
        return { select: mockSelect };
      });

      mockSelect.mockReturnValue({
        or: mockOr,
      });

      const result = await submittalService.getConnectedObjects(
        mockSupabase,
        1
      );

      expect(result).toEqual([]);
    });

    it("should return connected objects via relations", async () => {
      const mockRelations = [
        { id: 1, src_object_id: 1, dst_object_id: 2, relation_kind: "contains" },
        { id: 2, src_object_id: 3, dst_object_id: 1, relation_kind: "depends_on" },
      ];

      const mockObjects = [
        { id: 2, title: "Object 2", project_id: 1 },
        { id: 3, title: "Object 3", project_id: 1 },
      ] as ScadaObject[];

      const mockFrom = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockOr = vi
        .fn()
        .mockResolvedValue({ data: mockRelations, error: null });
      const mockIn = vi
        .fn()
        .mockResolvedValue({ data: mockObjects, error: null });

      const mockSupabase = {
        from: mockFrom,
      } as any;

      mockFrom.mockImplementation((table: string) => {
        if (table === "object_relations") {
          return {
            select: () => ({
              or: mockOr,
            }),
          };
        }
        if (table === "objects") {
          return {
            select: () => ({
              in: mockIn,
            }),
          };
        }
        return { select: mockSelect };
      });

      const result = await submittalService.getConnectedObjects(
        mockSupabase,
        1
      );

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe(2);
      expect(result[1]?.id).toBe(3);
    });
  });

  describe("buildBillOfMaterials", () => {
    it("should return empty array when no objects provided", async () => {
      const result = await submittalService.buildBillOfMaterials(supabase, []);
      expect(result).toEqual([]);
    });

    it("should aggregate lexicon items and count quantities", async () => {
      const mockLinks = [
        { object_id: 1, lexicon_id: 100 },
        { object_id: 2, lexicon_id: 100 }, // Same lexicon item
        { object_id: 3, lexicon_id: 101 },
      ];

      const mockLexiconItems = [
        { id: 100, name: "Part A", type: "part", attributes: {} },
        { id: 101, name: "Part B", type: "part", attributes: {} },
      ] as LexiconItem[];

      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "object_lexicon_links") {
            return {
              select: () => ({
                in: vi
                  .fn()
                  .mockResolvedValue({ data: mockLinks, error: null }),
              }),
            };
          }
          if (table === "lexicon_items") {
            return {
              select: () => ({
                in: () => ({
                  order: vi
                    .fn()
                    .mockResolvedValue({
                      data: mockLexiconItems,
                      error: null,
                    }),
                }),
              }),
            };
          }
          return {};
        }),
      } as any;

      const result = await submittalService.buildBillOfMaterials(
        mockSupabase,
        [1, 2, 3]
      );

      expect(result).toHaveLength(2);

      // Part A should have quantity 2 (used in objects 1 and 2)
      const partA = result.find((item) => item.lexiconItem.id === 100);
      expect(partA?.quantity).toBe(2);
      expect(partA?.objectIds).toEqual([1, 2]);

      // Part B should have quantity 1
      const partB = result.find((item) => item.lexiconItem.id === 101);
      expect(partB?.quantity).toBe(1);
      expect(partB?.objectIds).toEqual([3]);
    });
  });

  describe("getPartsSheets", () => {
    it("should return empty array when no objects provided", async () => {
      const result = await submittalService.getPartsSheets(supabase, []);
      expect(result).toEqual([]);
    });

    it("should return only lexicon items of type 'part' with their files", async () => {
      const mockLinks = [
        { object_id: 1, lexicon_id: 100 },
        { object_id: 2, lexicon_id: 101 },
        { object_id: 3, lexicon_id: 102 },
      ];

      const mockLexiconItems = [
        { id: 100, name: "Motor", type: "part", attributes: {} },
        { id: 101, name: "Spec Doc", type: "document", attributes: {} }, // Not a part
        { id: 102, name: "Sensor", type: "part", attributes: {} },
      ] as LexiconItem[];

      const mockFiles = [
        { id: 1, filename: "motor-datasheet.pdf", storage_key: "file1" },
        { id: 2, filename: "sensor-manual.pdf", storage_key: "file2" },
      ] as FileMeta[];

      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "object_lexicon_links") {
            return {
              select: () => ({
                in: vi
                  .fn()
                  .mockResolvedValue({ data: mockLinks, error: null }),
              }),
            };
          }
          if (table === "lexicon_items") {
            return {
              select: () => ({
                in: () => ({
                  order: vi
                    .fn()
                    .mockResolvedValue({
                      data: mockLexiconItems,
                      error: null,
                    }),
                }),
              }),
            };
          }
          if (table === "lexicon_files") {
            return {
              select: vi.fn().mockImplementation((fields: string) => ({
                eq: vi.fn().mockImplementation((field: string, value: number) => {
                  // Return different files based on lexicon_id
                  if (value === 100) {
                    return Promise.resolve({
                      data: [{ files: mockFiles[0] }],
                      error: null,
                    });
                  }
                  if (value === 102) {
                    return Promise.resolve({
                      data: [{ files: mockFiles[1] }],
                      error: null,
                    });
                  }
                  return Promise.resolve({ data: [], error: null });
                }),
              })),
            };
          }
          return {};
        }),
      } as any;

      const result = await submittalService.getPartsSheets(mockSupabase, [
        1, 2, 3,
      ]);

      expect(result).toHaveLength(2); // Only parts (100 and 102)
      expect(result[0]?.lexiconItem.type).toBe("part");
      expect(result[1]?.lexiconItem.type).toBe("part");

      // Check that document type was filtered out
      const docItem = result.find(
        (item) => item.lexiconItem.id === 101
      );
      expect(docItem).toBeUndefined();
    });
  });

  describe("aggregateSubmittalData", () => {
    it("should throw error when submittal object not found", async () => {
      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "objects") {
            return {
              select: () => ({
                eq: () => ({
                  single: vi
                    .fn()
                    .mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
                }),
              }),
            };
          }
          return {};
        }),
      } as any;

      await expect(
        submittalService.aggregateSubmittalData(mockSupabase, 999, [1, 2], null)
      ).rejects.toThrow("Submittal object not found");
    });

    it("should aggregate all data for submittal generation", async () => {
      const mockSubmittalObject = {
        id: 1,
        title: "Main Submittal",
        project_id: 10,
        description_md: "# Title\nSubmittal content",
      } as ScadaObject;

      const mockProject = {
        id: 10,
        name: "Test Project",
        client_lexicon_id: 50,
      };

      const mockClientInfo = {
        id: 50,
        name: "Test Client",
        type: "client",
        attributes: { contact: "John Doe" },
      } as LexiconItem;

      const mockSelectedObjects = [
        { id: 1, title: "Object 1" },
        { id: 2, title: "Object 2" },
      ] as ScadaObject[];

      const mockSpecObject = {
        id: 2,
        title: "Specifications",
        description_md: "Spec details",
      } as ScadaObject;

      let callCount = 0;
      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "objects") {
            callCount++;
            if (callCount === 1) {
              // First call for submittal object
              return {
                select: () => ({
                  eq: () => ({
                    single: vi
                      .fn()
                      .mockResolvedValue({
                        data: mockSubmittalObject,
                        error: null,
                      }),
                  }),
                  in: vi
                    .fn()
                    .mockResolvedValue({
                      data: mockSelectedObjects,
                      error: null,
                    }),
                }),
              };
            } else if (callCount === 2) {
              // Second call for selected objects
              return {
                select: () => ({
                  in: vi
                    .fn()
                    .mockResolvedValue({
                      data: mockSelectedObjects,
                      error: null,
                    }),
                }),
              };
            } else {
              // Third call for spec object
              return {
                select: () => ({
                  eq: () => ({
                    single: vi
                      .fn()
                      .mockResolvedValue({ data: mockSpecObject, error: null }),
                  }),
                }),
              };
            }
          }
          if (table === "projects") {
            return {
              select: () => ({
                eq: () => ({
                  single: vi
                    .fn()
                    .mockResolvedValue({ data: mockProject, error: null }),
                }),
              }),
            };
          }
          if (table === "lexicon_items") {
            return {
              select: () => ({
                eq: () => ({
                  single: vi
                    .fn()
                    .mockResolvedValue({ data: mockClientInfo, error: null }),
                }),
                in: () => ({
                  order: vi
                    .fn()
                    .mockResolvedValue({ data: [], error: null }),
                }),
              }),
            };
          }
          if (table === "object_lexicon_links") {
            return {
              select: () => ({
                in: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            };
          }
          return {};
        }),
      } as any;

      const result = await submittalService.aggregateSubmittalData(
        mockSupabase,
        1,
        [1, 2],
        2
      );

      expect(result.submittalObject.id).toBe(1);
      expect(result.project.id).toBe(10);
      expect(result.clientInfo?.id).toBe(50);
      expect(result.selectedObjects).toHaveLength(2);
      expect(result.specObject?.id).toBe(2);
      expect(result.billOfMaterials).toEqual([]);
      expect(result.partsSheets).toEqual([]);
    });
  });
});
