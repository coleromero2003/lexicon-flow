import { Badge } from "@/components/ui/badge";
import type { RelationKind } from "@/lib/supabase/models";
import { ObjectSection } from "./object-section";

export interface RelationDisplayItem {
  id: number;
  relationKind: RelationKind;
  direction: "incoming" | "outgoing";
  relatedObjectId: number | null;
  relatedObject: { id: number; title: string } | null;
}

const relationLabels: Record<RelationKind, string> = {
  electrical_connection: "Electrical connection",
  signals_to: "Signals to",
  mechanical: "Mechanical",
  references: "References",
  contains: "Contains",
  depends_on: "Depends on",
};

export function ObjectRelationsCard({
  relations,
}: {
  relations: RelationDisplayItem[];
}) {
  const hasRelations = relations.length > 0;
  return (
    <ObjectSection
      title="Relations"
      description="Physical, logical, and procedural dependencies for the object."
    >
      {hasRelations ? (
        <ul className="space-y-3 text-sm">
          {relations.map((relation) => (
            <li
              key={relation.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2"
            >
              <div>
                <p className="font-medium text-foreground">
                  {relation.relatedObject
                    ? relation.relatedObject.title
                    : relation.relatedObjectId
                    ? `Object #${relation.relatedObjectId}`
                    : "Unknown object"}
                </p>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  {relationLabels[relation.relationKind]}
                </p>
              </div>
              <Badge variant="outline">
                {relation.direction === "incoming" ? "Input" : "Output"}
              </Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">
          No relations have been defined yet. Use the relationship editor to
          visualise dependencies across the SCADA model.
        </p>
      )}
    </ObjectSection>
  );
}
