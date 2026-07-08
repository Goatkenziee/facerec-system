import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card";

export function StatCard({ title, value, icon, trend, className }: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { direction: "up" | "down"; label: string };
  className?: string;
}) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{title}</p>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        <p className="mt-1 text-2xl font-bold">{value}</p>
        {trend && (
          <p className={cn("mt-1 text-xs", trend.direction === "up" ? "text-emerald-400" : "text-red-400")}>
            {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
