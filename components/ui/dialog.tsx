"use client";
import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Lightweight modal — no Radix dep. Closes on backdrop click + Escape.
export function Dialog({ open, onClose, title, children, className }: {
  open: boolean; onClose: () => void; title?: string; children: React.ReactNode; className?: string;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={cn("relative z-10 w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg animate-fade-up", className)}>
        {title && <h2 className="mb-4 text-lg font-semibold tracking-tight">{title}</h2>}
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}
