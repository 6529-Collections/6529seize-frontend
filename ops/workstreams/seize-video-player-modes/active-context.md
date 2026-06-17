# Active Context: Seize Video Player Modes

## Current Goal

Implement and validate the PR 2700 follow-up: make `SeizeVideoPlayer`
template-aware, migrate site call sites, open a PR, iterate with bots, then
carry the approved change through staging and production validation.

## Manager Mode

Implementation manager plus investigation manager.

## Branch / Worktree State

Implementation working directory: `D:\repos\6529seize-video-player-templates`

Implementation branch: `codex/seize-video-player-templates`

The original worktree at `D:\repos\6529seize-frontend` is dirty with unrelated
user changes. Do not revert or clean them. This dedicated worktree is scoped to
the owned paths listed in `README.md`.

## What We Learned

PR 2700 introduced `SeizeVideoPlayer` and replaced most site video rendering
with it. It is a useful consolidation, but its global defaults and custom
controls do not fit all call sites.

Known issues from review:

- `SeizeVideoPlayer` defaults `autoPlay = true` and `loop = true`, causing
  accidental autoplay/loop when call sites omit those props.
- Twitter captions are passed through `captionsSrc`, but the shared player
  labels the track "No captions available" and does not mark it default.
- The wrapper is focusable with `role="group"` and activation handlers even
  though it behaves like play/pause. Prefer semantic controls.
- Some call sites need video as inert card art; others need full inspection or
  watch controls.

Current design decision:

- Add intent modes: `inert-preview`, `ambient`, `interactive`.
- Add reusable templates as the public call-site API:
  - `card-preview`
  - `ambient-media`
  - `watch-media`
  - `poster-gated`
  - `slideshow`
- Use native controls as the first interactive bridge.
- Keep custom minimal controls for ambient visual media.
- Migrate source ownership later through hooks/adapters, with Twitter last.
- Do not let any mode default `autoPlay` to `true`; every autoplaying surface
  should opt in explicitly or be driven by an in-view owner.
- Do not add a `custom` full-player mode until custom controls cover seek,
  captions, volume, fullscreen, keyboard behavior, and touch behavior.
- External best-practice research added stricter requirements:
  - native controls are the first-pass accessibility baseline for watchable
    media
  - `play()` rejection is normal and must update UI state
  - caption tracks need real label/lang/default handling
  - autoplay must be muted, explicit, reduced-motion-aware, and user-paused
    when it runs beside other content
  - `playsInline` must stay on every rendered video

Opus 4.8 review feedback incorporated:

- keep the shared-player goal
- remove ambiguous `tile-preview`
- use `watch-media` for upload inspection previews, with overrides as needed
- add first-class `poster-gated` for poster/play-button/gesture-to-play flows
- promote mute DOM synchronization to a confirmed bug fix
- promote wrapper click vs external in-view playback ownership to a confirmed
  bug fix
- make autoplay-at-scale for NFT/timeline/marketplace ambient surfaces a Phase
  2 requirement: add in-view ownership or document product rationale
- require `card-preview` and pre-gesture `poster-gated` to avoid unwanted
  player tab stops
- remove fake empty caption tracks rather than preserving an escape hatch
- keep Twitter source ownership out of the shared player for now

Likely PR 2700 goal:

- consolidate Waves/drops/NFT video rendering into `SeizeVideoPlayer`
- improve layout sizing for natural video dimensions
- add consistent fullscreen/action controls
- centralize fallback source handling
- reduce repeated raw `<video>` implementations

We should still meet that goal. The roadmap should not undo consolidation; it
should make the shared player mode-aware so old Waves behaviors are preserved
where they were intentional. Templates are the practical way to do that across
the site without every call site knowing the low-level defaults.

Current Waves compatibility baseline:

- Twitter single video: inspect/watch, no default autoplay, native controls,
  captions, HLS/quality selection.
- Twitter grid video: poster-first, autoplay only after the poster play button.
- Additional-info promo/media videos: inspect/watch, native controls,
  metadata preload, no default autoplay.
- Marketplace video preview: inert visual art, muted autoplay loop, no controls.
- Meme file preview: inspect/watch, controls, no default autoplay.
- Additional media upload tile: small controlled preview, muted inline metadata
  preload, no default autoplay.

## Implementation Status

Implemented:

- Added template resolution and helper modules:
  - `SeizeVideoPlayer.config.ts`
  - `SeizeVideoPlayer.fullscreen.ts`
- Updated `SeizeVideoPlayer` to support `template`, `mode`, `controls`,
  caption label/lang/default props, native controls, no-controls card previews,
  poster-gated playback, reduced-motion-aware player-owned autoplay, and
  rejected-play handling.
- Migrated the owned call sites to the intended templates:
  - `card-preview`: marketplace video cards
  - `ambient-media`: drop/media display/NFT/rememe/timeline visual media
  - `watch-media`: Twitter single videos, wave additional info, upload/file
    previews
  - `poster-gated`: additional media upload tiles
  - `slideshow`: LFG slideshow
- Updated focused regression tests for player templates, captions, wrapper role
  removal, mute state, rejected play, marketplace link-query brittleness,
  Twitter native controls/captions, upload previews, slideshow captions, and
  ambient owner behavior.
- Addressed first PR bot feedback:
  - player-owned ambient autoplay now respects an explicit user pause
  - native fullscreen exit is handled before unsupported-wrapper fallback
  - native fullscreen state no longer applies wrapper fullscreen sizing
  - poster-gated playback stays open across source/quality changes when the
    poster identity is stable
  - video control accessible names, caption defaults, and fallback text use the
    repo i18n message catalog
  - default caption language is `en-US`
  - added focused tests for in-view autoplay, out-of-view pause, reduced-motion
    gating, user-pause persistence, poster-gate source resilience, native
    fullscreen exit reset, and i18n message keys

Validation so far:

- `seize run lint:diff` passed.
- `seize run typecheck` passed.
- Focused matrix passed: 13 suites, 144 tests.
- `seize run react-doctor:diff` passed with warnings only, score 95/100.
- `codex-diff-check` passed.
- Pre-rebase `seize run build` passed. After rebasing onto the newer
  `origin/main`, an intermediate local build hit a Windows standalone
  finalization `EBUSY` while copying
  `.next/server/interception-route-rewrite-manifest.js`. A clean retry after
  stopping the dev server and removing `.next` passed with exit code 0. Existing
  generator/Sass/runtime warnings and a non-fatal `next-sitemap.config.ts`
  extension warning were observed.
- Final local branch head is rebased onto `origin/main` at `bd2c40519`.
  Upstream changes since the build were Wave Score/release-note changes with no
  video-player overlap. On this final head:
  - `codex-diff-check` passed.
  - `seize run lint:changed` passed.
  - `seize run typecheck:changed` passed for 29 changed TypeScript files.
  - Focused video regression matrix passed: 13 suites, 144 tests.
  - `seize exec react-doctor . --project 6529seize --verbose --offline
    --diff=origin/main` passed with warnings only, score 95/100.
- After addressing bot feedback:
  - focused player/Twitter/i18n tests passed: 3 suites, 36 tests
  - `codex-diff-check` passed
  - `seize run lint:changed` passed
  - `seize run typecheck:changed` passed for 29 changed TypeScript files
  - full focused media+i18n regression matrix passed: 14 suites, 153 tests
  - `seize exec react-doctor . --project 6529seize --verbose --offline
    --diff=origin/main` passed with warnings only, score 95/100
- After the first follow-up review and SonarCloud pass:
  - native fullscreen state is set again on successful imperative native entry,
    while exit still runs before unsupported-wrapper fallback
  - minimal custom controls now remain visible instead of relying on wrapper
    hover/touch handlers
  - easy Sonar style issues were cleaned up in the reduced-motion helper/tests
  - focused player/i18n tests passed: 2 suites, 26 tests
  - `codex-diff-check` passed
  - `seize run lint:changed` passed
  - `seize run typecheck:changed` passed for 20 changed TypeScript files
  - full focused media+i18n regression matrix passed: 14 suites, 153 tests
  - `seize exec react-doctor . --project 6529seize --verbose --offline
    --diff=origin/main` passed with warnings only, score 95/100
- Browser verification on `http://localhost:3126/codex-video-harness` passed
  with a temporary local harness route that was removed before commit:
  - initial route load: 0 console errors
  - `card-preview`: no controls/autoplay, muted, looped, inline, metadata
  - `watch-media`: native controls, no autoplay/loop, real caption track label
    and default state
  - `poster-gated`: no controls before gesture; after clicking the play button,
    native controls appeared and the poster play button was removed
  - `/the-memes` also loaded with no initial console errors, but it rendered no
    video elements in the local data state

## Call-Site Classification

- `MarketplaceItemPreviewMediaLink`: `card-preview`
- `DropListItemContentMediaVideo`: `ambient-media`
- `MediaDisplayVideo`: `ambient-media` by default
- `NFTVideoRenderer`: `ambient-media`
- `RememeImage`: `ambient-media`
- `TimelineMedia`: `ambient-media`
- `TwitterPreviewCard` single video: `watch-media`
- `TwitterPreviewCard` grid video: `poster-gated`
- `WaveDropAdditionalInfo`: `watch-media`
- `CreateDropSelectedFilePreview`: `watch-media`
- `FilePreview`: `watch-media`
- `AdditionalMediaUpload`: `poster-gated` preferred, or full-size
  `watch-media` inspection
- `LFGSlideshow`: `slideshow` with explicit autoplay and `loop={false}`

## Immediate Next Actions

1. Push the second follow-up fix commit to PR #2718.
2. Iterate on CI/review bots until agent-happy and bot-happy.
3. Merge only when checks/approvals allow.
4. Deploy to staging, smoke/E2E validate, then deploy to production and
   validate production.

## Open Decisions

- Whether `AdditionalMediaUpload` should use `poster-gated` only, or
  `poster-gated` plus a separate full-size `watch-media` inspect affordance.
  Recommended first pass: avoid cramped native controls in the tile.
- Whether `LFGSlideshow` should use native controls immediately or keep custom
  minimal controls plus added seek/volume/caption affordances. Recommended first
  pass: native controls unless visual constraints block it.
- Whether reduced-motion should pause all NFT ambient autoplay globally or only
  player-owned autoplay. Recommended first pass: only player-owned autoplay,
  preserving existing externally managed in-view playback until that owner is
  migrated.

## Validation Gaps

No staging/prod-specific Playwright target has been confirmed yet. If none
exists, use the strongest available staging/prod smoke checks and document the
gap in the PR/release notes.
