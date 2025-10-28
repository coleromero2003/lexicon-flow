import type { RelationKind } from "@/lib/supabase/models";

export const PRIORITIES = [
  { value: "low", label: "Low", color: "bg-green-500" },
  { value: "medium", label: "Medium", color: "bg-yellow-500" },
  { value: "high", label: "High", color: "bg-red-500" },
  { value: "urgent", label: "Urgent", color: "bg-red-600" },
] as const;

export type PriorityValue = (typeof PRIORITIES)[number]["value"];

export function getPriorityColor(priority: string) {
  const p = PRIORITIES.find((pr) => pr.value === priority);
  return p?.color || "bg-gray-500";
}

export const RELATION_KIND_OPTIONS: Array<{
  value: RelationKind;
  label: string;
  description: string;
}> = [
  {
    value: "electrical_connection",
    label: "Electrical connection",
    description: "Use for power or signal wiring relationships.",
  },
  {
    value: "signals_to",
    label: "Signals to",
    description: "Indicates that the source object sends data to the target.",
  },
  {
    value: "mechanical",
    label: "Mechanical",
    description: "Represents a physical/mechanical dependency.",
  },
  {
    value: "references",
    label: "References",
    description: "For documentation or specification references.",
  },
  {
    value: "contains",
    label: "Contains",
    description: "Shows that the source encloses or groups the target.",
  },
  {
    value: "depends_on",
    label: "Depends on",
    description: "Marks a prerequisite or upstream dependency.",
  },
];
