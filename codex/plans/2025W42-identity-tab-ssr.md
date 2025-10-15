# 2025W42 – Identity Tab SSR Roadmap

**Window:** 2025-10-15 → 2025-11-29  
**Facilitator:** openai-assistant  
**Goals:** Maximise server-rendered coverage for the profile identity tab while preserving interactive flows, reducing client-side waterfalls, and providing a clear incremental path for engineering and QA.

## Background Snapshot

- Identity tab now prefetches statements, raters, and activity logs within `app/[user]/identity/page.tsx` and hydrates React Query via `UserPageIdentityHydrator`.
- Most render surfaces under `components/user/identity/**` are still marked `"use client"`, especially statements CRUD flows, header analytics, and raters tables.
- Widgets like `ProfileActivityLogs` and `ProfileRatersTableWrapper` accept `initialData`, but continue to rely on client pagination/filtering logic.
- Outstanding gaps:
  - `ProfileActivityLogsItem.tsx` retains an `assertUnreachable` branch that could blow up when new log types ship.
  - No regression or integration tests prove that the SSR-fed initial data keeps client widgets from re-fetching.
- Delivery tracked via TKT-0010 (umbrella) with phase tickets TKT-0011–TKT-0013.

## Phase Plan

### Phase 1 – Harden server data contract (1 sprint)

- **Scope:** 
  - Consolidate server helpers behind a deterministic module (e.g., `app/[user]/identity/queries.ts`) with typed return values and cache headers.
  - Ensure `createUserTabPage` `prepare` hook precomputes all params (statements, raters, logs) and normalises error/fallback states.
  - Audit React Query hydrations to verify keys and params line up (`QueryKey.PROFILE_CIC_STATEMENTS`, raters, activity logs) and remove redundant `useEffect` writes.
  - Add integration tests covering server-to-client data handoff (render page, assert no network calls until user interaction).
- **Deliverables:**
  - Refined fetch utilities with graceful failure defaults.
  - Jest/Playwright tests that capture SSR payload usage.
  - Updated documentation in `components/user/identity/README` (create if needed) describing data flow.
- **Dependencies:** Requires back-end endpoints to support batching or consistent caching headers; coordinate with API owners if additional fields are needed.
- **Risks & Mitigations:** Potential breakage if query keys change—feature flag toggles or fallbacks for legacy clients; keep existing client fetchers behind toggles until parity confirmed.
- **Success Metrics:** Zero redundant client fetches on initial load (verified via mocked network layer); type-check and lint clean.

### Phase 2 – Server-first read-only shells (1–2 sprints)

- **Scope:** 
  - Split static display components into server and client halves:
    - Convert `UserPageIdentityHeader` and subcomponents to server components that receive precomputed aggregates, leaving only interactive controls (e.g., rate buttons) client-side.
    - Render statements list server-side (`UserPageIdentityStatements` -> `IdentityStatementsServer`) and hydrate client controllers for create/update/delete modals.
    - Introduce server-rendered paginated shells for `ProfileRatersTableWrapper` and `UserPageIdentityActivityLog`, streaming first page HTML and exposing imperative hooks for filters.
  - Replace React Query hydration for read-only data with props when interaction is not required immediately.
  - Tighten typing around `ProfileActivityLogType` eliminating `assertUnreachable` by providing a resilient default view.
- **Deliverables:**
  - New server component shells under `app/[user]/identity/_components`.
  - Updated routing wiring (`IdentityTab`) leveraging `Suspense`/`HydrationBoundary` for client follow-ups.
  - Regression tests for header/stats rendering and pagination handoff.
- **Dependencies:** Phase 1 contract work; Requires ensuring client-only libraries (e.g., modals) stay isolated via dynamic imports.
- **Risks & Mitigations:** Increased bundle size if server/client boundaries blur—use webpack chunk reports and lazy-load client modals; validate streamed HTML size.
- **Success Metrics:** Server-rendered HTML contains above-the-fold identity header, statements, and first-page tables; FCP improves in lab runs (>10% reduction measured via Lighthouse or Web Vitals).

### Phase 3 – Streaming, caching, and mutation harmonisation (2 sprints)

- **Scope:** 
  - Introduce route-level caching for identity data (`fetchCache`, revalidate controls) with SWR-like invalidation tied to mutation success.
  - Implement progressive enhancement for statements CRUD: submit via server actions where possible, fall back to client mutation.
  - Adopt partial revalidation for raters/activity tables using server actions or `revalidateTag`.
  - Expand monitoring: add traces/logs around SSR execution time, cache hits, and hydration payload size.
- **Deliverables:**
  - Server actions (or API wrappers) for statements add/delete, raters filters.
  - Metrics dashboard entries or logs consumption guidelines.
  - Post-launch experiment showing reduced client script execution time.
- **Dependencies:** Feature flag strategy to roll out server actions gradually; coordination with infra for cache invalidation semantics.
- **Risks & Mitigations:** Mutation path complexity—ensure optimistic UI remains responsive; provide fallback to legacy client mutations for unsupported browsers.
- **Success Metrics:** 80%+ of identity page API calls served from edge/cache on revisit; mutation round trips within target SLA; measurement of ~15% reduction in client JS execution per Web Vitals.

## Cross-Cutting Tasks

- Update developer docs and runbooks to reflect new SSR boundaries and testing expectations.
- Keep TKT-0010 log in sync with phase progress; spin follow-up tickets per phase or component cluster.
- Engage QA and design for snapshot updates as server-rendered HTML may affect visual regression baselines.
