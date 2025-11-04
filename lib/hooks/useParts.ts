"use client";

import { useOrganization } from "@clerk/nextjs";
import { partService } from "../services";
import { useEffect, useState } from "react";
import { Part } from "../supabase/models";
import { useSupabase } from "../supabase/SupabaseProvider";

interface UsePartsOptions {
  projectId?: number;
  objectId?: number;
  autoLoad?: boolean;
}

export function useParts(options: UsePartsOptions = {}) {
  const { projectId, objectId, autoLoad = true } = options;
  const { organization } = useOrganization();
  const { supabase } = useSupabase();
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (organization && autoLoad) {
      loadParts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization, supabase, projectId, objectId, autoLoad]);

  async function loadParts() {
    if (!organization) return;
    if (!supabase) return; // Wait for Supabase client to be initialized

    try {
      setLoading(true);
      setError(null);

      let data: Part[];
      if (objectId) {
        data = await partService.getPartsByObject(supabase, objectId);
      } else if (projectId) {
        data = await partService.getPartsByProject(supabase, projectId);
      } else {
        data = await partService.getParts(supabase);
      }

      setParts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load parts.");
    } finally {
      setLoading(false);
    }
  }

  async function createPart(partData: {
    part_number: string;
    description: string;
    quantity: number;
    project_id: number;
    object_id?: number | null;
    lexicon_item_id?: number | null;
    comments?: string | null;
    ordered?: boolean;
    ordered_date?: string | null;
    received?: boolean;
    received_date?: string | null;
    delivered?: boolean;
    delivered_date?: string | null;
  }) {
    if (!organization) throw new Error("Organization not found");
    if (!supabase) throw new Error("Supabase client not initialized");

    try {
      const newPart = await partService.createPart(supabase, {
        part_number: partData.part_number,
        description: partData.description,
        quantity: partData.quantity,
        project_id: partData.project_id,
        organization_id: organization.id,
        object_id: partData.object_id || null,
        lexicon_item_id: partData.lexicon_item_id || null,
        comments: partData.comments || null,
        ordered: partData.ordered || false,
        ordered_date: partData.ordered_date || null,
        received: partData.received || false,
        received_date: partData.received_date || null,
        delivered: partData.delivered || false,
        delivered_date: partData.delivered_date || null,
      });

      setParts((prev) => [newPart, ...prev]);
      return newPart;
    } catch (err) {
      console.error("Error in createPart:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to create part.";
      setError(errorMessage);
      throw err;
    }
  }

  async function updatePart(
    partId: number,
    updates: Partial<Omit<Part, "id" | "created_at" | "updated_at" | "organization_id">>
  ) {
    if (!organization) throw new Error("Organization not found");
    if (!supabase) throw new Error("Supabase client not initialized");

    try {
      const updatedPart = await partService.updatePart(supabase, partId, updates);

      setParts((prev) =>
        prev.map((p) => (p.id === partId ? updatedPart : p))
      );

      return updatedPart;
    } catch (err) {
      console.error("Error in updatePart:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update part.";
      setError(errorMessage);
      throw err;
    }
  }

  async function deletePart(partId: number) {
    if (!organization) throw new Error("Organization not found");
    if (!supabase) throw new Error("Supabase client not initialized");

    try {
      await partService.deletePart(supabase, partId);

      setParts((prev) => prev.filter((p) => p.id !== partId));
    } catch (err) {
      console.error("Error in deletePart:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete part.";
      setError(errorMessage);
      throw err;
    }
  }

  return {
    parts,
    loading,
    error,
    createPart,
    updatePart,
    deletePart,
    reload: loadParts,
  };
}
