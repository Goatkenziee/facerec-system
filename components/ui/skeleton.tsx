import { cn } from "@/lib/utils";

// Skeleton loader — use for every data-loading region so nothing pops in blank.
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}
