"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface NavItem { label: string; href: string; icon?: React.ReactNode }

export function AppShell({ nav, brand, active, children }: {
  nav: NavItem[]; brand: React.ReactNode; active?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border md:flex">
        <div className="flex h-14 items-center px-5 font-semibold tracking-tight">{brand}</div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => (
            <a key={item.href} href={item.href}
              className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active === item.href ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              {item.icon}{item.label}
            </a>
          ))}
        </nav>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="flex-1 p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
