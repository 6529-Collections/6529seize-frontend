# Slow collection routes — measurement and scoping (2026-07-05)

Thread F (collection surfaces) timeboxed investigation of the standing perf item
from the 2026-07-05 Thread A closeout: reviewbot responsiveness runs flagged
`/rememes` exceeding a 60s harness timeout and `/the-memes`, `/meme-lab`,
`/network`, `/meme-calendar` exceeding 20s full-page screenshot budgets, and the
collections E2E pack showed a ReMemes title timeout.

## Measurements (production, clean headless Chromium 1280x720, 2026-07-05)

Direct navigation, no test harness, empty cache. Wall-clock from navigation
start. Build `306e55a3d` (4.68.0).

| Route | TTFB | domContentLoaded | load event | Full-page screenshot | Long-task blocking (TBT-ish) | Slowest request |
| --- | --- | --- | --- | --- | --- | --- |
| /rememes | 122 ms | 180 ms | 692 ms | 1.3 s | n/a (see note) | `/api/rememes` 644 ms |
| /the-memes | 147 ms | 206 ms | 740 ms | 0.3 s | 298 ms | `/api/policies/country-check` 601 ms |
| /meme-lab | 123 ms | 195 ms | 835 ms | 3.8 s | 701 ms | arweave.net media ~1.0-1.1 s each |
| /network | 62 ms | 119 ms | 640 ms | 0.4 s | 268 ms | `/api/community-members/top` 798 ms |
| /meme-calendar | 174 ms | 290 ms | 741 ms | 0.1 s | 370 ms | nothing over 140 ms |

Documents fully stream in under 250 ms (~330 KB HTML shells). Hydration
attaches at ~1.1 s on these pages. Every route is interactive well under 2 s.

## Root causes of the reported timeouts

1. **`networkidle`-style waits never settle on media/telemetry-heavy routes.**
   `/rememes` did not reach Playwright `networkidle` within 20 s in a clean
   browser even though it was visually complete at under 1 s: AWS RUM beacons
   (`dataplane.rum.us-east-1.amazonaws.com`, every few seconds), mixpanel,
   walletconnect pings, and trickling third-party NFT media (arweave, ipfs
   gateways) deny the required 500 ms fully-quiet window. Any harness budget
   built on network-idle (the reviewbot responsiveness runs) blows up on these
   routes regardless of real user-perceived speed.
2. **Full-page screenshots are not the bottleneck** — measured 0.1-3.8 s
   (tallest page: /meme-lab at 8,358 px). The 20 s budget overruns come from
   the settle-wait before the shot, not the shot.
3. **The readonly E2E harness intercepts every request**
   (`tests/support/readonlyMutationGuard.ts` routes `**/*` on remote targets),
   which disables the browser HTTP cache and serializes request handling
   through Node. Under a 10-test pack run this amplifies load; the historical
   "ReMemes 60 s timeout / empty title" only reproduced under full-pack load,
   never in isolation (3 isolated production runs: title present and stable in
   under 1 s).
4. **The durable ReMemes E2E failure was a title bug, not slowness.** The page
   client sets `"ReMemes | Collections"` (`rememes.documentTitle`) but Next 16
   streamed metadata re-inserts the SSR `<title>ReMemes</title>` ~16 ms later
   and wins. Same mechanism on `/open-data/network-metrics` (plus an enum
   serialized as `undefined` across the RSC boundary suppressing the intended
   "Consolidated" qualifier). Both fixed in this thread by aligning
   `generateMetadata` with the intended final title; the app-wide
   client-title-vs-streamed-metadata divergence is flagged as a separate task.

## Classification

| Item | Class | Action |
| --- | --- | --- |
| /rememes, /the-memes, /meme-lab, /network, /meme-calendar page loads | Not slow (sub-second) | None needed |
| `/api/rememes` 644 ms, `/api/community-members/top` 798 ms, `/api/policies/country-check` ~600 ms | Backend latency, sub-second | Hand off as observability data; not blocking |
| ReMemes E2E title timeout | Frontend bug (SSR/client title divergence) | Fixed (rememes + network-metrics metadata alignment) |
| Reviewbot 20 s / 60 s budget overruns | Harness measurement artifact (network-idle waits + cache-disabled interception) | Recommend deterministic waits below |
| /meme-lab 701 ms main-thread blocking during hydration | Frontend, minor | Optional future item; not user-visible enough to schedule |

## Recommendations

1. Reviewbot responsiveness runs should wait on deterministic conditions
   (document response + key selector visible), not network idle; or exclude
   telemetry/beacon hosts and media CDNs (arweave.net, ipfs gateways, RUM,
   mixpanel, walletconnect) from idle accounting.
2. Keep the readonly E2E packs' current wait strategy (specific API response +
   element visibility) — it is already deterministic; the packs go green once
   the title fixes deploy.
3. No frontend rewrite is justified by the data. The five routes are fast.
   If the ~600-800 ms backend endpoints matter for feel, that is a backend
   owner conversation (`/api/rememes`, `/api/community-members/top`,
   `/api/policies/country-check`).
