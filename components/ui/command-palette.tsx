"use client";
import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Command { label: string; hint?: string; onSelect: () => void }

export function CommandPalette({ commands }: { commands: Command[] }) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  if (!open) return null;
  const filtered = commands.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[15vh]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-lg border border-border bg-card shadow-lg animate-fade-up">
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a command…"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        </div>
        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 && <p className="px-3 py-6 text-center text-sm text-muted-foreground">No commands</p>}
          {filtered.map((c, i) => (
            <button key={i} onClick={() => { c.onSelect(); setOpen(false); }}
              className={cn("flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted")}>
              <span>{c.label}</span>{c.hint && <span className="text-xs text-muted-foreground">{c.hint}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
