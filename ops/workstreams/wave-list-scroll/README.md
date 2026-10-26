# Wave list scroll stability — draft investigation

Status: unfinished. The scrollbar change is implemented; the activity/viewport
fix and cross-platform validation remain open. Do not merge yet.

## Evidence

- Desktop Chrome on `/waves`: the overflowing Waves container reports
  `scrollbar-width: none` and `::-webkit-scrollbar { display: none }`.
  `WebLeftSidebar` applies both `tw-no-scrollbar` and thin scrollbar utilities;
  the hide utility wins. The draft removes that conflict for Waves and uses the
  existing iron thumb/track palette on desktop pointer devices.
- On the live `/waves` list, a later sample after scrolling showed a different
  scroll offset and different row coordinates without an explicit navigation.
  No WebSocket trace was captured, so this is not yet an isolated causal
  reproduction of an incoming-message reset.
- `useEnhancedWavesListCore` incorporates WebSocket activity timestamps.
  `useSidebarWaveNavigation` sorts collections by those timestamps. Retaining
  only a pixel offset cannot preserve the same visible waves after reordering.
- `useRevealActiveSidebarWave` includes the active row's virtual index in its
  reveal key. A changed index can therefore trigger another reveal without a
  navigation. Its existing hydration test explicitly expects that behavior.
- The desktop and mobile/app list components share these hooks. This establishes
  shared exposure, not a completed native-device reproduction.
- No activity-dependent list remount was established. The virtualizer also
  restores offsets, so its lifecycle needs to be included in the reproduction.

## Reproduction work

`tests/support/waveListScroll.ts` supplies 60 local waves and synthetic incoming
WebSocket messages. Scenarios in `wave-loading-sandbox.spec.ts` exercise All,
Pinned and Joined, compare a visible row's coordinates and check desktop
scrollbar CSS. These are unfinished regression tests, not passing evidence.
The existing native-competition sandbox pack already selects this spec, and
the PR effective planner selects that pack when this spec changes.

Local execution did not complete: the first attempt encountered Turbopack's
restriction on dependencies symlinked outside the worktree; the webpack
fallback was stopped during startup for the requested immediate draft handoff.
No real messages were posted.

## Remaining work

- Finish the controlled reproduction on `/waves` and with an active wave.
  Record node retention, scroll offset, row coordinates and message receipt.
- Choose and implement the viewport policy after that reproduction. Compare
  stable ordering while scrolled against row anchoring; preserve live badges,
  pagination, subwave groups, collection restoration and deliberate navigation.
- Restrict automatic active-row reveal to navigation/hydration while respecting
  reader interaction. Preserve the cold direct-link/subwave hydration behavior.
- Complete regression coverage for incoming activity, top-of-list behavior,
  repeated messages, keyboard focus, tab changes and native touch scrolling.
- Verify scrollbar dragging and track clicks on Windows Chrome and Edge, and
  macOS with both scrollbar preferences. Native System Settings control was
  unavailable during investigation; no Windows session was available.
- Exercise mobile web and the iOS/Android app paths. Clearly distinguish
  browser-based Capacitor simulations from native app/device evidence.
- Run focused lint, typecheck, React Doctor and browser checks; update product
  docs/help content once the final behavior is settled. Complete bot review
  before marking ready. Human reviews are not requested.
