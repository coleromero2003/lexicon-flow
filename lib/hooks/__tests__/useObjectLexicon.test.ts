import { renderHook, act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { useObjectLexicon } from "../useObjectLexicon";
import type { LexiconItem, ObjectLexiconLink } from "../../supabase/models";

const mockUseSupabase = vi.fn();

vi.mock("../../supabase/SupabaseProvider", () => ({
  useSupabase: () => mockUseSupabase(),
}));

const mockGetLexiconByObject = vi.fn();
const mockLinkLexiconItem = vi.fn();
const mockGetLexiconItem = vi.fn();

vi.mock("../../services", () => ({
  objectLexiconService: {
    getLexiconByObject: (
      ...args: Parameters<typeof mockGetLexiconByObject>
    ) => mockGetLexiconByObject(...args),
    linkLexiconItem: (
      ...args: Parameters<typeof mockLinkLexiconItem>
    ) => mockLinkLexiconItem(...args),
  },
  lexiconService: {
    getLexiconItem: (
      ...args: Parameters<typeof mockGetLexiconItem>
    ) => mockGetLexiconItem(...args),
  },
}));

type SupabaseMock = {
  supabase: SupabaseClient;
  fromMock: ReturnType<typeof vi.fn>;
  deleteMock: ReturnType<typeof vi.fn>;
  updateMock: ReturnType<typeof vi.fn>;
  deleteChain: { eq: ReturnType<typeof vi.fn> } & PromiseLike<{ error: null }>;
  updateChain: { eq: ReturnType<typeof vi.fn> } & PromiseLike<{ error: null }>;
};

function createChain(): { eq: ReturnType<typeof vi.fn> } & PromiseLike<{ error: null }> {
  const eq = vi.fn();
  const chain = {
    eq: eq.mockImplementation(() => chain),
    then: (resolve: (result: { error: null }) => void) =>
      resolve({ error: null }),
  } as unknown as { eq: ReturnType<typeof vi.fn> } & PromiseLike<{ error: null }>;

  return chain;
}

function createSupabaseMock(): SupabaseMock {
  const deleteChain = createChain();
  const updateChain = createChain();

  const deleteMock = vi.fn(() => deleteChain);
  const updateMock = vi.fn(() => updateChain);

  const fromMock = vi.fn(() => ({
    delete: deleteMock,
    update: updateMock,
  }));

  return {
    supabase: { from: fromMock } as unknown as SupabaseClient,
    fromMock,
    deleteMock,
    updateMock,
    deleteChain,
    updateChain,
  };
}

describe("useObjectLexicon", () => {
  let supabaseMock: SupabaseMock;
  const objectId = 42;

  const createLexiconItem = (id: number, overrides: Partial<LexiconItem> = {}) => ({
    id,
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
    org_id: "org-1",
    type: "part",
    name: `Item ${id}`,
    sku: null,
    manufacturer: null,
    attributes: {},
    version: 1,
    ...overrides,
  });

  const linkFor = (
    lexiconId: number,
    overrides: Partial<ObjectLexiconLink> = {}
  ): ObjectLexiconLink => ({
    object_id: objectId,
    lexicon_id: lexiconId,
    note: null,
    ...overrides,
  });

  beforeEach(() => {
    supabaseMock = createSupabaseMock();
    mockUseSupabase.mockReset();
    mockUseSupabase.mockReturnValue({
      supabase: supabaseMock.supabase,
      isLoaded: true,
    });

    mockGetLexiconByObject.mockReset();
    mockLinkLexiconItem.mockReset();
    mockGetLexiconItem.mockReset();
  });

  it("hydrates lexicon links on initial load", async () => {
    const links = [linkFor(1, { note: "Existing note" })];
    const lexiconItems: Record<number, LexiconItem> = {
      1: createLexiconItem(1, { name: "Existing Item" }),
    };

    mockGetLexiconByObject.mockResolvedValueOnce(links);
    mockGetLexiconItem.mockImplementation(async (_, lexiconId: number) => {
      return lexiconItems[lexiconId];
    });

    const { result } = renderHook(() => useObjectLexicon(objectId));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockGetLexiconByObject).toHaveBeenCalledWith(
      supabaseMock.supabase,
      objectId
    );
    expect(mockGetLexiconItem).toHaveBeenCalledWith(
      supabaseMock.supabase,
      1
    );
    expect(result.current.lexiconLinks).toEqual([
      {
        link: links[0],
        lexiconItem: lexiconItems[1],
      },
    ]);
  });

  it("links a lexicon item and reloads the cache", async () => {
    const initialLinks = [linkFor(1)];
    const updatedLinks = [linkFor(1), linkFor(2, { note: "Linked note" })];
    const lexiconItems: Record<number, LexiconItem> = {
      1: createLexiconItem(1),
      2: createLexiconItem(2),
    };

    mockGetLexiconByObject
      .mockResolvedValueOnce(initialLinks)
      .mockResolvedValueOnce(updatedLinks);
    mockGetLexiconItem.mockImplementation(async (_, lexiconId: number) => {
      return lexiconItems[lexiconId];
    });
    mockLinkLexiconItem.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useObjectLexicon(objectId));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.linkLexiconItem(2, "Linked note");
    });

    expect(mockLinkLexiconItem).toHaveBeenCalledWith(supabaseMock.supabase, {
      object_id: objectId,
      lexicon_id: 2,
      note: "Linked note",
    });
    expect(mockGetLexiconByObject).toHaveBeenCalledTimes(2);
    expect(result.current.lexiconLinks).toEqual(
      updatedLinks.map((link) => ({
        link,
        lexiconItem: lexiconItems[link.lexicon_id],
      }))
    );
  });

  it("unlinks a lexicon item and removes it from state", async () => {
    const initialLinks = [linkFor(1), linkFor(2)];
    const lexiconItems: Record<number, LexiconItem> = {
      1: createLexiconItem(1),
      2: createLexiconItem(2),
    };

    mockGetLexiconByObject.mockResolvedValueOnce(initialLinks);
    mockGetLexiconItem.mockImplementation(async (_, lexiconId: number) => {
      return lexiconItems[lexiconId];
    });

    const { result } = renderHook(() => useObjectLexicon(objectId));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.unlinkLexiconItem(2);
    });

    expect(supabaseMock.fromMock).toHaveBeenCalledWith("object_lexicon_links");
    expect(supabaseMock.deleteMock).toHaveBeenCalled();
    expect(supabaseMock.deleteChain.eq).toHaveBeenNthCalledWith(1, "object_id", objectId);
    expect(supabaseMock.deleteChain.eq).toHaveBeenNthCalledWith(2, "lexicon_id", 2);
    expect(result.current.lexiconLinks).toEqual([
      {
        link: initialLinks[0],
        lexiconItem: lexiconItems[1],
      },
    ]);
  });

  it("updates a lexicon note in place", async () => {
    const initialLinks = [linkFor(1, { note: "old" })];
    const lexiconItems: Record<number, LexiconItem> = {
      1: createLexiconItem(1),
    };

    mockGetLexiconByObject.mockResolvedValueOnce(initialLinks);
    mockGetLexiconItem.mockImplementation(async (_, lexiconId: number) => {
      return lexiconItems[lexiconId];
    });

    const { result } = renderHook(() => useObjectLexicon(objectId));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateLexiconNote(1, "updated note");
    });

    expect(supabaseMock.updateMock).toHaveBeenCalledWith({ note: "updated note" });
    expect(supabaseMock.updateChain.eq).toHaveBeenNthCalledWith(1, "object_id", objectId);
    expect(supabaseMock.updateChain.eq).toHaveBeenNthCalledWith(2, "lexicon_id", 1);
    expect(result.current.lexiconLinks).toEqual([
      {
        link: { ...initialLinks[0], note: "updated note" },
        lexiconItem: lexiconItems[1],
      },
    ]);
  });
});
