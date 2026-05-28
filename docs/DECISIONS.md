# Architecture Decision Records (ADRs)

Lightweight records of architectural decisions. Each one is short on purpose: context, decision, consequences.

---

## ADR-001: Dexie (IndexedDB) instead of a backend

**Context:** A habit tracker is the canonical excuse to build a backend — users, auth, multi-device sync, push reminders. Every other tutorial does exactly that. The question for this project is whether a backend earns its weight when the goal is a portfolio demo, not a SaaS launch.

**Decision:** No server. No auth. No sync. The data layer is **Dexie** (a typed wrapper over IndexedDB), running entirely in the browser. The constraint is the demo: offline-first means *actually* offline-first, not "offline-tolerant when the server is reachable."

**Why a backend would be overkill here:**

- **No multi-device requirement.** A portfolio demo lives on one URL and gets opened in one tab at a time. Sync solves a problem the demo doesn't have.
- **No auth pressure.** Without users, there is no login, no session, no token rotation, no PII to protect, no GDPR posture to maintain.
- **No always-online assumption.** The whole point is that the app works on a plane. A backend by definition breaks that — the moment you need it, the offline story collapses to "we cache reads."
- **IndexedDB is enough.** Dexie gives typed object stores, indexes for fast date queries, transactions, and migrations. That's what habit data needs and nothing more.

**Why I would reach for a backend in a production version:**

- Multi-device sync (CRDTs or a server-mediated last-write-wins).
- Authentication and user accounts.
- Push notifications (which need VAPID keys + a sender).
- Sharing habits with a coach / partner.
- Long-term analytics across all users.

**Consequences:**

- ✅ The "offline-first" claim is real and provable in airplane mode.
- ✅ Zero operational cost — no server to run, no database to back up.
- ✅ Forces a clean separation between the Dexie client and pure helpers (helpers take arrays, return arrays), which makes the helpers trivial to unit-test.
- ⚠️ Data lives in the browser. Clearing site data wipes everything. The README is honest about this.
- ⚠️ No multi-device. Tradeoff accepted at this scope.

---

## ADR-002: Next.js for this project (not Vite)

**Context:** Aurora — the previous project in this portfolio — chose Vite over Next.js for a single static product page. The reasoning was sound for that scope. This project has different shape: it needs to be installable, it has a service worker, and it ships on Vercel where Next.js is first-class. The question is whether to stay loyal to Vite or pick the right tool for this scope.

**Decision:** Use Next.js 16 with the App Router. Static export (no SSR, no Server Actions, no Route Handlers). Hosted on Vercel.

**Why Next.js earns its weight here:**

- **Vercel PWA defaults.** Cache headers, manifest serving, service worker scope, immutable asset hashing — all of it is taken care of out of the box. Configuring this manually for a Vite app is doable but tedious and a recruiter doesn't see the difference.
- **Multi-page room to grow.** The current scope has one page, but Settings, About, and a per-habit drill-down route are realistic. App Router gives clean URL routing without bolting on a router library.
- **First-class image and font handling.** The PWA needs a full icon set (192, 384, 512, maskable). Next's static image handling makes this clean.
- **Stays consistent with the rest of the portfolio** — projects 3 and 4 are Next.js, so familiarity compounds.

**Why I picked Vite for Aurora and would pick it again there:**

- Aurora is a single static page with no PWA, no router, no service worker. Next.js would be overkill — the bundle savings and faster HMR genuinely matter at that scope.

The two decisions are not in conflict; they're *the same decision made on different inputs*. That's the point. Frameworks earn their weight context by context.

**Consequences:**

- ✅ PWA setup is mostly framework-driven, not hand-rolled.
- ✅ Future routes (settings, about, drill-down) are essentially free.
- ⚠️ Bundle is larger than the equivalent Vite shell. Acceptable cost for installability and routing room.
- ⚠️ Need to be careful not to drift into SSR or Server Actions — they would silently break the offline-first contract. ADR-001 governs.
- ⚠️ Next 16 defaults to Turbopack, but Serwist requires webpack to build the service worker. Dev and build run with `--webpack` until Serwist ships Turbopack support. Documented in [`ARCHITECTURE.md`](./ARCHITECTURE.md#pwa-layer).

---

## ADR-003: D3 utilities, not a chart library

**Context:** The heatmap is the project's visible differentiator. Several libraries (`nivo`, `recharts`, `visx`, `react-calendar-heatmap`) would render something approximating it in a few lines. The choice is between gluing a chart component together or composing scales, formats, and SVG directly.

**Decision:** Use only `d3-scale` and `d3-time-format`. Render the SVG with React. Build the cell layout, color scale, tooltip, and keyboard navigation by hand.

**Why this matters for the project:**

- **Showing composition, not configuration.** A chart library demo answers "can you read prop docs?" A hand-built heatmap answers "do you understand scales, SVG, and time formatting?" The second question is the one a senior frontend interviewer cares about.
- **Bundle savings.** `nivo` and `visx` bring substantial peer dependencies. `d3-scale` + `d3-time-format` together are under 5kb gzipped.
- **Full control over a11y.** Keyboard navigation across cells, `aria-label` per cell, focus management — chart libraries support some of this but rarely all of it cleanly.

**Why I would use a chart library elsewhere:**

- A dashboard with five different chart types where each one is configured once and never customized — `recharts` is the right answer.
- Production analytics where rendering speed and downsampling matter — `visx` or commercial libraries earn their weight.

**Consequences:**

- ✅ The heatmap demonstrates real skill, not API familiarity.
- ✅ Bundle stays small.
- ✅ Full ownership of behavior — every interaction is debuggable end-to-end.
- ⚠️ More code to write and maintain than `<Heatmap data={...} />`. That cost is the point.

---

## ADR-004: No global state library

**Context:** Many React projects reach for Zustand or Redux on day one. This project does not.

**Decision:** Local component state with `useState` for ephemeral UI. Dexie (via `useLiveQuery`) for habit data — it already subscribes components automatically. No store.

**Consequences:**

- ✅ Smaller bundle (saves 2-5kb).
- ✅ Clearer data flow — Dexie is the source of truth, useState handles UI.
- ✅ No "magic global" to chase when debugging.
- ⚠️ If the app grew to coordinate state across many distant components, we'd revisit. For this scope, prop-passing and Dexie subscriptions are enough.

---

## ADR-005: Tailwind v4

**Context:** Style choice has a large impact on velocity and consistency.

**Decision:** Tailwind CSS v4 with a custom design token layer in `app/globals.css`.

**Consequences:**

- ✅ No context switching between files when styling.
- ✅ Design tokens (colors, spacing, the heatmap palette) defined once and used as utility classes everywhere.
- ✅ Dead-CSS purging is automatic.
- ✅ Dark mode via the `dark:` prefix matches the anti-FOUC approach from Aurora.
- ⚠️ Class lists get long. We mitigate by extracting repeated patterns into components, not into CSS classes (Tailwind's recommended approach).

---

## ADR-006: pnpm over npm

**Context:** Package manager choice affects install speed, disk space, and CI duration.

**Decision:** pnpm.

**Consequences:**

- ✅ ~2x faster installs than npm in CI.
- ✅ Disk-efficient via content-addressable storage.
- ✅ Strict dependency resolution catches phantom dependencies.
- ⚠️ Some legacy tools assume npm. We have not hit this issue.
