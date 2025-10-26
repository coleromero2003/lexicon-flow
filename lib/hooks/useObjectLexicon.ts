"use client";

import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "../supabase/SupabaseProvider";
import { LexiconItem, ObjectLexiconLink } from "../supabase/models";
import { objectLexiconService, lexiconService } from "../services";

export interface LexiconLinkWithItem {
  link: ObjectLexiconLink;
  lexiconItem: LexiconItem;
}

export function useObjectLexicon(objectId: number) {
  const { supabase } = useSupabase();
  const [lexiconLinks, setLexiconLinks] = useState<LexiconLinkWithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLexiconLinks = useCallback(async () => {
    if (!supabase || !objectId) return;

    try {
      setLoading(true);
      setError(null);

      const links = await objectLexiconService.getLexiconByObject(
        supabase,
        objectId
      );

      const linksWithItems = await Promise.all(
        links.map(async (link) => {
          const lexiconItem = await lexiconService.getLexiconItem(
            supabase,
            link.lexicon_id
          );
          return {
            link,
            lexiconItem,
          };
        })
      );

      setLexiconLinks(linksWithItems);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load lexicon links"
      );
    } finally {
      setLoading(false);
    }
  }, [supabase, objectId]);

  useEffect(() => {
    loadLexiconLinks();
  }, [loadLexiconLinks]);

  const linkLexiconItem = useCallback(
    async (lexiconId: number, note?: string) => {
      if (!supabase) throw new Error("Supabase client not initialized");

      try {
        await objectLexiconService.linkLexiconItem(supabase, {
          object_id: objectId,
          lexicon_id: lexiconId,
          note: note || null,
        });

        await loadLexiconLinks();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to link lexicon item"
        );
        throw err;
      }
    },
    [supabase, objectId, loadLexiconLinks]
  );

  const unlinkLexiconItem = useCallback(
    async (lexiconId: number) => {
      if (!supabase) throw new Error("Supabase client not initialized");

      try {
        const { error } = await supabase
          .from("object_lexicon_links")
          .delete()
          .eq("object_id", objectId)
          .eq("lexicon_id", lexiconId);

        if (error) throw error;

        setLexiconLinks((prev) =>
          prev.filter((l) => l.link.lexicon_id !== lexiconId)
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to unlink lexicon item"
        );
        throw err;
      }
    },
    [supabase, objectId]
  );

  const updateLexiconNote = useCallback(
    async (lexiconId: number, note: string) => {
      if (!supabase) throw new Error("Supabase client not initialized");

      try {
        const { error } = await supabase
          .from("object_lexicon_links")
          .update({ note })
          .eq("object_id", objectId)
          .eq("lexicon_id", lexiconId);

        if (error) throw error;

        setLexiconLinks((prev) =>
          prev.map((l) =>
            l.link.lexicon_id === lexiconId
              ? { ...l, link: { ...l.link, note } }
              : l
          )
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update lexicon note"
        );
        throw err;
      }
    },
    [supabase, objectId]
  );

  return {
    lexiconLinks,
    loading,
    error,
    linkLexiconItem,
    unlinkLexiconItem,
    updateLexiconNote,
    reloadLexiconLinks: loadLexiconLinks,
  };
}
