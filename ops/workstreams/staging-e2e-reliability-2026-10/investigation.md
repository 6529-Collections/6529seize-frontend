# Staging E2E investigation — 26 October 2026

## Evidence boundary

Inspected the complete downloadable artifacts from [run 40304172331](https://github.com/6529-Collections/6529seize-frontend/actions/runs/40304172331) and [run 40300184019](https://github.com/6529-Collections/6529seize-frontend/actions/runs/40300184019), including each embedded Playwright report ZIP, all unexpected/flaky test results and attempts, assertion steps, error-context DOM snapshots, page diagnostics, pack evidence, selection and publication provenance. Also inspected the latest failed job's complete log.

Both runs checked out deployed source `113712d6ff970b2a75c5e5427bbe2c8cdf81c3eb`, following successful deployment [40299176540](https://github.com/6529-Collections/6529seize-frontend/actions/runs/40299176540). Their workflow source is a different commit, `6d81344f44f277fe6ea7cc035a4366a00231c5e0`; the application checkout and tests are the deployed source above.

The latest run has 18 packs and 588 test cases: **505 passed, 9 terminal failures, 0 internally recovered flakes, 74 skipped**. Exactly two packs failed. Setup, dependency/browser installation and initial deployed-version verification succeeded; pack evidence reports zero infrastructure failures. Existing skips were not introduced by this change.

## Every terminal failure in the latest run

Each row failed its initial attempt and both Playwright retries.

| Project          | Test                            | Viewport    | Observed failure                                                                              | Ownership                              |
| ---------------- | ------------------------------- | ----------- | --------------------------------------------------------------------------------------------- | -------------------------------------- |
| Mobile Chromium  | Wave read-only message search   | Pixel 7     | Input visible then absent; first attempt fails visibility, retries fail placeholder assertion | Application lifecycle defect           |
| Desktop Chromium | Video 550 containment/centering | 390 × 844   | No video player; page renders JPEG artwork                                                    | Incorrect live-data fixture assumption |
| Desktop Chromium | Video 550 containment/centering | 390 × 600   | Same                                                                                          | Incorrect live-data fixture assumption |
| Desktop Chromium | Video 550 containment/centering | 1440 × 1000 | Same                                                                                          | Incorrect live-data fixture assumption |
| Desktop Chromium | Video 550 containment/centering | 1440 × 600  | Same                                                                                          | Incorrect live-data fixture assumption |
| Mobile Chromium  | Video 550 containment/centering | 390 × 844   | Same                                                                                          | Incorrect live-data fixture assumption |
| Mobile Chromium  | Video 550 containment/centering | 390 × 600   | Same                                                                                          | Incorrect live-data fixture assumption |
| Mobile Chromium  | Video 550 containment/centering | 1440 × 1000 | Same                                                                                          | Incorrect live-data fixture assumption |
| Mobile Chromium  | Video 550 containment/centering | 1440 × 600  | Same                                                                                          | Incorrect live-data fixture assumption |

Search source: `tests/social/search-waves-readonly.spec.ts`, originally line 1206. Video source: `tests/media/media-mint-detail-readonly.spec.ts`, originally line 387. These are failures before the geometry assertions, not evidence that centering or video dimensions regressed.

## Persistent search failure

The previous run also failed all three mobile attempts, at the input-focus assertion. Both runs' failure snapshots lack the search dialog, while the wave route and its normal header remain. Neither reports an application exception explaining removal. Desktop search passes.

The relevant asynchronous lifecycle is concrete: `useCompetitionSubmissionWave` resolves the default competition and detail; `MyStreamWaveTabs` then replaces `MyStreamWaveTabsDefault` with `MyStreamWaveTabsMeme` for Main Stage. Each branch previously owned a separate `MyStreamWaveTabsHeader`, including its `openSearch` state and modal subtree. Replacing the header necessarily destroys an already-open dialog. Clicking sooner or waiting for input focus cannot preserve that state. The artifacts have no trace/lifecycle events proving the precise closing callback in each historical attempt; this source-level remount defect is independently demonstrated and covered.

The search owner now lives above that branch replacement, keyed by wave identity. Query/filter state and input focus survive competition resolution and refetching. Closing restores focus to the current header trigger; changing waves resets the dialog. Existing message selection, curation clearing, chat selection, serial navigation and global search remain supported.

Coverage: component regression checks the same input node, query and focus across both header transitions, current-trigger focus restoration, selection routing, global scope and wave changes. The existing local browser search scenario now deliberately withholds Main Stage detail until the input is visible, then requires the competition header and focused input to coexist. Deployed discovery, search, scope and empty-result assertions remain intact.

## Video fixture drift

The previous run passed all eight video-550 cases against the same deployed source. Every latest failure snapshot instead names **Chromie Squiggle Museum Acquisition**, displays an image and reports `Image - JPEG`; there is no player to measure. The page still exposes an MP4 link, which by itself does not establish an MP4 renderer or current video artwork.

The [canonical metadata linked by the failed page](https://media.6529.io/arweave/yEEVNbUIvVuF1Yb_rRUEmdrrGg3Lj7ZZa-4KBYqJsmg) confirms card 550 is a 6937 × 4624 JPG and contains no animation metadata. The renderer deliberately selects video only when animation metadata identifies MP4/MOV. Reassigning or refreshing mutable staging records can therefore invalidate a numeric video fixture independently of source deployment. The exact data write/time that changed the staging record is not retained in these artifacts.

The geometry matrix now qualifies actual MP4/MOV records and requires both **portrait and square** shapes, preserving all four viewports, both Chromium projects, native dimension checks, controls, containment, centering, usable-height caps and parent-layout-shift assertions. A bounded read-only NFT inventory replaces fixed token IDs. Missing either shape is an explicit fixture failure, never a skip. Each case retains its selected ID/dimensions as an attachment. Mobile staging battery coverage uses the same qualified portrait fixture; other environments retain their previous route.

Coverage: qualification contracts reject a stale MP4 URL paired with JPEG-only metadata, unsupported formats, missing sources, wrong collections and invalid dimensions. They accept the renderer's metadata URL fallback and MOV support. Live authenticated fixture acquisition and the complete geometry flow still need execution against an authorized deployed run.

## Museum Research: intermittent, not a latest terminal failure

In the previous run all three attempts passed 1440px, resized and reopened at 820px, then spent 30 seconds waiting for same-origin Magnum editorial WebPs, particularly `6529NM-W-0026-1280.webp` and `6529NM-W-0028-1280.webp`. The latest run passes the full 1440/820/390 sequence on its first attempt. Both runs selected all Museum packs. Selection does not explain a browser load failure.

The old helper recorded each image once, gave it two rendering frames in view, then scrolled on and only polled from the final scroll position. It could leave an unresolved native lazy image behind without revisiting it. The helper now keeps the next unresolved image in view until it settles, within the same existing 30-second deadline. Every observed image must still remain present and decode; replacement, disappearance, decode failure and persistent unresolved-media checks remain failures. A focused regression requires an image that remains pending beyond its first visit, while negative controls retain failure behavior.

Diagnostics previously accepted only selected external Art Blocks hosts, so the same-origin images were absent from the CDP evidence. They now include same-origin Museum image paths and outstanding browser requests, with query strings, fragments, credentials and sensitive headers removed. A media assertion failure records `src`, `currentSrc`, responsive candidates, `sizes`, lazy-loading mode, completion and native dimensions. Trace policy remains unchanged.

**Causal limit:** the old CI evidence does not record selected responsive candidates or the transport state of these images. It cannot distinguish native lazy scheduling, a canceled/resized source request, or a pending server response. An isolated Chromium replay of the committed WebPs across resize/navigation loaded successfully, and a separate native responsive-source experiment also loaded successfully. Those experiments do not prove what happened in the failed CI browser. The helper defect and diagnostic omission are fixed; attribution of the historical Research stall to either remains unproven. No Museum application-media change or batch-caused regression is claimed.

## Other recovered and environmental observations

The previous run's mobile **Profile Waves Feed across the exact web breakpoint** failed twice and passed on its third attempt. It passes directly in the latest run. This is separate from its two terminal failures; no cause is established and no speculative fix is included.

Blocked analytics requests, canceled background route-prefetches and unrelated media-resizer ORB entries appear in diagnostics. They are not application exceptions and do not establish the causes above. There was no setup or network failure that terminated a latest pack outside its actual test assertions.

## Validation and remaining execution gaps

Focused component/helper tests and browser-selector/type checks validate the changed contracts. A local Chromium gallery experiment used the actual committed Magnum WebPs across 1440/820/390 navigation and decoded every image. That experiment did not reproduce the historical stall.

Full local app browser attempts for the Research matrix and delayed-competition search could not reach the application: cold Turbopack readiness timed out, and the webpack fallback remained compiling without an HTTP response. The temporary server was stopped; resulting empty-response test failures are local execution limitations, not evidence of these application assertions passing or failing. No dev server is left running.

No staging rerun, deployment, shared staging push, main merge, timeout/retry increase, new skip, pack-selection narrowing or unrelated WebSocket exclusion change is part of this work. Revalidation on the eventual deployed head remains necessary, and requires separate authorization.
