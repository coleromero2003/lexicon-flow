import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  RelationKind,
  ScadaObject,
  ObjectRelation,
} from "../../supabase/models";
import { useObjectRelations } from "../useObjectRelations";

const {
  mockEq,
  mockDelete,
  mockFrom,
  mockSupabase,
  mockGetRelationsByObject,
  mockCreateRelation,
  mockGetObject,
} = vi.hoisted(() => {
  const eq = vi.fn();
  const del = vi.fn();
  const from = vi.fn();
  const supabase = { from } as any;
  return {
    mockEq: eq,
    mockDelete: del,
    mockFrom: from,
    mockSupabase: supabase,
    mockGetRelationsByObject: vi.fn(),
    mockCreateRelation: vi.fn(),
    mockGetObject: vi.fn(),
  };
});

vi.mock("../../supabase/SupabaseProvider", () => ({
  useSupabase: () => ({
    supabase: mockSupabase,
    isLoaded: true,
  }),
}));

vi.mock("../../services", () => ({
  objectRelationService: {
    getRelationsByObject: mockGetRelationsByObject,
    createRelation: mockCreateRelation,
  },
  objectService: {
    getObject: mockGetObject,
  },
}));

const baseObject: ScadaObject = {
  id: 1,
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  project_id: 1,
  workflow_id: [1],
  step_id: [1],
  title: "Root",
  description_md: null,
  assignee: null,
  due_date: null,
  priority: "medium",
  sort_order: 0,
  metadata: null,
};

const makeObject = (id: number, title: string): ScadaObject => ({
  ...baseObject,
  id,
  title,
});

const relationTemplate: Omit<ObjectRelation, "id"> = {
  created_at: "2024-01-01T00:00:00.000Z",
  relation_kind: "contains",
  src_object_id: 1,
  dst_object_id: 2,
};

beforeEach(() => {
  mockEq.mockReset();
  mockDelete.mockReset();
  mockFrom.mockReset();
  mockGetRelationsByObject.mockReset();
  mockCreateRelation.mockReset();
  mockGetObject.mockReset();

  mockFrom.mockReturnValue({
    delete: mockDelete,
  });
  mockDelete.mockReturnValue({
    eq: mockEq,
  });
  mockEq.mockResolvedValue({ error: null });
});

describe("useObjectRelations", () => {
  it("loads relation rows paired with related objects", async () => {
    const relations: ObjectRelation[] = [
      { id: 10, ...relationTemplate },
      { id: 11, ...relationTemplate, src_object_id: 3, dst_object_id: 1 },
    ];

    const relatedObjects: Record<number, ScadaObject> = {
      2: makeObject(2, "Child"),
      3: makeObject(3, "Parent"),
    };

    mockGetRelationsByObject.mockResolvedValue(relations);
    mockGetObject.mockImplementation((_, id: number) =>
      Promise.resolve(relatedObjects[id])
    );

    const { result } = renderHook(() => useObjectRelations(1));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.relations).toEqual([
      { relation: relations[0], relatedObject: relatedObjects[2] },
      { relation: relations[1], relatedObject: relatedObjects[3] },
    ]);
    expect(mockGetRelationsByObject).toHaveBeenCalledWith(mockSupabase, 1);
  });

  it("creates a relation and refreshes the relation list", async () => {
    const initialRelations: ObjectRelation[] = [
      { id: 10, ...relationTemplate },
    ];
    const newRelation: ObjectRelation = {
      id: 12,
      ...relationTemplate,
      dst_object_id: 4,
    };

    const relatedObjects: Record<number, ScadaObject> = {
      2: makeObject(2, "Child"),
      4: makeObject(4, "Sibling"),
    };

    mockGetRelationsByObject
      .mockResolvedValueOnce(initialRelations)
      .mockResolvedValueOnce([...initialRelations, newRelation]);

    mockGetObject.mockImplementation((_, id: number) =>
      Promise.resolve(relatedObjects[id])
    );
    mockCreateRelation.mockResolvedValue(newRelation);

    const { result } = renderHook(() => useObjectRelations(1));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createRelation(
        newRelation.dst_object_id,
        newRelation.relation_kind as RelationKind
      );
    });

    await waitFor(() => expect(result.current.relations).toHaveLength(2));

    expect(result.current.relations[1]).toEqual({
      relation: newRelation,
      relatedObject: relatedObjects[4],
    });
    expect(mockCreateRelation).toHaveBeenCalledWith(mockSupabase, {
      src_object_id: 1,
      dst_object_id: newRelation.dst_object_id,
      relation_kind: newRelation.relation_kind,
    });
    expect(mockGetRelationsByObject).toHaveBeenCalledTimes(2);
  });

  it("deletes a relation and removes it from state", async () => {
    const relations: ObjectRelation[] = [
      { id: 10, ...relationTemplate },
    ];

    const relatedObjects: Record<number, ScadaObject> = {
      2: makeObject(2, "Child"),
    };

    mockGetRelationsByObject.mockResolvedValue(relations);
    mockGetObject.mockImplementation((_, id: number) =>
      Promise.resolve(relatedObjects[id])
    );

    const { result } = renderHook(() => useObjectRelations(1));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteRelation(relations[0].id);
    });

    expect(mockFrom).toHaveBeenCalledWith("object_relations");
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith("id", relations[0].id);
    expect(result.current.relations).toHaveLength(0);
  });
});
