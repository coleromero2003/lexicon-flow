import { Badge } from "@/components/ui/badge";
import type { ObjectPriority } from "@/lib/supabase/models";
import { ObjectSection } from "./object-section";

interface ObjectMetadataCardProps {
  assignee: string | null;
  createdAt: string;
  updatedAt: string;
  dueDate: string | null;
  priority: ObjectPriority;
  metadata: Record<string, unknown> | null;
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function ObjectMetadataCard({
  assignee,
  createdAt,
  updatedAt,
  dueDate,
  priority,
  metadata,
}: ObjectMetadataCardProps) {
  const metadataEntries = metadata
    ? Object.entries(metadata).map(([key, value]) => {
        const displayValue =
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"
            ? String(value)
            : JSON.stringify(value, null, 2);
        return {
          key,
          value: displayValue,
          multiline: displayValue.includes("\n"),
        };
      })
    : [];

  return (
    <ObjectSection
      title="Operational metadata"
      description="Key ownership and lifecycle details for this object."
    >
      <dl className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">Assignee</dt>
          <dd className="font-medium text-foreground">
            {assignee ?? "Unassigned"}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">Due date</dt>
          <dd className="font-medium text-foreground">
            {dueDate ? formatDate(dueDate) : "No due date"}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">Created</dt>
          <dd className="font-medium text-foreground">{formatDate(createdAt)}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">Last updated</dt>
          <dd className="font-medium text-foreground">{formatDate(updatedAt)}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">Priority</dt>
          <dd>
            <Badge>{priority.toUpperCase()}</Badge>
          </dd>
        </div>
      </dl>
      <div className="mt-6">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Custom metadata
        </h4>
        {metadataEntries.length ? (
          <ul className="mt-3 space-y-2 text-sm">
            {metadataEntries.map((entry) => (
              <li
                key={entry.key}
                className="rounded-md border border-dashed border-border/70 px-3 py-2"
              >
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  {entry.key}
                </p>
                {entry.multiline ? (
                  <pre className="text-foreground whitespace-pre-wrap text-xs">
                    {entry.value}
                  </pre>
                ) : (
                  <p className="text-foreground font-medium">{entry.value}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            No custom metadata recorded for this object.
          </p>
        )}
      </div>
    </ObjectSection>
  );
}
