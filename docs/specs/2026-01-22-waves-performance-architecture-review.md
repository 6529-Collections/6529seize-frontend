---
title: Waves Performance Architecture Review (Discord-level Responsiveness)
version: 1.0
status: draft
created: 2026-01-22
tech_stack: Next.js 16, React 19, TanStack Query 5, TanStack Virtual 3, TailwindCSS 3.4
owners: FE Platform + Waves
---

# Waves Performance Architecture Review (Discord-level Responsiveness)

## Executive summary

Waves currently behaves like a “chat app with a social feed renderer”: it is doing *too much work on the main thread* on every update and it is rendering far more than what is visible. The jank is not primarily a “React is slow” problem; it’s an *architecture* problem across three layers:

1. **Rendering layer:** we build a React tree for (potentially) the entire wave and then attempt per-item “virtualization” (`components/waves/drops/VirtualScrollWrapper.tsx`). This still allocates React elements for every drop, creates per-drop IntersectionObservers/state, and introduces layout shifts when media loads. This is inherently incompatible with Discord-like smoothness for large histories.
2. **Data/model layer:** merges are expensive and scale poorly. `contexts/wave/utils/wave-messages-utils.ts` → `mergeDrops()` calls `getStableDropKey()` which can do hashing (`sha256`) and a scan across existing drops (`findClosestMatch`), and then we sort and allocate multiple intermediate arrays/maps. This becomes catastrophic when we reconcile “hours of new drops”.
3. **Fetching layer:** “jump to older serial” can trigger *many* network calls via `light-drops` pagination (`findLightDropBySerialNoWithPagination`, up to 20×2000 items) plus an “around” fetch. Background reconciliation (`syncNewestMessages`) can loop in 50-drop chunks until caught up; when the delta is large, this creates long pauses and massive merges.

### Proposed direction (what Discord does)
Move to a **timeline engine** model:

- **List-level virtualization** (TanStack Virtual) so we render only visible rows + overscan; no per-drop IntersectionObserver virtualization.
- **Serial-based identity** for drops (`waveId + serial_no`) to avoid hashing and to make light→full upgrades and updates stable.
- **Segmented message store** (ranges + gaps) and **seek mode** for jump-to-message, rather than scanning `light-drops`.
- **Bounded catch-up** on activation: render “latest window” immediately, then incrementally backfill in idle time; never do unbounded “fetch until caught up” on the UI thread.

This is a multi-ticket migration but can be de-risked with phased rollout and tight metrics.

---

## User-visible symptoms (as reported)

- “Slow and jumpy at times” while scrolling and while new messages arrive.
- “Particularly slow if you need to jump back to a post from the past.”
- “Particularly slow if the wave has added posts for several hours since you last had it active.”

These map cleanly to the bottlenecks below.

---

## Current architecture (brief, with code pointers)

### Data + realtime

- **Wave data store**: `contexts/wave/hooks/useWaveMessagesStore.ts`
  - Updates are queued and merged via `mergeDrops()` and then listeners are notified.
- **Pagination + around-serial fetch**: `contexts/wave/hooks/useWavePagination.ts`
  - `fetchNextPage()` supports `DropSize.FULL` and `DropSize.LIGHT` (targeted jump).
  - `fetchAroundSerialNo()` fetches `/waves/:id/drops` with `search_strategy=Both` and `serial_no_limit=...`.
- **Initial load + background reconciliation**:
  - `contexts/wave/hooks/useWaveDataFetching.ts` `activateWave()` loads the initial page.
  - `syncNewestMessages()` loops `fetchNewestWaveMessages()` in 50-drop chunks until caught up.
- **Realtime updates**:
  - `contexts/wave/hooks/useWaveRealtimeUpdater.ts` merges WebSocket drops then optionally triggers reconciliation.

### Rendering + scroll

- **Wave chat UI**: `components/waves/drops/wave-drops-all/index.tsx`
  - Uses `useScrollBehavior()` (flex-col-reverse scroll semantics) and `useWaveDropsSerialScroll()` for jump-to-serial.
  - Renders `DropsList` inside `WaveDropsReverseContainer` (top sentinel for pagination).
- **Drops list**: `components/drops/view/DropsList.tsx`
  - Reverses arrays and builds a full list of React elements via `.flatMap(...)`.
  - Wraps every drop in `VirtualScrollWrapper`.
- **Per-drop “virtualization”**: `components/waves/drops/VirtualScrollWrapper.tsx`
  - Each drop has its own IntersectionObserver and state.
  - Measures height with `getBoundingClientRect` after a delay; out-of-view drops are replaced with an empty div.

---

## Findings: why it’s slow/jumpy

### 1) We still render “all drops” in React (list-level work is O(N))

Even if `VirtualScrollWrapper` hides DOM, `DropsList` still:

- Creates `orderedDrops = [...drops].reverse()` (full copy) and then
- Iterates *every* drop to create elements (`orderedDrops.flatMap(...)`).

This is O(N) element creation per update. At a few thousand drops, it becomes non-viable.

**Direct implication**: returning to a wave after hours of messages can result in thousands of React nodes being created + reconciled, producing long main-thread tasks and scroll hitching.

### 2) VirtualScrollWrapper is expensive and introduces layout instability

`VirtualScrollWrapper` adds:

- Per-drop IntersectionObservers (heavy at scale).
- Per-drop React state updates during scroll (can cascade re-renders).
- Delayed measurement (`delay=1000ms` by default) that increases the window where full content is rendered, and media can still change layout after measurement.
- Very large `rootMargin` (`5000px`) which effectively keeps many items “in view”, reducing any intended virtualization benefit and increasing work.

This is a classic source of “jumpy” scroll behavior (layout shifts + thrash).

### 3) The merge path is algorithmically expensive (and becomes catastrophic on catch-up)

`mergeDrops()` (`contexts/wave/utils/wave-messages-utils.ts`) does multiple allocations and operations:

- Builds maps keyed by `stableKey` and then by `serial_no`.
- For each incoming drop, calls `getStableDropKey()` which for FULL drops can:
  - Run `findClosestMatch(...)` scanning existing drops (linear scan).
  - Hash content with `sha256`.
- Sorts the final list.

When a wave has “hours of new drops”, reconciliation can introduce hundreds/thousands of new drops, causing:

- Large O(N×M) behavior from repeated “closest match” scans.
- Significant GC pressure from repeated array/map allocations.

This explains “particularly slow after hours inactive” even when the UI is not actively scrolling.

### 4) “Jump to older serial” can be very network-heavy

For `DropSize.LIGHT` jump behavior:

- `fetchLightWaveMessages()` can call `light-drops` in a loop (`findLightDropBySerialNoWithPagination`) up to 20 requests × 2000 items/request, *then* also performs an around-serial full fetch.

That’s a lot of network + parsing + merge work for what should feel instant.

### 5) Scroll model complexity increases failure modes

The current “reverse chat” approach combines:

- `flex-col-reverse` containers (`WaveDropsReverseContainer`)
- Negative scrollTop semantics (`useScrollBehavior`)
- Serial-target scrolling and retries (`useWaveDropsSerialScroll`)

This is fragile under layout shifts and media loading. Discord avoids “reverse flex scroll hacks” and relies on a stable virtualization model + anchored offsets.

---

## Target UX / SLOs (what “Discord responsiveness” means)

Define the bar explicitly so we can measure progress:

1. **Open wave → interactive** (p95)
   - Warm cache: < 250ms to usable scroll + input
   - Cold cache: < 1200ms to usable scroll + input
2. **Scroll smoothness**
   - p95 frame time during scroll < 16ms on mid-tier hardware
   - No multi-second main-thread tasks triggered by message updates
3. **Jump to message (serial)**
   - “Seek” starts < 100ms (UI responds immediately with loading skeleton)
   - Target visible < 800ms (p95) for typical network conditions
4. **Catch-up after inactivity**
   - Show latest window immediately; do not block on full reconciliation
   - No more than ~200–400 message rows in DOM at once (virtualized)

---

## Proposal: Wave Timeline v2 (Discord-like architecture)

### A) Rendering: list-level virtualization (replace VirtualScrollWrapper)

Replace `DropsList` + `VirtualScrollWrapper` with a single `VirtualizedWaveDropsList` based on `@tanstack/react-virtual` (already a dependency; see `components/token-list/VirtualizedTokenListContent.tsx` for patterns).

Key design points:

- Virtualize at the *list* level: only render visible items + overscan.
- Use dynamic measurement via `virtualizer.measureElement` and a `ResizeObserver` per rendered row (not per entire dataset).
- Stabilize keys with `DropKey = ${waveId}:${serial_no}` for both LIGHT and FULL.
- Stop building `orderedDrops` copies and stop `.flatMap` across N items.

Expected outcome:

- React work becomes O(visible items), not O(total drops).
- DOM stays bounded and predictable.
- Layout shifts become localized to measured items and handled by the virtualizer.

### B) Identity + merging: stop hashing/scanning; move to serial-based indices

Replace the “stable key via content hash + closest match” approach with:

- **Primary identity**: `(waveId, serial_no)` (guaranteed monotonic and unique per wave).
- **Secondary identity**: `drop.id` for updates and deep links.
- **Optimistic sends**: add a client-generated `client_nonce` stored on the optimistic drop and echoed back by the server (via REST response and WebSocket payload) to reconcile without scanning/hashing.

Store structure (conceptual):

```text
WaveStoreV2[waveId] = {
  bySerial: Map<number, DropModel>,    // O(1) updates
  order: number[],                    // serials in ascending order (oldest->newest)
  segments: RangeSet,                 // loaded ranges + gaps
  pinned: boolean,                    // user intent (reading vs pinned)
}
```

Merge behavior becomes:

- New realtime drop: `push(serial)` (O(1)) and `bySerial.set(...)`.
- Pagination older: `prepend(serials)` (O(k)) with minimal allocations.
- Update existing drop: mutate `bySerial` entry; no reorder.

### C) Fetching: “seek mode” and segmented ranges (stop scanning light-drops)

Replace “jump to serial” flow with a dedicated seek operation:

1. Immediately switch UI into **seek state** (show skeleton window around target).
2. Fetch `/waves/:id/drops` with “around” semantics (already supported via `fetchAroundSerialNoWaveMessages`).
3. Populate a *single* window segment: e.g. `[target-25, target+25]`.
4. Allow user to page older/newer from that anchor, rather than “load the world”.

If we still want “fast preview” of far history, do it via a server API that returns **minimal metadata for a bounded range** (not 40k items), e.g.:

- `GET /waves/:id/drops/seek?serial_no=...&limit=...` returning drops in both directions
- or extend existing endpoint to accept explicit `before_serial_no` + `after_serial_no`.

### D) Catch-up strategy: bounded sync + idle backfill

Stop doing unbounded `syncNewestMessages()` loops in the hot path.

Instead:

- On wave activation, fetch **latest window** (e.g. 50).
- If there is a large delta since last seen:
  - Show “X new messages” affordance (already conceptually present via `WaveDropsScrollBottomButton`).
  - Backfill in `requestIdleCallback` / `scheduler.postTask` in small chunks *only if needed* and *only if user is pinned*.
  - Never block render on full reconciliation.

Discord behavior: it prioritizes “interactive now” over “perfectly reconciled history now”.

---

## Migration plan (phased, de-risked)

### Phase 0: Establish a performance baseline (no functional changes)

Instrument and capture:

- Wave open timings (TTFR: time to first render; TTI: time to interactive).
- Jump-to-serial duration (start → target visible).
- Scroll hitch rate (long tasks during scroll, frame drops).
- Merge cost (time spent in merge path per update).

### Phase 1: Low-risk wins in the current architecture

- Change stable identity to serial-based (eliminate hashing/scanning) and reduce merge allocations.
- Remove automatic growth of the rendered window on new drops (keep a bounded window unless user paginates).
- Make background sync cancellable and bounded.

These can materially improve “hours of new drops” without yet rewriting the list renderer.

### Phase 2: Replace list renderer with TanStack Virtual

- Implement `VirtualizedWaveDropsList` behind a feature flag.
- Keep existing fetch/store, but only provide a windowed list to the renderer.
- Validate scroll correctness (pinned vs reading) and jump-to-serial behavior.

### Phase 3: Segmented store + seek mode

- Introduce `WaveStoreV2` with segment/gap tracking.
- Replace `light-drops` scanning flow.
- Optional: persist per-wave segment cache and scroll position for faster return-to-wave.

---

## Proposed tickets (implementation plan)

Below are intentionally written as “engineering-ready” tickets with scope and success criteria.

### P0 — Metrics and profiling

1. **Add Waves performance marks + RUM dashboard**
   - Add `performance.mark/measure` around wave open, first message paint, and composer interactive in `components/brain/my-stream/MyStreamWaveChat.tsx` and `components/waves/drops/wave-drops-all/index.tsx`.
   - Add a lightweight “merge duration” measure around `mergeDrops()` in `contexts/wave/utils/wave-messages-utils.ts` (dev-only initially).
   - Success: dashboard shows p50/p95 open times, jump times, and long task counts.

2. **Create a reproducible perf scenario script**
   - Add a dev-only script (or page) that simulates N drops and then simulates “+M new drops after inactivity” to benchmark merges + rendering without depending on backend.
   - Success: engineers can reproduce baseline jank locally and validate improvements.

### P1 — Fix the biggest algorithmic costs

3. **Adopt serial-based `stableKey` for drops (remove hashing path)**
   - Update `helpers/waves/drop.helpers.ts` and `contexts/wave/utils/wave-messages-utils.ts` so `stableKey` is derived from `waveId + serial_no` for both FULL and LIGHT.
   - Remove or gate `getStableDropKey()` hashing/closest-match logic so it only runs for explicit optimistic reconciliation (if still needed at all).
   - Success: merging 1000 drops does not require scanning existing drops; keys remain stable across light→full upgrades.

4. **Refactor `mergeDrops()` to avoid full sorts on incremental updates**
   - Use deterministic ordering: keep drops in ascending serial order in store; append new drops; prepend pagination pages; update-in-place.
   - Avoid building multiple maps and re-sorting the entire dataset on every update.
   - Success: merge time grows roughly linearly with k=new drops, not with N=total drops.

5. **Bound the rendered window; do not auto-expand on new messages**
   - Update `hooks/useVirtualizedWaveMessages.ts` so new drops do not increase `virtualLimit` unless user explicitly requests more history (or a seek requires revealing).
   - Success: returning after hours does not grow the DOM window to thousands of items.

6. **Make syncNewest bounded + cancellable**
   - In `contexts/wave/hooks/useWaveDataFetching.ts`, avoid unbounded looped `syncNewestMessages()` in the activation path; cap work per foreground activation.
   - Ensure any background sync is abortable (do not use a “throwaway” AbortController that cannot be canceled).
   - Success: foreground activation never triggers multi-second main-thread stalls.

### P2 — Replace renderer with proper virtualization

7. **Introduce `VirtualizedWaveDropsList` (TanStack Virtual)**
   - New component under `components/waves/drops/` that renders drops with `useVirtualizer` using patterns from `components/token-list/VirtualizedTokenListContent.tsx`.
   - Support “pinned to bottom” and “reading” modes without relying on `flex-col-reverse`.
   - Success: DOM node count remains bounded; scroll is smooth with 10k+ stored drops.

8. **Remove `VirtualScrollWrapper` from the Waves path**
   - Keep it only if needed elsewhere; the Waves message list should rely on list virtualization.
   - Success: no per-drop IntersectionObserver/state in the chat list.

9. **Rework scroll anchoring for prepend + realtime append**
   - When loading older messages, maintain the user’s visual position (anchor to the first visible item).
   - When pinned, follow output; when reading, do not auto-jump.
   - Success: no “jump” when older pages load or when media finishes loading.

### P3 — Seek mode and API rationalization

10. **Replace `light-drops` scanning for jump-to-serial with seek mode**
   - Update `useWaveDropsSerialScroll` / wave route behavior to fetch around the target serial and render a bounded window immediately.
   - Remove the “20×2000 light-drops” approach or reserve it for explicit debug tooling.
   - Success: jump-to-serial is fast and predictable; network requests per seek are bounded (≈1–2).

11. **Backend/API: add `client_nonce` for drop creation and echo in WS**
   - FE: generate `client_nonce` on optimistic send; BE: store and echo it back in REST + WS payload.
   - Use this to reconcile optimistic → server-confirmed without hashing/scanning.
   - Success: optimistic messages do not cause re-mount flicker and merges remain O(1).

12. **Segmented store (WaveStoreV2) with gap tracking**
   - Replace “single ever-growing array” with ranges (loaded segments) and explicit gaps.
   - Success: returning after hours does not require materializing/merging the full delta to be interactive.

---

## Risks and mitigations

- **Risk: scroll correctness regressions (especially on mobile/iOS).**
  - Mitigation: ship behind a feature flag; add scroll behavior e2e tests; keep old renderer as fallback during rollout.
- **Risk: backend changes required for ideal optimistic reconciliation.**
  - Mitigation: adopt serial-based keys first (already present on all drops) to remove hashing even before backend changes.
- **Risk: migration complexity across wave types (chat, rank, memes, DM).**
  - Mitigation: start with the standard chat wave (`MyStreamWaveTab.CHAT`) and DMs; treat other wave types as follow-up.

---

## Appendix: “what to profile first” checklist

1. Chrome Performance profile while:
   - Opening a wave with 5k+ drops
   - Scrolling rapidly through history
   - Jumping to an old serial
   - Returning after “hours” worth of new drops (simulate by injecting updates)
2. Confirm presence of:
   - Long tasks during merge (`mergeDrops`, `getStableDropKey`, hashing)
   - Excessive React reconciliation (creating thousands of nodes)
   - Layout thrash from media loads + height measurement
3. Verify DOM node count while scrolling; Discord keeps it bounded.

