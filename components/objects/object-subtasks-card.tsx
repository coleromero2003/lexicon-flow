import type { ObjectSubtask } from "@/lib/supabase/models";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { ObjectSection } from "./object-section";

export function ObjectSubtasksCard({
  subtasks,
}: {
  subtasks: ObjectSubtask[];
}) {
  const hasSubtasks = subtasks.length > 0;
  const sorted = [...subtasks].sort((a, b) => a.sort_order - b.sort_order);
  return (
    <ObjectSection
      title="Subtasks"
      description="Execution steps that track work required to deliver this object."
    >
      {hasSubtasks ? (
        <ul className="space-y-3 text-sm">
          {sorted.map((subtask) => (
            <li
              key={subtask.id}
              className="flex items-center gap-3 rounded-lg border border-border/70 px-3 py-2"
            >
              {subtask.is_done ? (
                <CheckCircle2 className="text-emerald-500 h-5 w-5" />
              ) : (
                <CircleDashed className="text-muted-foreground h-5 w-5" />
              )}
              <span
                className={subtask.is_done ? "text-muted-foreground line-through" : "text-foreground"}
              >
                {subtask.title}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">
          No subtasks have been added. Break the object down into commissioning
          tasks to track completion readiness.
        </p>
      )}
    </ObjectSection>
  );
}
