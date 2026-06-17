# Seize Video Player Modes Workstream

## Charter

Own the follow-up work from PR 2700, which introduced the shared
`SeizeVideoPlayer`. The goal is to preserve the consistency win while fixing
the product and accessibility regressions caused by treating all video surfaces
as the same kind of player.

## First File To Read

Read `active-context.md` first after compaction or handoff, then this file, then
`run-log.md`.

## Current Product Decision

`SeizeVideoPlayer` should not have one universal behavior. The website has
three video intents:

- `inert-preview`: video used as card art or a non-primary media thumbnail.
  It should not add focusable media controls or compete with a surrounding card
  action.
- `ambient`: video used as visual NFT, drop, feed, or timeline media. Muted
  autoplay and loop can be appropriate, but should respect reduced motion and
  expose minimal controls.
- `interactive`: video the user is expected to inspect or watch. It should not
  autoplay by default and should provide real player controls. Native controls
  are the bridge unless custom controls reach parity for seeking, captions,
  volume, fullscreen, keyboard behavior, and touch behavior.

## PR 2700 Goal Interpretation

PR 2700's likely goal was sound:

- consolidate scattered video rendering into one shared player
- harden fallback source handling
- give videos a consistent fullscreen and action-control model
- fix layout problems around natural video dimensions in wave/drop media
- make NFT, drop, wave, timeline, marketplace, and upload previews behave more
  consistently

The follow-up work should preserve those goals. The fix is not to return to
many unrelated `<video>` implementations. The fix is to make the shared player
understand intent and expose reusable site templates for common product
surfaces.

## Implementation Snapshot

Implemented on branch `codex/seize-video-player-templates`:

- `SeizeVideoPlayer` resolves `card-preview`, `ambient-media`, `watch-media`,
  `poster-gated`, and `slideshow` templates through a small config helper.
- Fullscreen/browser-policy helpers live beside the player instead of bloating
  the component.
- Interactive/watch templates use native controls and no implicit autoplay.
- Card previews render no custom or native player controls.
- Poster-gated previews render one explicit play button before exposing native
  controls.
- Caption tracks render only when `captionsSrc` is real, with caller-provided
  label/lang/default metadata.
- Player-owned autoplay is muted, visibility-aware, reduced-motion-aware, and
  handles rejected `play()` promises.
- The player keeps React as the owner of the media element `muted` state; tests
  assert the DOM `video.muted` property instead of relying on direct
  `defaultMuted` mutation.

Current pre-PR Waves behavior matters as compatibility input:

- Twitter videos are watchable media: native controls, `playsInline`,
  `preload="metadata"`, HLS/quality selection, captions, and no default
  autoplay for single-video tweets. Grid videos use a poster play button and
  autoplay only after that user gesture.
- `WaveDropAdditionalInfo` promo and additional videos are inspectable
  supporting media: native controls, metadata preload, no autoplay.
- `MarketplaceItemPreviewMediaLink` video is inert card art: muted, looping,
  inline, `autoPlay`, no controls.
- `FilePreview` upload video is an inspection preview: native controls, no
  autoplay.
- `AdditionalMediaUpload` tile videos are small upload previews: controls,
  muted, inline, metadata preload, no autoplay.

PR 2700 did not fully preserve that behavioral matrix because
`SeizeVideoPlayer` defaulted to autoplay/loop/custom controls, and call sites
often relied on defaults. This roadmap preserves the PR goal by centralizing
player code while making those differences explicit.

## Player Templates

Use templates as the public call-site API. A template is a named bundle of
defaults for mode, controls, autoplay, preload, layout, sizing, captions, and
actions. Call sites can still override specific props, but most usage should be
readable from the template name alone.

Recommended initial API:

```ts
type SeizeVideoTemplate =
  | "card-preview"
  | "ambient-media"
  | "watch-media"
  | "poster-gated"
  | "slideshow";
```

Template mapping:

| Template | Mode | Controls | Autoplay | Muted | Loop | Preload | Primary Use |
|---|---|---|---:|---:|---:|---|---|
| `card-preview` | `inert-preview` | `none` | explicit only | true | true | `metadata` or `none` | Marketplace cards and dense previews where the surrounding card owns interaction. |
| `ambient-media` | `ambient` | `minimal` | explicit or owner-driven only | true | true | `metadata` | NFT/drop/timeline visual media where motion is part of the art but not the main task. |
| `watch-media` | `interactive` | `native` initially | false | false | false | `metadata` | Twitter single videos, additional-info videos, and media the user is expected to inspect. |
| `poster-gated` | `inert-preview` until user gesture, then `interactive` | `none` before gesture, `native` after gesture | only after user gesture | true before gesture, caller decides after | false | `metadata` | Grid/feed/tile thumbnails that show a poster with an explicit play affordance before loading an interactive player. |
| `slideshow` | `interactive` | `native` initially | explicit only | caller decides | false | `auto` or `metadata` by owner | Slideshow/watch contexts with explicit progression behavior. |

Design rules:

- Prefer `template` over hand-setting many low-level props at each call site.
- Keep `mode` and `controls` available for exceptional cases and tests.
- Template defaults must never silently set `autoPlay=true`; autoplay remains an
  explicit prop or comes from an existing in-view/playback owner.
- Templates must be composable with source adapters. Source ownership is a
  separate concern from the viewing template.
- A template may select native controls even though the shared player is still
  used. That still meets the consolidation goal because layout, captions,
  fallback, source wiring, fullscreen policy, and future source adapters remain
  centralized.
- Do not create a new template for every call site. Add one only when a surface
  has a reusable product pattern that appears in multiple places or is expected
  to recur.
- `watch-media` also covers the upload-preview use case. Upload call sites should
  use `watch-media` with explicit overrides such as `muted={true}` only when
  needed.
- `poster-gated` owns a specific behavior: render no focusable player until the
  user presses an explicit poster play button, then mount/play the actual
  player. Do not represent this with a vague tile template.

Initial call-site template assignment:

| Call Site | Template | Notes |
|---|---|---|
| `MarketplaceItemPreviewMediaLink` | `card-preview` | Surrounding marketplace card owns interaction. |
| `DropListItemContentMediaVideo` | `ambient-media` | Preserve in-view owner behavior. |
| `MediaDisplayVideo` | `ambient-media` by default | Allow `watch-media` for inspection surfaces. |
| `NFTVideoRenderer` | `ambient-media` | NFT animation/art surface. |
| `RememeImage` | `ambient-media` | NFT/rememe animation surface. |
| `TimelineMedia` | `ambient-media` | Timeline media surface. |
| `TwitterPreviewCard` single video | `watch-media` | Quality selection and captions make this watchable media. |
| `TwitterPreviewCard` grid video | `poster-gated` | Autoplay only after poster play. |
| `WaveDropAdditionalInfo` promo/additional videos | `watch-media` | Supporting media inspection. |
| `CreateDropSelectedFilePreview` | `watch-media` | User-selected upload preview. Override muted if needed. |
| `FilePreview` | `watch-media` | Meme upload/artwork preview. Override muted if needed. |
| `AdditionalMediaUpload` | `poster-gated` preferred | Small tile should avoid cramped native controls; use poster/play plus inspect behavior. If a full-size preview is available, it can use `watch-media`. |
| `LFGSlideshow` | `slideshow` | Explicit autoplay and `loop={false}`. |

## External Research Baseline

Use these sources as the baseline for implementation decisions:

- [W3C WAI: Media Players](https://www.w3.org/WAI/media/av/player/):
  accessible media players need keyboard support, visible focus, clear labels,
  contrast, and screen reader support. WAI also warns that building a custom
  accessible player requires advanced HTML and JavaScript skill, so native
  controls are the preferred bridge for `interactive` mode.
- [W3C WAI: Making Audio and Video Media Accessible](https://www.w3.org/WAI/media/av/):
  plan media accessibility as part of the player contract, not as a later visual
  detail.
- [W3C WCAG 2.2 Understanding 2.2.2 Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html):
  auto-starting moving content that runs alongside other content needs a usable
  pause/stop/hide mechanism; scroll-into-view playback still counts as
  automatically started.
- [MDN Autoplay Guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
  and [Chrome Autoplay Policy](https://developer.chrome.com/blog/autoplay):
  autoplay is browser-policy-dependent; muted autoplay is broadly allowed, while
  audible autoplay requires prior user interaction or engagement. Code must
  handle rejected `play()` promises.
- [WebKit iOS video policies](https://webkit.org/blog/6784/new-video-policies-for-ios/):
  muted or no-audio media may autoplay, autoplay starts only when visible, and
  `playsinline` is required to avoid forced fullscreen on iPhone.
- [MDN `<track>` reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/track):
  caption tracks need real `kind`, `src`, `srclang`, `label`, and at most one
  default track per media element. The label is user-readable UI text.
- [W3C WAI: Transcripts](https://www.w3.org/WAI/media/av/transcripts/):
  transcripts and descriptions serve users who cannot access audio or visual
  content. For this workstream, expose transcript/caption hooks where data
  exists; do not fabricate transcripts for user-generated media.
- [web.dev: prefers-reduced-motion](https://web.dev/articles/prefers-reduced-motion):
  use the media query from CSS and JavaScript, listen for preference changes,
  and avoid non-essential motion for users who request reduced motion.

## Owned Paths

- `components/drops/view/item/content/media/SeizeVideoPlayer.tsx`
- `components/drops/view/item/content/media/DropListItemContentMediaVideo.tsx`
- `components/drops/view/item/content/media/MediaDisplayVideo.tsx`
- `components/drops/create/utils/file/CreateDropSelectedFilePreview.tsx`
- `components/lfg-slideshow/LFGSlideshow.tsx`
- `components/nft-image/RememeImage.tsx`
- `components/nft-image/renderers/NFTVideoRenderer.tsx`
- `components/timeline/TimelineMedia.tsx`
- `components/waves/TwitterPreviewCard.tsx`
- `components/waves/drop/WaveDropAdditionalInfo.tsx`
- `components/waves/marketplace/MarketplaceItemPreviewMediaLink.tsx`
- `components/waves/memes/file-upload/components/FilePreview.tsx`
- `components/waves/memes/submission/components/AdditionalMediaUpload.tsx`
- Closely related tests under `__tests__/components/...`

## Forbidden Paths

- Do not edit generated API models for this workstream.
- Do not rewrite unrelated wave, delegation, sidebar, Open Graph, or generated
  files currently dirty in the worktree.
- Do not change media upload API behavior unless a later source-ownership phase
  proves it is needed.

## Roadmap

### Phase 0: Reload And Baseline

1. Read root `AGENTS.md`.
2. Read this memory packet.
3. Read `ops/skills/6529-autonomous-manager/SKILL.md`.
4. Read `ops/skills/wcag-22-aa/SKILL.md` and
   `ops/standards/frontend-accessibility-wcag-22-aa.md`.
5. Read `ops/skills/react-doctor/SKILL.md` before React implementation
   closeout.
6. Check `git status --short --branch` and preserve unrelated user changes.
7. Inspect current `origin/main` or current branch call sites before editing.

### Phase 1: Stabilize The Player Contract

Add an explicit player intent contract:

```ts
type SeizeVideoMode = "inert-preview" | "ambient" | "interactive";
type SeizeVideoControls = "none" | "minimal" | "native";
type SeizeVideoTemplate =
  | "card-preview"
  | "ambient-media"
  | "watch-media"
  | "poster-gated"
  | "slideshow";
```

Recommended default mapping:

| Mode | Controls | Autoplay | Muted | Loop | Wrapper focus |
|---|---|---:|---:|---:|---:|
| `inert-preview` | `none` | false unless explicitly set | true | true | no |
| `ambient` | `minimal` | false unless explicitly set or driven by an in-view owner | true | true | no |
| `interactive` | `native` initially | false | false | false | no |

Implementation notes:

- Add `template?: SeizeVideoTemplate` and resolve it to mode/control/default
  props in one small pure helper, such as `resolveSeizeVideoTemplate`.
- Let templates be the normal call-site API. Use direct `mode` or `controls`
  only for uncommon variants, tests, or temporary migration steps.
- Make `muted`, `loop`, and controls mode-derived defaults. Do not let any mode
  silently default `autoPlay` to `true`; every autoplaying surface must opt in
  explicitly or be driven by an existing in-view playback owner.
- Keep explicit prop overrides for existing call sites.
- Native controls should set `controls={true}` on the `<video>` and suppress
  the custom overlay controls.
- Minimal custom controls should keep icon buttons for play/pause, mute,
  fullscreen, open, and download where appropriate.
- There is no first-pass `custom` full-player mode. Add one only after custom
  controls cover seek, captions, volume, fullscreen, keyboard behavior, and
  touch behavior.
- The wrapper should not be `role="group" tabIndex={0}` with activation
  handlers if it acts like a button. Prefer real buttons and semantic controls.
- In `native` and `none` controls modes, disable custom wrapper click/keydown
  playback handlers. Native browser controls and surrounding cards must not
  fight the player wrapper.
- Render a caption `<track>` only when there is a real `captionsSrc`, unless a
  caller has a documented reason to render an empty track. A real caption track
  should get a real label such as "Captions" and may be marked `default` by
  prop.
- Always keep `playsInline` on the rendered `<video>`, including native-control
  mode, to preserve iPhone inline playback behavior.
- Always treat `video.play()` as fallible. Catch rejected promises and keep the
  UI in a paused/user-action-needed state instead of assuming playback started.
- For autoplaying surfaces, set both the React `muted` value and the DOM media
  element's muted/default-muted state before attempting playback. This avoids
  policy and timing differences across browsers. Treat missing DOM sync as a
  confirmed bug in the merged PR, not as defensive polish.
- Confirm the product decision for mute reset across source changes. The PR
  tests currently assert reset-on-source-change behavior, but that should be a
  deliberate choice for slideshow/variant switching rather than accidental
  state loss.
- Default `preload` by mode:
  - `inert-preview`: `metadata` or `none`; prefer poster-first if available.
  - `ambient`: `metadata`, with the existing optimized/HLS owner deciding when
    to load more.
  - `interactive`: `metadata`, unless a known slideshow/watch context requires
    eager loading.
- Do not rely on `controlsList` for security or policy. It is only a UI hint and
  should not be used as the sole reason to hide download/open controls.

### Phase 2: Fix Known Regressions

1. Prevent accidental autoplay/loop on call sites that omit those props.
2. Restore Twitter captions:
   - accept `captionsLabel`
   - accept `captionsDefault`
   - do not label a real caption track as "No captions available"
   - use native controls for interactive Twitter playback unless a custom
     captions toggle exists
3. Correct single-video tweet behavior:
   - no autoplay unless explicitly requested
   - grid tweet video can still autoplay after the user presses the poster play
     button
4. Restore upload and additional-media inspection behavior:
   - no autoplay by default
   - native controls or equivalent interactive controls
5. Preserve existing HLS and fallback behavior while changing controls:
   - do not move source ownership during this phase
   - do not remove playback snapshot restore from Twitter quality switching
   - do not break drop media's in-view pause/play logic
6. Fix player-owned mute state:
   - keep React state and the DOM media element's `muted` property
     synchronized
   - avoid direct media-element mutation outside the browser playback handoff
     so React Compiler stays happy
   - add coverage for user mute/unmute on watchable media and for source changes
7. Disable wrapper playback in externally owned ambient media:
   - when an in-view/HLS owner controls playback, wrapper click/keydown must not
     fight that owner
   - a tap should not pause a video that the in-view effect immediately replays
   - expose real buttons for explicit actions instead
8. Add in-view ownership or explicit product rationale for autoplaying
   ambient/card surfaces:
   - `NFTVideoRenderer`
   - `RememeImage`
   - `TimelineMedia`
   - `MarketplaceItemPreviewMediaLink`
   - if unconditional autoplay is kept for any of these, document why and keep
     it muted/reduced-motion-aware
9. Handle autoplay failure as a normal state:
   - if `play()` rejects, show the paused overlay or native controls
   - do not leave progress/control state saying playback is active
   - add a regression test for rejected `play()`
10. Preserve caption and transcript extension points:
   - support `captionsSrc`, `captionsLabel`, `captionsLang`, and
     `captionsDefault`
   - support an optional transcript/open-transcript action later, but do not
     block Phase 2 on transcript UX if no transcript data exists
11. Keep data attributes stable:
   - if callers pass `data-testid`, `data-mime`, or `data-url` for media
     identification, land them on the intended media element or explicitly move
     tests/analytics to a wrapper-specific selector
   - do not accidentally change `media-display` from the media node to an
     unrelated wrapper without updating consumers
12. Track fullscreen state for both wrapper fullscreen and native video
    fullscreen:
   - standard fullscreen can target the wrapper
   - iOS native fullscreen should not leave UI state stuck on "Full screen"

### Phase 3: Migrate Call Sites By Intent

Use this classification unless new product evidence says otherwise:

| Call Site | Template | Notes |
|---|---|---|
| `MarketplaceItemPreviewMediaLink` | `card-preview` | Inside a focusable marketplace card. Avoid nested media controls and noisy tab order. Add in-view/pause-offscreen or document unconditional autoplay. |
| `DropListItemContentMediaVideo` | `ambient-media` | Feed/drop media with HLS/in-view behavior and media actions. External owner controls playback. |
| `MediaDisplayVideo` | `ambient-media` by default | Use `watch-media` only when rendered as an inspection surface. |
| `NFTVideoRenderer` | `ambient-media` | NFT animation/art surface. Add in-view/pause-offscreen or document unconditional autoplay. |
| `RememeImage` | `ambient-media` | NFT/rememe animation surface. Add in-view/pause-offscreen or document unconditional autoplay. |
| `TimelineMedia` | `ambient-media` | Timeline art/media surface. Add in-view/pause-offscreen or document unconditional autoplay. |
| `TwitterPreviewCard` single video | `watch-media` | Watchable video, quality selection, captions. Native controls first. |
| `TwitterPreviewCard` grid video | `poster-gated` | Poster-first, no focusable media before gesture, autoplay only after poster play. |
| `WaveDropAdditionalInfo` promo/additional videos | `watch-media` | User is inspecting submitted supporting media. |
| `CreateDropSelectedFilePreview` | `watch-media` | User-selected upload preview. Override muted if needed. |
| `FilePreview` | `watch-media` | Meme upload/artwork preview. Override muted if needed. |
| `AdditionalMediaUpload` | `poster-gated` preferred | Small tiles should avoid cramped native controls; use a separate inspect/full-size affordance if needed. |
| `LFGSlideshow` | `slideshow` | Slideshow needs explicit `autoPlay`, `loop={false}`, ended handling, and real controls. Verify native controls do not conflict with slideshow chrome or double-preload. |

Call-site migration rules:

- Any `interactive` call site with possible audio must pass `autoPlay={false}`
  unless playback follows a direct user gesture.
- Any autoplaying `ambient` or `inert-preview` call site must be muted and must
  expose a pause mechanism when the moving content can run for more than five
  seconds beside other page content.
- Poster-first is preferred for `interactive` media when a poster exists. This
  avoids surprise playback and reduces load.
- Dense card/list contexts should not insert extra tab stops for video controls
  unless the user is intentionally interacting with the media.
- `card-preview` and pre-gesture `poster-gated` must render zero focusable
  player elements.

### Phase 4: Source Ownership Without A God Component

Do not push all source policy directly into one massive `SeizeVideoPlayer`.
Split responsibilities:

- `SeizeVideoPlayer`: renders frame, video element, controls, fullscreen,
  progress, captions wiring, and accessibility.
- `useVideoFullscreen`: standard and native iOS fullscreen helpers.
- `useVideoProgress`: progress state and animation frame management.
- `useVideoFallbackSources`: direct source/fallback rotation.
- `useAutoplayPolicy`: reduced-motion, explicit autoplay intent, play-promise
  handling, and user-action-needed state.
- `useOptimizedSeizeVideoSource` or adapter: optimized MP4/HLS polling for drop
  media.
- `TwitterVideoPlayer`: remains a wrapper for quality selection and playback
  snapshot restore until the source adapter can express Twitter variants cleanly.

Migration order:

1. Extract pure control/fullscreen/progress helpers without behavior changes.
2. Move direct source plus fallback rotation into a source hook.
3. Move drop optimized/HLS setup behind an adapter and migrate
   `DropListItemContentMediaVideo` plus `MediaDisplayVideo`.
4. Leave Twitter source ownership last because it has quality selection, HLS,
   fallback, and playback snapshot restore.

### Phase 5: Accessibility And Motion

- Respect `prefers-reduced-motion` by disabling non-user-initiated autoplay for
  both `ambient` and `inert-preview` modes unless a caller has a documented,
  product-approved exception.
- Listen for reduced-motion preference changes and pause player-owned autoplay
  when the user switches to reduced motion.
- Ensure every visible control is a real `button` with a stable accessible name.
- Ensure keyboard focus order is visual and task ordered.
- Ensure controls remain reachable on touch and keyboard, not only hover.
- Avoid focusable player wrappers inside focusable cards.
- `card-preview` must add no player tab stop at all. The surrounding card/link
  remains the interactive target.
- Pre-gesture `poster-gated` should expose one explicit poster play button, not
  a hidden/focusable video wrapper.
- Keep target sizes practical for mobile.
- Do not hide controls in a way that makes keyboard focus appear on an invisible
  button.
- Custom progress bars in `minimal` mode are display-only unless they implement
  real seeking. Mark display-only progress `aria-hidden="true"`.
- Native controls satisfy the first-pass accessibility bar for `interactive`
  mode. If native controls are replaced later, the custom controls must cover
  keyboard operation, visible focus, labels, contrast, captions, seeking, volume,
  fullscreen, and touch.
- For first-party/editorial videos with meaningful speech or visual-only
  information, expose captions/transcript/description data when available. For
  user-generated media, render provided accessibility metadata faithfully but do
  not invent missing captions or transcripts.

### Phase 6: Tests And Validation

Add or update tests for:

- Mode defaults for `autoPlay`, `muted`, `loop`, controls, and wrapper focus.
- Template defaults for `card-preview`, `ambient-media`, `watch-media`,
  `poster-gated`, and `slideshow`.
- Native controls mode renders browser controls and suppresses custom overlay
  buttons and wrapper activation handlers.
- `none` controls mode adds no focusable controls.
- `card-preview` renders no focusable player controls or wrapper.
- Pre-gesture `poster-gated` renders a poster play button and no mounted
  autoplaying player.
- Missing `captionsSrc` does not render a fake "No captions available" track.
- Caption props render `kind="captions"`, `src`, `srcLang`, user-readable
  `label`, and `default` only when requested.
- Rejected `play()` leaves the player in paused/user-action-needed state.
- User mute/unmute updates both React state and the DOM media element's
  `muted` state.
- Source changes reset or preserve mute state according to the documented
  product decision.
- Wrapper `role="group"` activation behavior is removed for native/none
  controls.
- Externally owned ambient playback does not fight wrapper click/keydown
  playback handlers.
- Twitter single video does not autoplay by default.
- Twitter grid video autoplays only after poster play.
- Twitter captions keep a real label and default state.
- Marketplace video preview does not add nested focusable controls.
- Upload previews do not autoplay and expose inspection controls.
- Drop media keeps in-view HLS autoplay/pause behavior.
- Fullscreen wrapper target and app fullscreen pause-on-exit stay covered.
- Native iOS video fullscreen keeps visible fullscreen state sensible.
- Reduced-motion disables non-user-initiated autoplay where practical to test.
- `playsInline` remains present in native, minimal, and none controls modes.
- Display-only custom progress is `aria-hidden`.

Run focused checks:

```powershell
seize run test:no-coverage -- __tests__/components/drops/view/item/content/media/SeizeVideoPlayer.test.tsx
seize run test:no-coverage -- __tests__/components/waves/TwitterPreviewCard.test.tsx
seize run test:no-coverage -- __tests__/components/drops/view/item/content/media/DropListItemContentMediaVideo.test.tsx
seize run test:no-coverage -- __tests__/components/drops/view/item/content/media/MediaDisplayVideo.test.tsx
seize run lint:changed
seize run typecheck:changed
seize run react-doctor:diff
```

`lint:changed`, `typecheck:changed`, and `react-doctor:diff` are only clean
signals from a scoped branch or clean implementation worktree. If this work is
started from the currently dirty shared worktree, either create a dedicated
worktree/branch first or document unrelated changed-file noise in the evidence.

Use browser verification for at least:

- a tweet video preview
- a marketplace video card
- a wave/drop video
- an upload preview
- keyboard-only tab/activation through each representative surface
- reduced-motion behavior for a non-user-initiated autoplay surface

## Escalation Triggers

- Native controls are visually unacceptable in an interactive context.
- Twitter quality selection cannot coexist with native controls.
- Reduced-motion policy conflicts with product expectations for NFT animation.
- HLS ownership migration starts changing playback behavior beyond the intended
  call site.
- A small-tile upload surface cannot fit native controls without harming remove,
  progress, or error states.

## Evidence Standard

Every phase should leave:

- changed files list
- test commands and results
- browser observations or screenshots for visible behavior
- remaining risks and skipped checks
