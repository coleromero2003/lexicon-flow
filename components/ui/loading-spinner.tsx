"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  label?: string;
  className?: string;
  iconClassName?: string;
}

export function LoadingSpinner({
  label = "Loading...",
  className,
  iconClassName,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-muted-foreground",
        className
      )}
    >
      <Loader2
        aria-hidden="true"
        className={cn("h-10 w-10 animate-spin", iconClassName)}
      />
      {label ? (
        <p className="text-sm font-medium text-center text-foreground">{label}</p>
      ) : null}
    </div>
  );
}
