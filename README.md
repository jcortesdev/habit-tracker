# Habit Tracker

> Offline-first habit tracker with a GitHub-style yearly heatmap. Built as a real PWA — installable, survives airplane mode, no backend.

![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/-Next.js_15-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![Tailwind](https://img.shields.io/badge/-Tailwind_CSS-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white)
![Dexie](https://img.shields.io/badge/-Dexie-FE5196?style=flat-square)
![PWA](https://img.shields.io/badge/-PWA-5A0FC8?style=flat-square&logo=pwa&logoColor=white)

**Live demo:** `demo-habits.jcortes.dev` *(deploys at Module 5 — currently in progress)*

---

## Why this project

Most habit-tracker tutorials are thin wrappers over a TODO list and a server. This one inverts the constraints: **no server, no auth, no sync**. The data layer is IndexedDB. The heatmap is hand-built with D3 utilities. Everything works on a plane.

Three things this project tries to do well:

1. **Offline-first as a real constraint, not a label.** Every interaction goes through Dexie. The app loads, mutates, and renders without a network round-trip. A service worker precaches the shell so first-paint also works offline.
2. **A custom GitHub-style heatmap, built from scratch with `d3-scale` + `d3-time-format`.** No `nivo`, no `recharts`. The point is showing I can compose SVG, scales, and date formats directly — not gluing chart props together.
3. **PWA install + offline scored on Lighthouse.** Installable on Chrome / Edge desktop and Android. Verified by running the production build in airplane mode end-to-end.

### Why Next.js for an offline-first app?

Counter-intuitive on the surface — Next.js is famous for SSR and server components, and this project has neither. The reasons it still earns its weight:

- **App Router gives clean static export** for the few pages this project needs (heatmap, settings, about) without bringing in a separate router.
- **Vercel deploy is first-class** and gives the production-grade headers a PWA needs (cache, manifest, service worker scope) without manual config.
- **Image and font handling** are solved out of the box — important for the install icon set and the heatmap's tooltip font.
- **Future-proof.** If this app ever grew a sync layer, Server Actions and Route Handlers are right there.

See [`docs/DECISIONS.md`](./docs/DECISIONS.md) — ADR-001 (Dexie over a backend) and ADR-002 (Next.js over Vite here) cover the full reasoning.

## Features

- 📅 **GitHub-style yearly heatmap**, 365 cells, intensity-scaled, hand-rendered SVG via D3 utilities
- 🔁 **Per-habit drilldown** — click a habit to see its own heatmap; click again for the aggregated view
- ✅ **One-tap toggle** for today, with the current streak rendered inline
- 💾 **IndexedDB persistence** via Dexie — your data never leaves the device
- ✈️ **Real offline support** — installs as a PWA, works in airplane mode, survives a reload
- ⌨️ **Full keyboard navigation** across the heatmap with `aria-label` per cell
- 🌙 **Dark mode** with system preference fallback and anti-FOUC inline script
- 📱 **Responsive** from 320px upward
- ♿ **WCAG 2.1 AA** — `axe-core` runs against the rendered page in CI

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js 15** (App Router) | Static export + Vercel PWA headers + room to grow |
| UI library | **React 19** | Stable in Next 15 |
| Language | **TypeScript** (strict mode) | Type safety end-to-end, including Dexie schema |
| Styling | **Tailwind CSS v4** | Native CSS variables, no PostCSS config |
| Data | **Dexie** (IndexedDB wrapper) | Lightweight, typed, survives reload, offline-first |
| Visualization | **D3 utilities** (`d3-scale`, `d3-time-format`) | Compose scales + SVG directly, no chart library |
| PWA | **next-pwa** (or vanilla service worker if compat blocks) | Installable, offline shell precache |
| State | **`useState` + Dexie live queries** | No global store |
| Testing | **Vitest** + **Playwright** + **`@axe-core/playwright`** + **`fake-indexeddb`** | Unit + integration + E2E + a11y |
| Linting | **Biome** | Replaces ESLint + Prettier in one tool |
| Hosting | **Vercel** | Static deploy, edge CDN, PWA headers |

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the deeper rationale.

## Local development

**Requirements:** Node.js 20+ and pnpm 9+.

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Other scripts (land in Module 1 alongside the scaffold):

```bash
pnpm build        # production build (Next.js)
pnpm start        # serve the production build
pnpm test         # unit tests (Vitest)
pnpm test:e2e     # end-to-end tests (Playwright + axe)
pnpm check        # Biome (lint + format)
```

## Project structure (planned)

```
app/
├── layout.tsx               # root layout, theme provider, manifest link
├── page.tsx                 # home: habit list + aggregated heatmap
├── globals.css              # Tailwind v4 import + design tokens
└── ...                      # additional routes as needed (settings, about)
components/                  # flat list, co-located tests, no barrels
├── habit-row.tsx
├── habit-list.tsx
├── heatmap.tsx              # the D3 SVG
├── theme-toggle.tsx
└── ...
lib/
├── db.ts                    # Dexie client + schema
├── habits.ts                # pure helpers (addHabit, toggleEntry, getStreak)
├── year-map.ts              # date → count aggregation for the heatmap
├── color-scale.ts           # D3 scale wrapper
└── use-theme.ts             # light/dark helpers
public/
└── icons/                   # PWA icons (real ones in Module 5)
```

## Architecture decisions

Key trade-offs documented in [`docs/DECISIONS.md`](./docs/DECISIONS.md) as lightweight ADRs:

1. Why Dexie (IndexedDB) instead of a backend
2. Why Next.js for an offline-first app (and not Vite)
3. Why D3 utilities instead of a chart library
4. Why no global state library
5. Why Tailwind v4
6. Why pnpm over npm

## Performance and accessibility

Targets (verified in Module 5):

- Lighthouse PWA audit ≥ 90
- Lighthouse Performance ≥ 90 on desktop, ≥ 80 on mobile
- `@axe-core/playwright` — 0 violations on the rendered page
- Installable on Chrome / Edge desktop and Android
- Works end-to-end in airplane mode after first install

Honest note: these are aspirational until Module 5 lands. The current state is documented in the private progress tracker.

## What I'd do differently in production

This is a portfolio demo. At production scale I would:

- **Add a sync layer.** Conflict-free replicated data types (CRDTs) or a server-backed sync to allow multi-device habit tracking. The current scope deliberately stops at single-device because that's where the "no server" constraint shines.
- **Add notifications.** PWA push needs VAPID keys, a server to send pushes from, and a service-worker push handler. The demo value is small for now; the cost of operating a notifications service is high.
- **Move the heatmap to a worker** if the dataset grew beyond a few years. For 365 cells × dozens of habits, the main thread is comfortable.
- **Error monitoring (Sentry) and Web Vitals reporting.**

## Status

In progress — Module 0 (foundation). See the modules in [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the full roadmap.

## License

MIT — see [LICENSE](./LICENSE)

---

Built by [Josue Cortes](https://jcortes.dev) as part of a frontend engineering portfolio. Find me on [GitHub](https://github.com/jcortesdev) and [LinkedIn](https://linkedin.com/in/rjosuecortes).
