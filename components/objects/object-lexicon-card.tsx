import type { LexiconItem } from "@/lib/supabase/models";
import { ObjectSection } from "./object-section";

const typeLabels: Record<LexiconItem["type"], string> = {
  part: "Part",
  workflow_template: "Workflow template",
  step_template: "Step template",
  document: "Document",
  spec: "Specification",
  client: "Client",
};

export function ObjectLexiconCard({
  items,
}: {
  items: LexiconItem[];
}) {
  const hasItems = items.length > 0;
  return (
    <ObjectSection
      title="Linked lexicon"
      description="Reusable templates and references associated with this object."
    >
      {hasItems ? (
        <ul className="space-y-3 text-sm">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-border/70 px-3 py-2"
            >
              <p className="font-medium text-foreground">{item.name}</p>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">
                {typeLabels[item.type]}
              </p>
              {item.sku ? (
                <p className="text-muted-foreground text-xs">SKU: {item.sku}</p>
              ) : null}
              {item.manufacturer ? (
                <p className="text-muted-foreground text-xs">
                  Manufacturer: {item.manufacturer}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">
          No lexicon items linked. Attach parts, templates, or documents to
          standardise delivery.
        </p>
      )}
    </ObjectSection>
  );
}
