import type { ScadaObject } from "@/lib/supabase/models";

type PriorityBadgeProps = {
  priority: ScadaObject["priority"];
};

/**
 * Displays a priority badge with appropriate styling.
 *
 * @param priority - The priority level (low, medium, high, urgent)
 */
export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const styles: Record<ScadaObject["priority"], string> = {
    low: "bg-green-100 text-green-700",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-amber-100 text-amber-700",
    urgent: "bg-red-100 text-red-700",
  };

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${styles[priority]}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}
