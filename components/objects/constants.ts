export const PRIORITIES = [
  { value: "low", label: "Low", color: "bg-green-500" },
  { value: "medium", label: "Medium", color: "bg-yellow-500" },
  { value: "high", label: "High", color: "bg-red-500" },
  { value: "urgent", label: "Urgent", color: "bg-red-600" },
] as const;

export type PriorityValue = typeof PRIORITIES[number]["value"];

export function getPriorityColor(priority: string) {
  const p = PRIORITIES.find((pr) => pr.value === priority);
  return p?.color || "bg-gray-500";
}
