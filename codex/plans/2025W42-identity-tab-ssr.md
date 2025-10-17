# 2025W42 – Identity Tab SSR Roadmap

**Window:** 2025-10-15 → 2025-11-29  
**Facilitator:** openai-assistant  
**Goals:** Maximise server-rendered coverage for the profile identity tab while preserving interactive flows, reducing client-side waterfalls, and providing a clear incremental path for engineering and QA.

## Background Snapshot

- Identity tab now streams statements, raters, and activity logs directly from `app/[user]/identity/page.tsx`, using cached fetch promises and Suspense to feed `UserPageIdentityHydrator`.
- Most render surfaces under `components/user/identity/**` remain `"use client"` because they own interactive flows (statements CRUD, rating controls, filters).
- Widgets like `ProfileActivityLogs` and `ProfileRatersTableWrapper` read streamed `initialData`, then fall back to client pagination/filtering logic after hydration.
- Outstanding gaps:
  - `ProfileActivityLogsItem.tsx` retains an `assertUnreachable` branch that could break when new log types arrive.
  - Streaming utilities live inline inside the page, limiting reuse and making it harder to share cache hints across tabs.
  - Only a single happy-path SSR test validates the streaming payload; no regression tests cover duplicate fetch prevention or error states.
- Delivery tracked via TKT-0010 (umbrella) with phase tickets TKT-0011–TKT-0013.

## Phase Plan

### Phase 1 – Stabilise streaming data orchestration (1 sprint, ✅ complete)

- **Scope:**
  - Centralise identity-tab data prep inside the page with shared helpers (`createIdentityTabParams`, `createResource`) that normalise params, wrap fetches in server-timing instrumentation, and fall back safely on failure.
  - Wire Suspense boundaries so statements, raters, and logs stream independently while `UserPageIdentityHydrator` seeds React Query with streamed payloads.
  - Capture architecture in docs and keep SSR integration tests verifying layout props, hydrator payloads, and skeleton fallbacks.
- **Deliverables:**
  - Inline streaming utilities with cache-aware fetchers and graceful error handling.
  - Jest integration coverage for the streaming pipeline.
  - Updated Identity tab documentation describing the server-to-client flow.
- **Dependencies:** None beyond existing APIs.
- **Risks & Mitigations:** Inline helpers could drift—document conventions and share types to minimise divergence.
- **Success Metrics:** Single server pass hydrates initial data with no duplicate client fetches (verified in tests); lint/test baselines stay green.

### Phase 2 – Server-first read-only shells (1–2 sprints)

- **Scope:**
  - Elevate read-only sections into server components that consume the streamed payloads while leaving interactive controls client-side.
    - Wrap `UserPageIdentityHeader` analytics in a server component with a dynamically imported rate CTA.
    - Render statements and raters via server shells that output HTML for page one, then hand off to existing client controllers for CRUD/pagination.
    - Refactor activity log rendering to remove `assertUnreachable` and provide resilient defaults for unknown log types.
  - Replace React Query hydration with direct props where possible to reduce client work.
- **Deliverables:**
  - New server shells under `app/[user]/identity/_components` (or equivalent) composed with Suspense boundaries around interactive pieces.
  - Updated tab wiring demonstrating clean server/client boundaries.
  - Regression tests covering server-rendered HTML, pagination hand-off, and log-type fallbacks.
- **Dependencies:** Phase 1 streaming helpers; ensure client-only libraries remain behind dynamic imports.
- **Risks & Mitigations:** Potential bundle growth if dependencies leak—monitor bundle analysis and guard with lazy loading; validate streamed HTML size.
- **Success Metrics:** Above-the-fold HTML includes header, statements, and first-page tables; lab FCP improves ≥10% with identical data payloads.

### Phase 3 – Streaming, caching, and mutation harmonisation (2 sprints)

- **Scope:**
  - Layer route-level caching (`fetchCache`, `revalidateTag`, or segment-level `revalidatePath`) onto the streaming fetchers, tying invalidation to mutation success.
  - Introduce server actions (or thin API bridges) for statements CRUD and rater filters to enable progressive enhancement while preserving optimistic UI.
  - Expand telemetry around SSR execution time, cache hit ratio, hydration payload size, and mutation latency.
- **Deliverables:**
  - Cache strategy with documented invalidation hooks and instrumentation.
  - Server actions / mutation bridges with unit and integration coverage.
  - Monitoring dashboards or runbooks summarising new metrics.
- **Dependencies:** Feature flags for server action rollout; coordination with infra for cache storage and invalidation semantics.
- **Risks & Mitigations:** Mutation complexity risks regressions—maintain client fallbacks and add end-to-end coverage; ensure cache invalidation avoids thrash.
- **Success Metrics:** ≥80% repeat visits served from cache, mutation latency within SLA, ≥15% reduction in client JS execution time per Web Vitals.

## Cross-Cutting Tasks

- Update developer docs and runbooks to reflect new SSR boundaries and testing expectations.
- Keep TKT-0010 log in sync with phase progress; spin follow-up tickets per phase or component cluster.
- Engage QA and design for snapshot updates as server-rendered HTML may affect visual regression baselines.
