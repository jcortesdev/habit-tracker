# Architecture

This document explains the technical structure and key design decisions of the project. It is intentionally short and focused — for individual trade-offs see [`DECISIONS.md`](./DECISIONS.md).

## High-level overview

```
┌──────────────────────────────────────────────────────────┐
│                Next.js build (webpack, compile time)              │
│  ┌────────────────────────────────────────────────────┐  │
│  │  TypeScript → ESM → tree-shake → minify            │  │
│  │  Tailwind   → purge → minify                       │  │
│  │  Static export (no SSR, no route handlers)         │  │
│  │  Service worker + manifest emitted alongside       │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                            │
                            ▼
                   Vercel Edge Network
                   ├─ Static HTML / JS / CSS (cached, immutable)
                   ├─ Service worker registered at /sw.js
                   └─ Manifest at /manifest.json
                            │
                            ▼
┌──────────────────────────────────────────────────────────┐
│                       Browser                             │
│  ┌────────────────────────────────────────────────────┐  │
│  │  React mounts on first paint                       │  │
│  │  Service worker precaches the app shell            │  │
│  │  Dexie opens IndexedDB → reads habits + entries    │  │
│  │  Heatmap renders SVG from year-map aggregation     │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Rendering strategy

This is a **client-rendered app shipped via Next.js static export**, with one important constraint: **no server, no route handlers, no Server Actions**. The whole project runs in the browser.

- Pages are statically exported. The HTML is meaningful enough for crawlers and link previews — title, description, OG tags, manifest reference.
- React mounts client-side and Dexie takes over the data layer immediately.
- There are no API routes. There is no backend. Adding either would violate ADR-001.

In a production multi-device app this approach wouldn't scale — you'd need a sync server, conflict resolution, and probably auth. For a single-device portfolio demo, IndexedDB on the client is enough and the constraint is the point.

## Data layer

**Dexie** is the single source of truth on the client. Two object stores:

```ts
interface Habit {
  id: string;          // uuid v4
  name: string;
  color: string;       // hex from a small palette
  createdAt: number;   // epoch ms — used for default sort
}

interface Entry {
  id: string;
  habitId: string;
  date: string;        // YYYY-MM-DD, indexed for fast yearly aggregation
}
```

Two layers sit on top:

1. **`lib/db.ts`** — the Dexie client. Declares stores, indexes, and migrations. Nothing else.
2. **`lib/habits.ts`** and friends — **pure helper functions** that take plain arrays and return plain arrays. These are the testable surface. They don't touch IndexedDB; the React layer reads from Dexie and passes arrays in.

Why separate the two? Because unit-testing helpers that take arrays needs nothing — no `fake-indexeddb`, no async setup, no flakiness. The one place we test Dexie integration directly (schema, indexes, migrations) gets a single integration test with `fake-indexeddb` and that's enough.

## PWA layer

The app is a real PWA, verified by:

- A `manifest.json` declaring name, icons, start URL, display mode (`standalone`), and theme color.
- A service worker that precaches the app shell (HTML, JS, CSS, icon set) and serves it cache-first when offline.
- Install criteria met on Chrome / Edge desktop and Android (Lighthouse PWA audit ≥ 90).
- An end-to-end check in Module 5: load the app once online, switch to airplane mode, reload, mark a habit, reload again — data persists, UI works.

The service worker uses **Serwist** (`@serwist/next`), the actively-maintained successor to `next-pwa`. It compiles a Workbox-based service worker from `src/app/sw.ts` and emits `public/sw.js` at build time. Serwist needs webpack (not Turbopack) for the SW build, so dev and build scripts pass `--webpack` to Next.

## Visualization (the heatmap)

The yearly heatmap is hand-built with D3 utilities — **no chart library**.

- `d3-scale` builds a sequential color scale from a habit's completion intensity.
- `d3-time-format` formats ISO dates and labels weekdays / months.
- The SVG is rendered by React (not by D3's DOM helpers) — React owns the tree, D3 owns the math.

```ts
const colorScale = scaleSequential(interpolateGreens).domain([0, maxCount]);
const cell = (date: Date, count: number) => ({
  x: weekOfYear(date) * cellSize,
  y: dayOfWeek(date) * cellSize,
  fill: count === 0 ? 'var(--surface-2)' : colorScale(count),
});
```

The same renderer drives two views via one parameter:

- `habitId === null` → aggregated across all habits.
- `habitId === '<uuid>'` → that habit's heatmap, drilled in.

Hover and tap reveal a tooltip with the date and count. Keyboard navigation moves a focus ring through cells; each cell carries an `aria-label` like *"2026-04-12 — 2 habits completed"*.

## State management

No state library. The page has three pieces of UI state:

1. **Selected habit (or aggregated)** → `useState` in the top-level page.
2. **Theme** → `useState` mirrored to `localStorage` via a tiny hook, anti-FOUC inline script in the layout.
3. **Habits + entries** → Dexie. Components subscribe via `useLiveQuery` (Dexie's React hook) so toggles re-render automatically.

There is no "global cart" equivalent and no derived state worth memoizing into a store. If that changes, we revisit — but not preemptively.

## Animation strategy

**Native CSS only**, with `prefers-reduced-motion` respected via Tailwind's `motion-reduce:` utility. The list of animations is small:

- Heatmap cell hover — `opacity` + `outline` transitions.
- Tooltip enter/exit — fade + small translate.
- Habit row toggle — checkmark scale-in.

No animation library is installed. If Module 4 or 5 needs orchestrated layout animation we revisit, but every case so far has been declarative.

## Testing strategy

| Layer | Tool | What we test |
|-------|------|--------------|
| Unit | Vitest | Pure helpers (`getStreak`, `getYearMap`, `toggleEntry` on plain arrays) |
| Integration | Vitest + `fake-indexeddb` | One test that exercises Dexie schema, indexes, and a migration |
| Component | Vitest + RTL | Heatmap renders correct cell counts, keyboard navigation, tooltip ARIA |
| E2E | Playwright | Add habit → mark today → reload → persistence → see in heatmap |
| Offline | Playwright | Same flow under simulated offline / `serviceWorker` mode |
| Accessibility | `@axe-core/playwright` | Zero violations on the rendered page and the heatmap-focused state |
| Lighthouse | Local, on demand | Spot-check; no CI gate in this project |

We don't aim for 100% coverage. The pure helpers get exhaustive unit tests because they're the brain of the app; everything else gets high-confidence behavioral tests.

## Folder conventions

- **Co-location.** A component's test file lives next to the component file, not in a parallel `__tests__/` folder.
- **No barrel files.** Never create `index.ts` files that re-export from a folder. Always import the named file directly.
- **No `utils/` dump folder.** Every utility lives in a named module: `format-date.ts`, not `helpers.ts`.
- **`use-*` naming** for custom hooks, living in `lib/` alongside other small utilities (`use-theme.ts`, `use-live-habits.ts`), not in a separate `hooks/` folder.

## Module roadmap

The project ships in **five modules**, each producing something visible (with M0 as the only doc-only exception):

- **M0 — Foundation:** README, ARCHITECTURE, DECISIONS, LICENSE, `.gitignore`, repo.
- **M1 — Scaffolding + PWA shell:** Next.js scaffold, Biome, Vitest, Playwright, service worker, manifest, installable.
- **M2 — Data layer:** Dexie schema, pure helpers, unit + integration tests.
- **M3 — Core UI:** habit list, add / toggle / delete, streak indicator, mini 7-day bar, dark mode.
- **M4 — D3 heatmap:** 365-cell SVG grid, intensity scale, per-habit drilldown, keyboard navigation.
- **M5 — Polish + ship:** install banner, offline E2E, Lighthouse pass, real screenshots, deploy.
