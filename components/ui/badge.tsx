import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "warning" | "destructive" | "outline";
const tones: Record<Tone, string> = {
  default: "bg-muted text-muted-foreground",
  success: "bg-success/12 text-success",
  warning: "bg-warning/14 text-warning",
  destructive: "bg-destructive/12 text-destructive",
  outline: "border border-border text-foreground",
};

export function Badge({ tone = "default", className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone], className)} {...props} />;
}
