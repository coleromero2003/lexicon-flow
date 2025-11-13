import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  valueClassName?: string;
  variant?: "compact" | "default";
}

/**
 * Reusable stats card component
 * Displays metrics consistently across dashboard pages
 * Supports two variants: "default" (with icon) and "compact" (no icon)
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = "text-blue-600",
  iconBgColor = "bg-blue-100",
  valueClassName,
  variant = "default"
}: StatCardProps) {
  if (variant === "compact") {
    return (
      <Card>
        <CardHeader className="pb-2 pb-3">
          <CardDescription>{label}</CardDescription>
          <CardTitle className={cn("text-3xl", valueClassName)}>
            {value}
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-600 sm:text-sm">
              {label}
            </p>
            <p className={cn("text-xl font-bold text-gray-900 sm:text-2xl", valueClassName)}>
              {value}
            </p>
          </div>
          {Icon && (
            <div className={cn("rounded-full p-3", iconBgColor, iconColor)}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
