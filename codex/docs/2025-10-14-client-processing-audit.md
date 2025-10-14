---
title: Client Processing Audit
date: 2025-10-14
owner: @evocoder
review_cadence: quarterly
status: active
related:
  tickets: [TKT-0001, TKT-0002, TKT-0003, TKT-0004, TKT-0005, TKT-0006]
  prs: []
audience: internal-only
---

The team is shifting workload off the browser; this audit catalogues the highest-impact client-side processing hotspots and recommends where server execution will improve perceived performance and reliability.

## Scope & Method

- Reviewed client bundles that depend on `react-query` or bespoke fetch loops to hydrate core experiences.
- Traced `fetchAllPages`, CSV parsing, and other CPU-heavy helpers that run in the browser.
- Prioritised surfaces by breadth of usage, data volume, and susceptibility to network latency or throttling.

## Ranked Findings

### 1. Brain feed and wave pipelines (highest impact)
- **Current behaviour:** The MyStream shell streams data via `useMyStreamQuery` and `usePollingQuery`, issuing infinite queries, prefetches, and 5 s polling from the browser (`components/brain/my-stream/MyStreamWrapper.tsx:63`, `hooks/useMyStreamQuery.ts:24-114`). Downstream, wave message state merges and retry logic execute on the client (`contexts/wave/utils/wave-messages-utils.ts:27-218`, `contexts/wave/hooks/useWaveMessagesStore.ts:72-194`), while sidebars fetch wave metadata and logs with additional `react-query` hooks.
- **Why move server-side:** Hydrating the feed requires multiple network calls before content appears, triggering redundant polling and large JSON payloads. Users on slower devices spend time running merge queues and dropout reconciliation, and every tab open duplicates the same work.
- **Recommended migration:** Render the first page(s) of feed and active wave data in server components that call the REST API with the user's credentials. Stream incremental updates to the client via Server Components or server-sent events, leaving the browser responsible only for UI state and websocket playback. Consolidate eligibility/merge logic into an API layer so clients consume pre-shaped payloads.
- **Dependencies / blockers:** Requires authenticated fetch support within Next.js `app/` routes and coordination with websocket subscription flows. Ensure telemetry is available server-side for feature gating.
- **Follow-up ticket:** TKT-0002 – Server-side hydrate brain and wave pipelines.

### 2. Collection analytics surfaces (MemeLab, 6529 Gradient, timelines)
- **Current behaviour:** Art collection pages download entire datasets with `fetchAllPages` and then sort/filter in React (`components/memelab/MemeLab.tsx:471-505`, `components/6529Gradient/6529Gradient.tsx:62-96`, `components/the-memes/MemePageTimeline.tsx:19-32`). Sorting, distinct list construction, and chart preparation all run on the client for every visitor.
- **Why move server-side:** Fetching thousands of records and performing O(n log n) sorts per visitor causes long loading spinners and high memory use, especially on mobile. Because the data changes infrequently, recomputing it per request is wasteful.
- **Recommended migration:** Shift aggregation to server handlers (Next.js route handlers or edge functions) that return pre-sorted slices and derived metrics. Cache popular queries (e.g., top artists, TDH rankings) and stream results into lightweight server components with pagination to avoid megabyte-sized payloads.
- **Dependencies / blockers:** Need to design caching/invalidations for rapidly changing metrics (e.g., floor price). Consider background jobs to precompute aggregates.
- **Follow-up ticket:** TKT-0003 – Server aggregate collection analytics surfaces.

### 3. CSV mapping tools (Delegation & Consolidation)
- **Current behaviour:** Tools read user-uploaded CSVs, then download full delegation or consolidation datasets with `fetchAllPages` before merging client-side (`components/mapping-tools/DelegationMappingTool.tsx:20-152`, `components/mapping-tools/ConsolidationMappingTool.tsx:23-175`). The browser parses files, iterates over large arrays, and generates outbound CSVs synchronously.
- **Why move server-side:** Large CSVs stall the UI and can exceed memory limits, while repeated API pagination from browsers stresses the public API and is hard to secure. The logic also exposes business rules (address matching, fallbacks) that should live server-side.
- **Recommended migration:** Provide signed upload endpoints that ingest the CSV, perform lookups, and return a processed artifact (or email a download link). Parallelise lookups on the server and throttle API usage centrally. Keep the client limited to upload progress and result display.
- **Dependencies / blockers:** Requires file-processing infrastructure (queue or worker) and authentication for long-running jobs. Ensure a download UX remains available for power users.
- **Follow-up ticket:** TKT-0004 – Offload CSV mapping tools to server pipelines.

### 4. Notifications and activity polling loops
- **Current behaviour:** Notification drawers and wave activity logs continuously poll REST endpoints using `useInfiniteQuery` and `refetchInterval` timers (`hooks/useNotificationsQuery.tsx:77-147`, `hooks/useWaveActivityLogs.ts:25-127`). Prefetchers bootstrap several pages ahead, so each browser tab maintains parallel polling streams.
- **Why move server-side:** Polling wastes bandwidth, drains batteries, and scales poorly with concurrent users. Each tab rehydrates and filters identical data even when nothing changed.
- **Recommended migration:** Transition to server-driven pushes (websocket fan-out or server-sent events) and compute diff logic server-side. Alternatively, expose a consolidated `/stream` endpoint the server component consumes and hydrates into context without repeated polling.
- **Dependencies / blockers:** Depends on revamping notification infrastructure and ensuring authentication tokens are available to server processes.
- **Follow-up ticket:** TKT-0005 – Replace notification polling with server-driven delivery.

### 5. Media and IPFS upload orchestration
- **Current behaviour:** Large file uploads chunk, retry, and handle MIME inference in the browser (`components/waves/create-wave/services/multiPartUpload.ts:48-195`, `components/ipfs/IPFSService.ts:24-68`). Axios manages PUTs to presigned URLs; errors surface late to the user.
- **Why move server-side:** Processing large files in-browser ties up memory, makes progress unreliable on throttled networks, and lacks centralized enforcement (virus scanning, quotas). Re-implementing chunk retries in every client platform is brittle.
- **Recommended migration:** Move chunk management to a signed server endpoint that streams uploads into storage (or uses Upload Part Copy). Expose resumable upload tokens so the client only handles file selection and progress UI. Run validation and content-type detection server-side.
- **Dependencies / blockers:** Requires storage gateway adjustments and potentially larger server egress budgets. Must protect against uploading untrusted files.
- **Follow-up ticket:** TKT-0006 – Centralise media and IPFS upload orchestration.

## Suggested Next Steps

- Define ownership for each migration track and capture sequencing in the roadmap (TKT-0002 through TKT-0006).
- Prototype server-side feed hydration in a single route to validate authentication and caching strategy.
- Instrument current payload sizes and latency to set success metrics for each migration.

## Backlinks

- TKT-0001 – Audit client-side processing for server migration
- TKT-0002 – Server-side hydrate brain and wave pipelines
- TKT-0003 – Server aggregate collection analytics surfaces
- TKT-0004 – Offload CSV mapping tools to server pipelines
- TKT-0005 – Replace notification polling with server-driven delivery
- TKT-0006 – Centralise media and IPFS upload orchestration
