"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

export function CommandPalette({ open, onClose, items }: {
  open: boolean;
  onClose: () => void;
  items: { id: string; label: string; onSelect: () => void }[];
}) {
  const [query, setQuery] = React.useState("");
  const filtered = items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()));

  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-lg rounded-xl border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center border-b px-4">
          <Search className="h-4 w-4 text-muted-foreground mr-2" />
          <input
            autoFocus
            placeholder="Search commands..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 h-12 bg-transparent outline-none text-sm"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-2">
          {filtered.length === 0 && <p className="p-3 text-sm text-muted-foreground">No results.</p>}
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => { item.onSelect(); onClose(); }}
              className={cn(
                "w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
