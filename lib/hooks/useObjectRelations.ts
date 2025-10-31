"use client";

import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "../supabase/SupabaseProvider";
import { ObjectRelation, ScadaObject, RelationKind } from "../supabase/models";
import { objectRelationService, objectService } from "../services";

export interface RelationWithObject {
  relation: ObjectRelation;
  relatedObject: ScadaObject;
}

export function useObjectRelations(objectId: number) {
  const { supabase } = useSupabase();
  const [relations, setRelations] = useState<RelationWithObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRelations = useCallback(async () => {
    if (!supabase || !objectId) return;

    try {
      setLoading(true);
      setError(null);

      const relationData = await objectRelationService.getRelationsByObject(
        supabase,
        objectId
      );

      // Load related object details
      const relationsWithObjects = await Promise.all(
        relationData.map(async (relation) => {
          const relatedObjectId =
            relation.src_object_id === objectId
              ? relation.dst_object_id
              : relation.src_object_id;
          const relatedObject = await objectService.getObject(
            supabase,
            relatedObjectId
          );
          return {
            relation,
            relatedObject,
          };
        })
      );

      // Filter out relations where the related object doesn't exist
      const validRelations = relationsWithObjects.filter(
        (item): item is RelationWithObject => item.relatedObject !== null
      );

      setRelations(validRelations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load relations");
    } finally {
      setLoading(false);
    }
  }, [supabase, objectId]);

  useEffect(() => {
    loadRelations();
  }, [loadRelations]);

  const createRelation = useCallback(
    async (dstObjectId: number, relationKind: RelationKind) => {
      if (!supabase) throw new Error("Supabase client not initialized");

      try {
        const newRelation = await objectRelationService.createRelation(supabase, {
          src_object_id: objectId,
          dst_object_id: dstObjectId,
          relation_kind: relationKind,
        });

        await loadRelations();
        return newRelation;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create relation");
        throw err;
      }
    },
    [supabase, objectId, loadRelations]
  );

  const deleteRelation = useCallback(
    async (relationId: number) => {
      if (!supabase) throw new Error("Supabase client not initialized");

      try {
        const { error } = await supabase
          .from("object_relations")
          .delete()
          .eq("id", relationId);

        if (error) throw error;

        setRelations((prev) => prev.filter((r) => r.relation.id !== relationId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete relation");
        throw err;
      }
    },
    [supabase]
  );

  return {
    relations,
    loading,
    error,
    createRelation,
    deleteRelation,
    reloadRelations: loadRelations,
  };
}
