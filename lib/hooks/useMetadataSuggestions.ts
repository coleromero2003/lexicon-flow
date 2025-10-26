"use client";

import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "../supabase/SupabaseProvider";

export function useMetadataSuggestions(projectId: number) {
  const { supabase } = useSupabase();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSuggestions = useCallback(async () => {
    if (!supabase || !projectId) return;

    try {
      setLoading(true);
      setError(null);

      // Get all objects in the project
      const { data, error: queryError } = await supabase
        .from("objects")
        .select("metadata")
        .eq("project_id", projectId);

      if (queryError) throw queryError;

      // Extract all unique metadata keys
      const allKeys = new Set<string>();
      data?.forEach((obj) => {
        if (obj.metadata && typeof obj.metadata === "object") {
          Object.keys(obj.metadata).forEach((key) => allKeys.add(key));
        }
      });

      // Sort alphabetically
      const sortedKeys = Array.from(allKeys).sort();
      setSuggestions(sortedKeys);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load suggestions"
      );
    } finally {
      setLoading(false);
    }
  }, [supabase, projectId]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  return {
    suggestions,
    loading,
    error,
    reloadSuggestions: loadSuggestions,
  };
}
