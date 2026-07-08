# Architecture

Assembled from the YouMe Production Library — a consistent, production-grade base.

## Folders
- `app/`         — routes (App Router). Pages compose from components, never inline everything.
- `components/ui/`     — design-system primitives (Button, Card, Input, Table, Dialog, Tabs, Toast…). Do not restyle these ad-hoc.
- `components/layout/` — AppShell, PageHeader, Container.
- `components/states/` — Empty, Error, Loading/Skeleton. Every data region uses these.
- `features/`    — feature modules (one folder per domain feature).
- `lib/`         — utils (cn, formatters), clients, helpers.
- `hooks/`       — reusable React hooks.
- `types/`       — shared TypeScript types.

## Rules
1. One visual language: use the design tokens (globals.css `:root`) and `components/ui` — no random gradients, no one-off inline colors, no mismatched font sizes.
2. Set a BESPOKE palette in `globals.css` for this product (never the neutral default, never purple).
3. Every list/table/async region renders Loading → (Empty | Error | Data). No blank flashes.
4. Type-safe: no `any` where a real type is obvious. Strict mode on.
5. Accessible: labels on inputs, focus-visible rings, semantic elements, aria on icon-only buttons.
