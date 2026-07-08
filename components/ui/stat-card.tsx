import * as React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, delta, up, icon }: {
  label: string; value: string; delta?: string; up?: boolean; icon?: React.ReactNode;
}) {
  return (
    <Card className="animate-fade-up">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          {icon && <span className="text-muted-foreground">{icon}</span>}
        </div>
        <div className="mt-2 flex items-end justify-between">
          <span className="text-3xl font-semibold tracking-tight tabular-nums">{value}</span>
          {delta && (
            <span className={cn("flex items-center gap-1 text-sm font-medium", up ? "text-success" : "text-destructive")}>
              {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}{delta}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
