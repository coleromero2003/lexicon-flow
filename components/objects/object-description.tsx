import { ObjectSection } from "./object-section";

interface ObjectDescriptionProps {
  html: string | null;
}

export function ObjectDescription({ html }: ObjectDescriptionProps) {
  return (
    <ObjectSection
      title="Description"
      description="Context and operational notes captured for this object."
    >
      {html ? (
        <div
          className="space-y-4 text-sm leading-relaxed text-foreground"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <p className="text-muted-foreground text-sm">
          No description has been added yet. Use the workflow editor to capture
          engineering context and change history.
        </p>
      )}
    </ObjectSection>
  );
}
