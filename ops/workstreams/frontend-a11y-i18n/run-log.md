# Run Log

## 2026-06-11

- Created the workstream scaffold for progressive WCAG 2.2 AA and i18n work.
- Confirmed existing unrelated dirty files are outside this workstream.
- Started standards branch `codex/frontend-a11y-i18n-standards`.
- Opened standards PR #2603 for bot and CI review.
- Confirmed Snyk, SonarCloud, DCO, CodeQL, and GitHub Actions checks were
  passing on #2603; CodeRabbit remained pending after posting release notes.
- Started stacked implementation branch `codex/the-memes-card-a11y-i18n` while
  waiting for the standards merge gate.
- CodeRabbit completed #2603 with no actionable comments; merged standards PR.
- Implemented The Memes list-card i18n helper path and accessibility updates,
  with default route locale remaining `en-US`.
- Opened The Memes list-card implementation PR #2604 as review-ready only.
- Addressed SonarCloud maintainability findings on #2604's i18n helper defaults
  and message interpolation pattern.
- Addressed CodeRabbit feedback on #2604: added page-level Suspense for
  `useSearchParams`, localized the document title, made locale normalization
  case-insensitive, and added exhaustive guards for enum label helpers.
- Fixed `react-doctor:diff` wrapper execution on Windows by resolving Git for
  Windows and invoking the `react-doctor.cmd` shim through the shell; the command
  now runs and reports only the pre-existing unrelated EmojiContext diagnostic.

## 2026-06-12

- Started stacked implementation branch `codex/the-memes-detail-a11y-i18n`
  from `codex/the-memes-card-a11y-i18n`.
- Implemented The Memes detail tab/focus-link accessibility and i18n readiness:
  message-backed primary/history labels, heading and back-link accessible names,
  primary tab `aria-pressed`, and visible focus styling on primary and shared
  history tabs.
- Updated the Memes focus-link docs for current grouped History tab behavior and
  progressive `en-US` fallback debt.
- Validation passed: focused Prettier check, focused ESLint, targeted Jest
  suites for `MemePage`, `MemeShared`, and i18n messages, `typecheck:changed`,
  `lint:changed`, Next MCP runtime check, and desktop/mobile browser smoke on
  `/the-memes/1?focus=history`.
- `react-doctor:diff` exited 0 and continued to report only the pre-existing
  unrelated `contexts/EmojiContext.tsx` fetch-in-effect diagnostic.
- Opened review-ready stacked PR #2607 against PR #2604. Per workstream policy,
  do not merge PR #2607 without human approval.
- Addressed CodeRabbit cleanup feedback on PR #2607 by removing dead
  `MemeTab.title` data and reusing the shared `isMemeFocus` guard in
  `MemePage`.
- Addressed follow-up CodeRabbit feedback on PR #2607 by threading a normalized
  optional `locale` query parameter through the detail UI and metadata path, and
  by documenting focus-key to visible-tab mappings.
- Resolved the fixed CodeRabbit review thread on PR #2607 after confirming the
  head remained green on CodeRabbit and Snyk.
- Started stacked implementation branch `codex/meme-lab-cards-a11y-i18n` from
  PR #2607 for the next safe media-card surface.
- Implemented the first Meme Lab browse/collection card accessibility and i18n
  pass: message-backed sort controls, list headings, loading text, collection
  view labels, card accessible names, card metric labels, locale-aware date,
  number, percent, ETH formatting, locale-preserving sort URLs, and localized
  metadata titles/descriptions.
- Removed `useSearchParams` from the Meme Lab client components by reading
  search params in the server page wrappers and passing plain initial values
  down, following the Next.js docs and clearing the React Doctor Suspense
  warning.
- Fixed Meme Lab collection `view` links for collection names with multiple
  spaces and decoded legacy encoded-space URLs before querying collection data.
- Focused Jest validation passed for Meme Lab card/list helpers, route-param
  helpers, and i18n fallback coverage: 9 suites, 25 tests.
- Focused ESLint, `typecheck:changed`, and `lint:changed` passed. React Doctor
  still reports the unrelated EmojiContext fetch-in-effect diagnostic and
  existing Meme Lab state-shape warnings, but no longer reports the
  `useSearchParams` Suspense warning for this slice.
- Browser smoke passed on desktop and mobile for `/meme-lab?locale=de-DE`,
  `/meme-lab?sort=collections&locale=de-DE`, and the linked collection route.
  Verified sorting region labels, sort direction accessible names, German
  volume/date formatting, card accessible names, collection view accessible
  names, and the fixed collection route loading cards.
- Opened review-ready stacked PR #2608 against PR #2607. Per workstream policy,
  do not merge PR #2608 without human approval.
- SonarCloud initially failed PR #2608 on new-code duplication. Refactored the
  duplicated Meme Lab card rendering, metric formatting, and sort-control setup
  into shared Meme Lab helpers/components, then reran focused validation and
  desktop/mobile browser smoke.
- SonarCloud then reported the PR #2608 quality gate passing with 0.0% new-code
  duplication. CodeRabbit completed with two valid nitpicks and no review
  threads; Claude review remains unavailable because the organization code
  review spending cap has been reached.
- Addressed the CodeRabbit nitpicks by standardizing Meme Lab collection
  search params on `sort_dir` and adding actual multiple-consecutive-space
  route helper coverage.
- Validation for the nitpick fix passed: focused route-param and i18n Jest
  suites, `lint:changed`, `typecheck:changed`, and focused Prettier check.
- Confirmed PR #2608 became CodeRabbit green with no review threads after the
  bot-feedback fix.
- Started stacked branch `codex/rememes-cards-a11y-i18n` from PR #2608 for the
  next safe media-card surface.
- Implemented the Rememes browse card accessibility and i18n pass: server-side
  `meme_id`/`locale` parsing, message-backed labels and accessible names,
  locale-aware result and replica counts, locale-preserving filter URLs, a
  semantic add link, and visible keyboard focus on the random refresh control.
- Focused Rememes validation passed: targeted Jest suites for Rememes component,
  route params, and i18n messages; focused Prettier check; `lint:changed`; and
  `typecheck:changed`.
- React Doctor exited 0 at 97/100. Remaining diagnostics are the pre-existing
  unrelated `contexts/EmojiContext.tsx` fetch-in-effect error and existing
  Rememes component size/state warnings.
- Browser smoke passed on desktop for `/rememes?locale=de-DE` and on mobile for
  `/rememes?locale=de-DE&meme_id=1`. Verified add link, card accessible names,
  logo alt text, refresh accessible name, filter accessible names, count
  formatting, loaded state, and no Next/browser runtime errors.
- Opened review-ready stacked PR #2609 against PR #2608. Per workstream policy,
  do not merge PR #2609 without human approval.
- Confirmed PR #2609 became CodeRabbit green with no review threads; Snyk and
  SonarCloud were already passing. Claude review remains unavailable because
  the organization code review spending cap has been reached.
- Started stacked branch `codex/rememe-detail-a11y-i18n` from PR #2609 for the
  next read-only media detail surface.
- Implemented the Rememe detail accessibility and i18n pass: server-side
  `locale` parsing for page and metadata, message-backed detail labels, tab
  labels, heading/back-link accessible names, `aria-pressed` tab state, visible
  focus styling on detail links/tabs, locale-preserving browse/detail/replica
  and reference links, and locale-aware replica counts.
- Fixed the Rememe reference cards to avoid nested links when
  `ArtistProfileHandle` renders an internal profile link; browser smoke
  confirmed `nestedAnchorCount: 0` after opening the References tab.
- Focused validation passed for the Rememe detail slice: targeted Jest suites
  for the route, detail component, reference helper, route params, browse card
  link preservation, and i18n messages; focused Prettier check;
  `lint:changed`; and `typecheck:changed`.
- React Doctor exited 0 at 96/100. Remaining diagnostics are the pre-existing
  unrelated `contexts/EmojiContext.tsx` fetch-in-effect error and existing
  Rememes component size/state warnings.
- Browser smoke passed on desktop and mobile for
  `/rememes/0x83a079036879f878f438e8df79a76dbd98ec23cf/15?locale=de-DE`.
  Verified document title, heading accessible name, logo alt text, back-link
  locale preservation, References tab selected state, reference-card accessible
  name, reference-card locale preservation, and no nested-anchor/hydration
  errors from the changed surface. Shared local-dev waves/identity/emoji
  requests still log API/403 errors unrelated to this route change.
- Opened review-ready stacked PR #2610 against PR #2609. Per workstream policy,
  do not merge PR #2610 without human approval.
- SonarCloud initially failed PR #2610 on new-code duplication, isolated by the
  Sonar API to the newly added Rememe detail source-message block in
  `i18n/messages/en-US.ts`. Refactored those keys through a typed local
  namespace builder so the public message keys and fallback behavior stay the
  same while the source no longer adds a repeated flat key block.
- Validation for the Sonar follow-up passed: focused i18n Jest suite, focused
  Prettier check, `typecheck:changed`, and `lint:changed`.
- CodeRabbit completed a manual review on PR #2610 after auto-review was
  skipped for the stacked base branch. Accepted both valid quick wins: encoded
  Rememe detail route segments in `getRememeDetailHref` and updated the
  Rememes feature doc's stale `Live` tab reference to `Overview`.
- Validation for the CodeRabbit follow-up passed: focused Rememes route-param
  Jest suite, focused Prettier check, `typecheck:changed`, and `lint:changed`.
- Confirmed PR #2610 became bot-happy on latest head: CodeRabbit completed with
  no actionable comments, Snyk passed, SonarCloud passed with 0.0% new-code
  duplication, DCO passed, and Claude remained skipped by the organization code
  review spending cap. Per workstream policy, do not merge PR #2610 without
  human approval.
- Started stacked branch `codex/meme-lab-detail-a11y-i18n` from PR #2610 for
  the next read-only media detail surface.
- Implemented the Meme Lab detail accessibility and i18n pass: server-side
  `locale` parsing for the page and metadata path, message-backed detail tab
  labels, history sub-tab labels, heading/back-link accessible names,
  `aria-pressed` tab state, visible focus styling on primary tabs,
  locale-preserving card/back/tab/reference links, and locale-aware collectors
  metric formatting.
- Updated the Meme Lab card route feature doc to describe the current
  `Overview`, `Collectors`, `History`, and `References` tab model, legacy
  focus-key mappings, and progressive locale query preservation.
- Focused validation passed for the Meme Lab detail slice: targeted Jest suites
  for the route, detail component, route params, and i18n messages; focused
  Prettier check; `lint:changed`; and `typecheck:changed`.
- React Doctor exited 0 at 94/100. Remaining diagnostics are the unrelated
  dirty `contexts/EmojiContext.tsx` fetch-in-effect error, existing Meme Lab
  component size/state warnings, a false-positive `useSearchParams` Suspense
  warning covered by the route page wrapper, and a test-only `next/image` mock
  warning.
- Browser smoke passed on desktop and mobile for
  `/meme-lab/1?locale=de-DE`. Verified document title, heading accessible name,
  back-link locale preservation, `aria-pressed` tab state, focus-visible tab
  styling, locale-preserving `Collectors`, `References`, and `History` tab
  navigation, collectors/reference/history landmarks, 390px no-overflow mobile
  layout, and practical tap target sizes. Shared local-dev waves/emoji requests
  still log API/403 errors unrelated to this route change.
- Opened review-ready stacked PR #2611 against PR #2610. Per workstream policy,
  do not merge PR #2611 without human approval.
- Addressed CodeRabbit feedback on PR #2611 by updating the remaining Meme Lab
  distribution-route doc reference from `Live` to `Overview`.
- Confirmed PR #2611 became bot-happy on latest head: CodeRabbit completed with
  no actionable comments, Snyk passed, SonarCloud passed, DCO passed, and Claude
  remained skipped by the organization code review spending cap. Per workstream
  policy, do not merge PR #2611 without human approval.
- Started stacked branch `codex/meme-lab-distribution-a11y-i18n` from PR #2611
  for the next safe distribution-route media surface.
- Implemented the initial Meme Lab distribution accessibility and i18n pass:
  server-side `locale` parsing for Meme Lab and The Memes distribution route
  pages, message-backed distribution page copy and metadata title text,
  locale-aware table counts and phase sorting, meaningful distribution photo alt
  text, decorative empty-state icon alt cleanup, scoped wallet table headers,
  a hidden table caption, and locale-preserving `Distribution Plan` links from
  Meme Lab and The Memes detail pages.
- Focused validation passed for the distribution slice: targeted Jest suites
  for distribution route params, Meme Lab distribution route, The Memes
  distribution route, shared Distribution component, The Memes live-panel link
  preservation, and i18n messages; focused Prettier check; `lint:changed`; and
  `typecheck:changed`.
- React Doctor exited 0 at 92/100. Remaining diagnostics are the unrelated
  dirty `contexts/EmojiContext.tsx` fetch-in-effect error, existing large/stateful
  media detail and distribution component warnings, existing `useSearchParams`
  Suspense warnings covered by route page wrappers, a pre-existing distribution
  useEffect-shape warning, and test-only `next/image` mock warnings.
- Browser smoke passed on desktop and mobile for
  `/meme-lab/1/distribution?locale=de-DE`. The local API snapshot returned the
  empty distribution state, so the route/empty-state path was verified in
  browser while the table path is covered by component tests. Verified document
  title, heading, empty-state copy, decorative SummerGlasses alt cleanup,
  `@6529Collections` accessible name, 390px no-overflow mobile layout, and no
  Next.js runtime session errors. Shared local-dev waves/emoji requests still
  log API/403 errors unrelated to this route change.
- Browser smoke also confirmed a real local Meme Lab detail card with
  `has_distribution=true` (`/meme-lab/26?locale=de-DE`) preserves locale in the
  `Distribution Plan` href:
  `/meme-lab/26/distribution?locale=de-DE`.
- Opened review-ready stacked PR #2612 against PR #2611. Per workstream policy,
  do not merge PR #2612 without human approval.
- Addressed valid CodeRabbit feedback on PR #2612 by adding the
  `/the-memes/{id}/distribution` route to the status board, deriving
  distribution phase columns from current data plus locale instead of storing a
  separately sorted state value, covering unsupported locale fallback on both
  distribution route pages, asserting the message-backed table caption, and
  comparing distribution fallback messages to the `en-US` source dictionary.
- Validation for the PR #2612 bot-feedback follow-up passed: focused
  distribution/i18n Jest suites (4 suites, 41 tests), focused Prettier,
  `lint:changed`, `typecheck:changed`, and `react-doctor:diff`. React Doctor
  exited 0 at 95/100 with only the unrelated dirty EmojiContext diagnostic,
  known Distribution component size/state/useEffect warnings, and test-only
  mock warnings.
- Confirmed PR #2612 is bot-happy on latest head `dbfd2f0`: CodeRabbit passed
  with no actionable comments, the prior route-status review thread was
  resolved, DCO passed, SonarCloud passed with 0 new issues, Snyk passed, and
  Claude remained skipped by the organization code review spending cap. Per
  workstream policy, do not merge PR #2612 without human approval.
- Started stacked branch `codex/the-memes-live-stats-a11y-i18n` from PR #2612
  for the next safe The Memes live-stats/detail surface.
- Implemented the initial The Memes Overview live-stats accessibility and i18n
  pass: live-stat labels, creator labels, additional-details control copy, and
  market labels now use source messages with locale fallback; mint dates,
  counts, ranks, percentages, and market numbers use the progressive locale
  formatting helpers; and the shared Collectors stats caller receives the active
  supported locale.
- Focused validation passed for the live-stats slice: targeted live-panel/i18n
  Jest suites (2 suites, 16 tests), focused Prettier, `lint:changed`,
  `typecheck:changed`, and `react-doctor:diff`. React Doctor exited 0 at 94/100
  with only the unrelated dirty EmojiContext fetch-in-effect diagnostic,
  existing route size/state/useSearchParams warnings, and a test-only
  `next/image` mock warning.
- Browser smoke passed for `/the-memes/1?locale=de-DE` on desktop and at a
  390px mobile viewport. Verified German mint-date formatting, localized
  thousands/decimal display, locale-preserving/current distribution link
  behavior, additional-details `aria-expanded`, no horizontal overflow, and no
  Next.js runtime session errors. Shared local-dev waves/emoji requests still
  log API/403 errors unrelated to this route change.
- Opened review-ready stacked PR #2613 against PR #2612. Per workstream policy,
  do not merge PR #2613 without human approval.
- Confirmed PR #2613 is bot-happy on latest head `269928e`: CodeRabbit passed
  with no actionable comments, no review threads were open, DCO passed,
  SonarCloud passed with 0 new issues, Snyk passed, and Claude skipped because
  the organization reached its monthly code review spending cap. Per workstream
  policy, do not merge PR #2613 without human approval.
- Addressed a later CodeRabbit nitpick on PR #2613 by splitting the combined
  The Memes live-stat locale test into separate live-panel and collectors
  percentage tests, so each test renders only the component it verifies.
- Validation for the PR #2613 nitpick follow-up passed: focused
  live-panel/i18n Jest suites (2 suites, 17 tests), focused Prettier,
  `lint:changed`, `typecheck:changed`, and `react-doctor:diff`. React Doctor
  exited 0 at 98/100 with only the unrelated dirty EmojiContext
  fetch-in-effect diagnostic and the existing test-only `next/image` mock
  warning.
- Confirmed PR #2613 is bot-happy again on latest head `0b79960`: CodeRabbit
  completed with no actionable comments, no review threads were open, DCO
  passed, SonarCloud passed, Snyk passed, and Claude remained skipped by the
  organization monthly code review spending cap. Per workstream policy, do not
  merge PR #2613 without human approval.
- Started stacked branch `codex/the-memes-activity-a11y-i18n` from PR #2613
  for the next safe The Memes Card Activity tab surface.
- Implemented the initial The Memes Card Activity accessibility and i18n pass:
  activity region labeling, hidden table caption, message-backed activity
  headings, transaction-type dropdown label/options, loading and empty states,
  and locale-aware ETH volume formatting. Shared `LatestActivityRow`
  transaction copy/date formatting and shared pagination copy remain deferred.
- Validation passed for the activity slice: targeted Card Activity and i18n
  Jest suites (2 suites, 21 tests), focused Prettier, `lint:changed`,
  `typecheck:changed`, and `react-doctor:diff`. React Doctor exited 0 at
  95/100 with only the unrelated dirty EmojiContext fetch-in-effect diagnostic
  and existing `MemePage` size/state/useSearchParams warnings.
- Browser smoke passed on the live local frontend at
  `/the-memes/1?focus=activity&locale=de-DE` for desktop and a 390px mobile
  viewport. Verified document title, selected Card Activity tab, activity
  region label, hidden table caption, German ETH number formatting,
  transaction-type dropdown accessible name/options, 44px dropdown target size,
  no horizontal overflow, and no Next.js runtime session errors. Shared local
  waves/emoji requests still log API/403 errors unrelated to this route change.
- Opened review-ready stacked PR #2614 against PR #2613. Per workstream policy,
  do not merge PR #2614 without human approval.
- Addressed SonarCloud feedback on PR #2614 by replacing the Card Activity
  loading state's explicit `role="status"` wrapper with native `<output>` while
  preserving the translated accessible name.
- Validation for the SonarCloud follow-up passed: focused Card Activity and
  i18n Jest suites (2 suites, 22 tests), focused Prettier, `lint:changed`,
  `typecheck:changed`, and `react-doctor:diff`. React Doctor exited 0 at
  99/100 with only the unrelated dirty EmojiContext fetch-in-effect diagnostic.
- Confirmed PR #2614 is bot-happy on latest head `45caff7`: CodeRabbit passed
  with no actionable comments, SonarCloud passed with 0 new issues, DCO passed,
  Snyk passed, and Claude remained skipped by the organization monthly code
  review spending cap. Per workstream policy, do not merge PR #2614 without
  human approval.
- Started stacked branch `codex/the-memes-timeline-a11y-i18n` from PR #2614
  for the next safe The Memes Timeline tab and shared timeline label surface.
- Implemented the initial shared timeline accessibility and i18n pass:
  The Memes Timeline now exposes a locale-backed region label, the shared
  Timeline accepts an active locale, UTC dates use the progressive date
  formatter, URI/TXN link labels and accessible names are message-backed, link
  icons are hidden from assistive tech, and shared From/To/Value/add/remove
  field labels are message-backed. Timeline media alt text, iframe titles, raw
  metadata values, and event text remain deferred shared-timeline debt.
- Validation passed for the timeline slice: targeted shared Timeline,
  The Memes Timeline, and i18n Jest suites (3 suites, 11 tests), focused
  Prettier, `lint:changed`, `typecheck:changed`, and `react-doctor:diff`.
  React Doctor exited 0 at 95/100 with only the unrelated dirty EmojiContext
  fetch-in-effect diagnostic and existing stacked detail-page
  size/state/useSearchParams warnings.
- Browser smoke passed on the live local frontend for
  `/the-memes/1?focus=timeline&locale=de-DE` at desktop and 390px mobile
  viewports, plus `/meme-lab/1?focus=timeline&locale=de-DE` at desktop. Verified
  selected Timeline tabs, locale-backed region labels, German UTC date
  formatting, URI/TXN accessible link labels, no horizontal overflow, no
  unexpected HTTP failures, and no Next.js runtime session errors.
- Opened review-ready stacked PR #2615 against PR #2614. Per workstream policy,
  do not merge PR #2615 without human approval.
- Addressed CodeRabbit feedback on PR #2615 by removing
  `dangerouslySetInnerHTML` from shared Timeline metadata value rendering.
  Timeline values now render as text with newline-preserving CSS, and a
  regression test covers escaped markup in metadata values.
- Validation for the PR #2615 CodeRabbit follow-up passed: targeted shared
  Timeline, The Memes Timeline, and i18n Jest suites (3 suites, 12 tests),
  focused Prettier, `lint:changed`, `typecheck:changed`, and
  `react-doctor:diff`. React Doctor exited 0 at 99/100 with only the unrelated
  dirty EmojiContext fetch-in-effect diagnostic.
- Confirmed PR #2615 is bot-happy on latest head `bd8ba44`: CodeRabbit passed
  with its prior thread marked resolved/outdated, SonarCloud passed, DCO
  passed, Snyk passed, and Claude remained skipped by the organization monthly
  code review spending cap. Per workstream policy, do not merge PR #2615
  without human approval.
- Started stacked branch `codex/timeline-media-a11y-i18n` from PR #2615 for the
  next shared Timeline media semantics slice.
- Implemented the shared Timeline media accessibility and i18n pass: Timeline
  media previews now receive the active locale and localized change label,
  images use message-backed alt text through `next/image`, videos use translated
  accessible labels, and HTML timeline embeds use translated iframe titles.
- Validation passed for the Timeline media slice: targeted shared Timeline,
  Timeline media, The Memes Timeline, and i18n Jest suites (4 suites, 15 tests),
  focused Prettier, `lint:changed`, `typecheck:changed`, and
  `react-doctor:diff`. React Doctor exited 0 at 99/100 with only the unrelated
  dirty EmojiContext fetch-in-effect diagnostic.
- Browser smoke passed on the live local frontend for
  `/meme-lab/1?focus=timeline&locale=de-DE` at desktop and a 390px mobile
  viewport. Verified the Meme Lab timeline region, German UTC timeline dates,
  timeline image alt text (`From preview image`, `To preview image`), no
  horizontal overflow, and no Next.js runtime session errors. Shared local
  API/resource requests still log unrelated browser console failures.
- Opened review-ready stacked PR #2616 against PR #2615. Per workstream policy,
  do not merge PR #2616 without human approval.
- Confirmed PR #2616 is bot-happy on latest head `d1d146d`: CodeRabbit passed
  with no review threads, SonarCloud passed, DCO passed, Snyk passed, and
  Claude remained skipped by the organization monthly code review spending cap.
  Per workstream policy, do not merge PR #2616 without human approval.
- Started stacked branch `codex/the-memes-art-viewer-a11y-i18n` from PR #2616
  for the next The Memes Art Viewer action-label slice.
- Implemented the initial The Memes Art Viewer accessibility and i18n pass:
  active detail-page locale now reaches the header Art Viewer, shared media
  action toolbars accept optional localized labels with English defaults, and
  the Art Viewer routes fullscreen/open/download/downloading/close controls,
  previous/next media buttons, and save dialog titles through source messages.
- Validation passed for the Art Viewer slice: targeted The Memes Art Viewer,
  The Memes page, and i18n Jest suites (3 suites, 37 tests), focused Prettier,
  `lint:changed`, `typecheck:changed`, and `react-doctor:diff`. React Doctor
  exited 0 at 95/100 with only the unrelated dirty EmojiContext diagnostic and
  existing `MemePage` size/state/useSearchParams warnings.
- Browser smoke passed on the live local frontend for
  `/the-memes/1?focus=the-art&locale=de-DE` at desktop and a 390px responsive
  viewport. Verified Art media action accessible names, no horizontal overflow,
  and no Next.js runtime session errors. A strict mobile-user-agent smoke only
  rendered the compact route shell in this local setup, so target Art controls
  were verified with the 390px viewport instead.
- Opened review-ready stacked PR #2617 against PR #2616. Per workstream policy,
  do not merge PR #2617 without human approval.
- Confirmed PR #2617 is bot-happy on latest head `5987023`: CodeRabbit passed
  with no actionable comments or review threads, DCO passed, SonarCloud passed,
  Snyk passed, and Claude remained skipped by the organization monthly code
  review spending cap. Per workstream policy, do not merge PR #2617 without
  human approval.
- Started stacked branch `codex/the-memes-art-details-a11y-i18n` from PR #2617
  for the next The Memes Art details row/link-label slice.
- Implemented the initial The Memes Art details accessibility and i18n pass:
  the active detail-page locale now reaches the Art details component; section
  headings, metric labels, empty states, Arweave open labels, visible open text,
  and download progress/completion labels use source messages; and TDH/rank
  values use locale-aware number formatting. Property trait names/values, media
  URLs, and raw NFT metadata remain source-data copy.
- While validating the Art details slice, tightened the shared text-style
  `Download` action and Art Arweave `Open` links to 24px minimum target height,
  and replaced Download's clickable status icons with semantic icon buttons.
- Validation passed for the Art details slice: targeted Download, The Memes Art
  details, The Memes live submenu, and i18n Jest suites (4 suites, 31 tests),
  focused Prettier, `lint:changed`, `typecheck:changed`, and
  `react-doctor:diff`. React Doctor exited 0 at 99/100 with only the unrelated
  dirty `contexts/EmojiContext.tsx` fetch-in-effect diagnostic.
- Browser smoke passed on the live local frontend for
  `/the-memes/1?focus=the-art&locale=de-DE` at desktop and a 390px responsive
  viewport. Verified additional details are expanded for the `the-art` focus
  key, Art details section headings and Arweave open/download accessible names,
  German number formatting in details, 24px row action targets, no horizontal
  overflow, no page errors in the mobile smoke, and no Next.js runtime session
  errors. Shared local API/resource requests still log unrelated browser console
  failures in the desktop session.
- Opened review-ready stacked PR #2618 against PR #2617. Per workstream policy,
  do not merge PR #2618 without human approval.
- Addressed CodeRabbit feedback on PR #2618 by marking the route-status row as
  review-ready only and matching the download-progress fallback test to the
  formatted string passed by production code.
- Validation for the PR #2618 bot-feedback follow-up passed: focused i18n Jest
  suite, focused Prettier, `lint:changed`, and `typecheck:changed`.
- Started stacked branch `codex/the-memes-references-a11y-i18n` from PR #2618
  for the next The Memes References tab accessibility and i18n slice.
- Implemented the initial References tab pass: the active detail-page locale now
  reaches the References tab; Meme Lab/ReMemes descriptions, logo alt text, sort
  trigger/options, refresh labels, ReMeme empty state, ReMeme card accessible
  names, locale-preserving ReMeme links, and replica counts use progressive
  messages/formatters; and the refresh icon is now a semantic button with an
  accessible name.
- While validating the References slice, grouped the References tab's related
  Meme Lab and ReMeme fetch/result state into reducers to remove the
  component-specific React Doctor state warnings.
- Validation passed for the References slice: targeted The Memes live submenu
  and i18n Jest suites (2 suites, 19 tests), `lint:changed`,
  `typecheck:changed`, and `react-doctor:diff`. React Doctor exited 0 at 95/100
  with only the unrelated dirty `contexts/EmojiContext.tsx` fetch-in-effect
  diagnostic and pre-existing broad `MemePage` warnings.
- Browser smoke passed on the live local frontend for
  `/the-memes/1?focus=references&locale=de-DE` at desktop and a 390px mobile
  viewport. Verified selected References tab state, Meme Lab/ReMemes logo alt
  text and descriptions, refresh button accessible name and 24px minimum target,
  locale-preserving ReMeme links, no horizontal overflow, no mobile page errors,
  and no Next.js runtime session errors.
- Opened review-ready stacked PR #2619 against PR #2618. Per workstream policy,
  do not merge PR #2619 without human approval.
- Addressed CodeRabbit feedback on PR #2619 by aligning the Meme Lab reducer
  with the action-object pattern used by the ReMeme reducer.
- Validation for the PR #2619 bot-feedback follow-up passed: targeted The Memes
  live submenu and i18n Jest suites (2 suites, 19 tests), `lint:changed`,
  `typecheck:changed`, and `react-doctor:diff`. React Doctor exited 0 at
  98/100 with the unrelated dirty `contexts/EmojiContext.tsx`
  fetch-in-effect diagnostic and the pre-existing long References component
  warning.
- Confirmed PR #2619 is bot-happy on latest head: CodeRabbit passed, DCO
  passed, SonarCloud passed, and Snyk passed. Per workstream policy, do not
  merge PR #2619 without human approval.
- Started stacked branch `codex/meme-calendar-periods-a11y-i18n` from PR #2619
  for the next The Memes header calendar period strip accessibility and i18n
  slice.
- Implemented the initial calendar period strip pass: the active detail-page
  locale now reaches `MemeCalendarPeriods`; season/period labels and accessible
  names use source messages; period numbers use locale-aware formatting; season
  links preserve non-default locales; the secondary period cluster is a
  labelled group; and the season link has visible focus plus a 24px minimum
  target.
- Validation passed for the calendar period strip slice: targeted The Memes
  page and i18n Jest suites (2 suites, 24 tests), `lint:changed`, and
  `typecheck:changed`. React Doctor exited 0 at 95/100 with the unrelated dirty
  `contexts/EmojiContext.tsx` fetch-in-effect diagnostic and pre-existing broad
  `MemePage` warnings from the stacked diff.
- Browser smoke passed on the live local frontend for
  `/the-memes/1?locale=de-DE` at desktop and a 390px mobile viewport. Verified
  locale-preserving season link href, labelled period group, 24px season-link
  target, no horizontal overflow, no mobile page errors, and no Next.js runtime
  session errors.
- Opened review-ready stacked PR #2620 against PR #2619. Per workstream policy,
  do not merge PR #2620 without human approval.
- Confirmed PR #2620 is bot-happy on latest head: CodeRabbit passed with no
  actionable comments, DCO passed, SonarCloud passed, Snyk passed, and Claude
  remained skipped by the organization monthly code review spending cap. Per
  workstream policy, do not merge PR #2620 without human approval.
- Started stacked branch `codex/meme-calendar-overview-a11y-i18n` from PR
  #2620 for the next `/meme-calendar` overview shell accessibility and i18n
  slice.
- Implemented the initial Meme Calendar overview pass: `/meme-calendar` reads
  the optional `locale` query, the timezone toggle exposes pressed state and
  message-backed accessible names, the overview heading/full-calendar link,
  next-mint controls/headings/countdown labels, screenshot label,
  upcoming-card heading/empty state, mint numbers, and calendar invite link
  accessible names use progressive messages/formatters. The lower custom
  calendar grid remains deferred.
- Added semantic, screen-reader-only headers to the upcoming-mints overview
  table so the touched table surface exposes column meaning without changing
  the visual layout.
- Validation passed for the Meme Calendar overview shell slice: targeted
  calendar and i18n Jest suites (4 suites, 23 tests), `lint:changed`,
  `typecheck:changed`, and `react-doctor:diff` exit 0. React Doctor still
  reports the unrelated dirty `contexts/EmojiContext.tsx` fetch-in-effect
  diagnostic.
- Browser smoke passed on the live local frontend for
  `/meme-calendar?locale=de-DE` at desktop and
  `/meme-calendar?locale=fr-FR` at a 390px mobile viewport. Verified timezone
  pressed state, semantic table headers, calendar invite accessible names,
  labelled Meme # input, no horizontal overflow, no mobile page errors, and no
  Next.js runtime session errors. Local console resource errors were from the
  shared backend/emoji feed.
- Opened review-ready stacked PR #2621 against PR #2620. Per workstream policy,
  do not merge PR #2621 without human approval.
- Addressed SonarCloud issue `typescript:S6819` on PR #2621 by replacing the
  timezone toggle's generic `role="group"` wrapper with native
  `fieldset`/`legend` semantics. Re-ran targeted calendar/i18n tests,
  `lint:changed`, `typecheck:changed`, `react-doctor:diff`, and a live browser
  smoke on `/meme-calendar?locale=de-DE`; all passed except the unchanged
  unrelated React Doctor diagnostic in `contexts/EmojiContext.tsx`.
- Addressed CodeRabbit's defensive `printCalendarInvites` note by escaping the
  generated `fontColor` style attribute and adding regression coverage for
  quote/apostrophe/color escaping. Re-ran targeted calendar/i18n tests,
  `lint:changed`, `typecheck:changed`, `react-doctor:diff`, and a live browser
  smoke on `/meme-calendar?locale=de-DE`.
- Confirmed PR #2621 is bot-happy on latest head: CodeRabbit completed with no
  actionable comments, DCO passed, SonarCloud passed with 0 new issues, and
  Snyk passed. Claude did not produce a code review after `@claude review once`
  and left the repository-configured manual review instruction comment only.
  Per workstream policy, do not merge PR #2621 without human approval.
- Started stacked branch `codex/meme-calendar-grid-a11y-i18n` from PR #2621 for
  the next `/meme-calendar` lower grid/control accessibility and i18n slice.
- Implemented the first lower custom calendar pass: lower zoom controls now use
  native `fieldset`/`legend` semantics and message-backed pressed-state
  buttons; the guide toggle is a named icon button controlling a labelled
  region; previous/next controls have accessible names; jump controls use real
  labels; default SZN month names, mint-day accessible names, mint numbers,
  ranges, and calendar invite event text use locale-aware helpers.
- Validation passed for the lower grid/control slice: focused calendar/i18n
  Jest suites (5 suites, 27 tests), `lint:changed`, `typecheck:changed`, and
  `react-doctor:diff` exit 0. React Doctor still reports the unrelated dirty
  `contexts/EmojiContext.tsx` fetch-in-effect diagnostic plus broad
  `MemeCalendar` component-size/state/renderView warnings left as follow-up
  refactor debt.
- Browser smoke passed on the live local frontend for
  `/meme-calendar?locale=de-DE` at desktop and
  `/meme-calendar?locale=fr-FR` at a 390px mobile viewport. Verified guide
  toggle state, labelled region, named previous/next controls, labelled
  `Meme #` input, hidden mobile `Date` input, localized month/mint-day labels,
  no horizontal overflow, and no Next.js runtime session errors. Local console
  resource errors were from the shared backend/emoji feed.
- Opened review-ready stacked PR #2622 against PR #2621. Per workstream policy,
  do not merge PR #2622 without human approval.
- Addressed SonarCloud feedback on PR #2622 by replacing the guide panel's
  generic `role="region"` with a native labelled `section` and extracting the
  lower-calendar month cell metadata/tooltip rendering from the inline map to
  reduce cognitive complexity. Re-ran the focused calendar/i18n Jest suites,
  `lint:changed`, `typecheck:changed`, `react-doctor:diff`, and a live browser
  smoke on `/meme-calendar?locale=de-DE`.
- Started stacked branch `codex/meme-calendar-drilldown-a11y-i18n` from PR
  #2622 for the next `/meme-calendar` lower drilldown card accessibility and
  i18n slice.
- Implemented the lower drilldown card pass: `Year`, `Epoch`, `Period`, `Era`,
  and `Eon` views now receive the active locale; card titles, date ranges, mint
  ranges, and accessible button names are routed through message/format helpers;
  drilldown cards also expose consistent focus-visible styling.
- Validation passed for the lower drilldown card slice: focused calendar/i18n
  Jest suites (5 suites, 28 tests), `lint:changed`, `typecheck:changed`, and
  `react-doctor:diff` exit 0. React Doctor still reports the unrelated dirty
  `contexts/EmojiContext.tsx` fetch-in-effect diagnostic plus the existing
  broad `MemeCalendar` component-size/state/renderView warnings.
- Browser smoke passed on the live local frontend for
  `/meme-calendar?locale=de-DE` at desktop and
  `/meme-calendar?locale=fr-FR` at a 390px mobile viewport. Verified
  drilldown card accessible names, localized month labels, ungrouped calendar
  years, hidden mobile `Date` input, no horizontal overflow, and no Next.js
  runtime session errors. Local console resource errors were from the shared
  backend waves endpoints and blocked emoji feed.
- Opened review-ready stacked PR #2623 against PR #2622. Per workstream policy,
  do not merge PR #2623 without human approval.
- Addressed SonarCloud's new-code duplication gate on PR #2623 by extracting
  the repeated lower-calendar drilldown button markup into a shared
  `DrilldownCard` component and the repeated SZN1 launch-period branch into
  `HistoricalLaunchDrilldownCard`. Re-ran the focused calendar/i18n Jest
  suites, `lint:changed`, `typecheck:changed`, `react-doctor:diff`, and
  desktop/mobile browser smoke on `/meme-calendar`; all remained green apart
  from the known React Doctor follow-up diagnostics.
- Addressed CodeRabbit's non-blocking cleanup notes on PR #2623 by
  consolidating mint-range number formatting on `formatInteger` and renaming
  drilldown card data from `label` to `mints`. Re-ran the focused
  calendar/i18n Jest suites, `lint:changed`, `typecheck:changed`, and
  `react-doctor:diff`; results remained green apart from the known React Doctor
  follow-up diagnostics.
- Confirmed PR #2623 is bot-happy on the latest head: Snyk passed, CodeRabbit
  passed with no open review threads, and SonarCloud had already reported 0 new
  issues and 0.0% duplication. Claude remained configured for manual review and
  did not leave an actionable review. Per workstream policy, do not merge PR
  #2623 without human approval.
- Started stacked branch `codex/rememes-browse-card-followup-a11y-i18n` from
  PR #2623 for a small `/rememes` browse-card follow-up.
- Implemented the Rememes browse follow-up: card results now render as a
  labelled list/listitem structure, the list label is message-backed, the Add
  ReMeme header action preserves non-default `locale` query values via the
  existing locale-aware href helper, and missing Rememe image fallbacks render a
  named placeholder instead of handing `src=""` to `next/image`.
- Focused validation passed for the Rememes browse follow-up:
  `pnpm run test -- --runTestsByPath __tests__/components/rememes/Rememes.test.tsx __tests__/components/rememes/rememesRouteParams.test.ts __tests__/components/nft-image/RememeImage.test.tsx __tests__/i18n/messages.test.ts --coverage=false --runInBand --silent --verbose=false`
  with `SEIZE_6529_COMMAND=1` (4 suites, 17 tests), `lint:changed`,
  `typecheck:changed`, and `react-doctor:diff` exit 0. React Doctor still
  reports the unrelated dirty `contexts/EmojiContext.tsx` fetch-in-effect
  diagnostic plus pre-existing broad `Rememes` component-size/state warnings.
  Direct `6529` wrapper invocation remains blocked in this shell by the local
  Windows/WSL wrapper path/line-ending handoff, so the guarded script path was
  used.
- Browser smoke passed on the live local frontend for
  `/rememes?locale=de-DE` at desktop and `/rememes?locale=fr-FR` at a 390px
  mobile viewport. Verified labelled results list, 40 list items, Add ReMeme
  locale-preserving href, no horizontal overflow, and no Next.js runtime
  session errors. Remaining browser console errors were shared backend waves,
  blocked emoji feed, or third-party media resource loads.
- Opened review-ready stacked PR #2624 against PR #2623. Per workstream policy,
  do not merge PR #2624 without human approval.
- Addressed SonarCloud's PR #2624 issues by simplifying optional chaining,
  removing the redundant explicit list role, and replacing the missing-image
  placeholder `role="img"` with a real `next/image` placeholder carrying `alt`.
  Re-ran the focused Rememes/image/i18n Jest suites, `lint:changed`,
  `typecheck:changed`, `react-doctor:diff`, and a live browser smoke on
  `/rememes?locale=de-DE`; results remained green apart from the known React
  Doctor follow-up diagnostics.
- Addressed CodeRabbit's PR #2624 video fallback finding by including the
  top-level `nft.animation` URL in Rememe video fallback candidates and adding
  regression coverage for top-level animation with empty metadata animation.
  Re-ran the focused Rememes/image/i18n Jest suites (4 suites, 18 tests),
  `lint:changed`, `typecheck:changed`, and `react-doctor:diff`; results
  remained green apart from the unrelated dirty EmojiContext React Doctor
  diagnostic.
- Started stacked branch `codex/memelab-browse-card-a11y-i18n-followup` from
  PR #2624 for a small Meme Lab browse/collection card follow-up.
- Implemented labelled list/listitem semantics for Meme Lab ungrouped,
  artist-grouped, collection-grouped, and collection-route card grids. Added
  message-backed list labels, locale-preserving grouped collection `view`
  links, and regression coverage for grouped list labels, list items, collection
  href preservation, collection-route card href preservation, and fallback
  messages.
- Validation passed for the Meme Lab browse follow-up: focused Meme Lab,
  Rememe image, and i18n Jest suites (4 suites, 15 tests), focused Prettier
  check, `lint:changed`, `typecheck:changed`, and `react-doctor:diff`.
  React Doctor still reports the unrelated dirty EmojiContext diagnostic plus
  existing Meme Lab state/refactor warnings.
- Browser smoke passed on the live local frontend for
  `/meme-lab?sort=collections&locale=de-DE` at desktop and
  `/meme-lab/collection/6529-Intern-JPGs?locale=fr-FR` at a 390px mobile
  viewport. Verified labelled card lists, locale-preserving collection/card
  links, no horizontal overflow, and no Next.js runtime session errors.
- Opened review-ready stacked PR #2625 against PR #2624. Per workstream policy,
  do not merge PR #2625 without human approval.
- Addressed SonarCloud's PR #2625 test-helper issue by hoisting the default
  Meme Lab props object into a stable module constant. Re-ran the focused Meme
  Lab card-grid test, Prettier check, `lint:changed`, and
  `typecheck:changed`; results remained green.
- Confirmed PR #2625 is bot-happy on the latest head: Snyk passed,
  CodeRabbit passed with no open review threads, and SonarCloud reported 0 new
  issues. Claude remained configured for manual review and did not leave an
  actionable review. Per workstream policy, do not merge PR #2625 without human
  approval.
- Started stacked branch `codex/user-collected-cards-a11y-i18n` from PR #2625
  for a low-risk `/{user}/collected` native card list follow-up.
- Implemented labelled list/listitem semantics for profile native collected
  card results. Added source message key `user.collected.cards.listLabel`,
  fallback coverage, component assertions for list semantics and empty-state
  behavior, and Collected-tab feature docs.
- Validation passed for the profile collected card list follow-up: focused
  collected-card/i18n Jest suites (2 suites, 6 tests), focused Prettier check,
  `lint:changed`, `typecheck:changed`, and `react-doctor:diff`. React Doctor
  still reports only the unrelated dirty EmojiContext diagnostic.
- Browser smoke passed on the live local frontend for `/punk6529/collected` at
  desktop and a 390px mobile viewport. Verified one labelled `Collected cards`
  list, 24 direct list items, no horizontal overflow, and no Next.js runtime
  session errors. Console resource errors were shared backend/resource noise.
- Opened review-ready stacked PR #2626 against PR #2625. Per workstream policy,
  do not merge PR #2626 without human approval.
- Addressed CodeRabbit's PR #2626 Safari/VoiceOver list-semantics finding by
  adding an explicit `role="list"` to the collected cards `ul` and hoisting the
  static list label. Re-ran the focused collected-card/i18n Jest suites,
  Prettier check, `lint:changed`, and `typecheck:changed`; results remained
  green.
- Addressed CodeRabbit's PR #2626 tracker wording finding by updating the
  outdated collected-surface status to collected card list wording.
- Addressed the PR #2626 SonarCloud/CodeRabbit role conflict by keeping the
  explicit `list` role for Safari/VoiceOver compatibility behind a small
  compatibility prop object with a local rationale.
- Confirmed PR #2626 is bot-happy on the latest head: Snyk passed, CodeRabbit
  passed with all review threads resolved, and SonarCloud reported 0 new
  issues. Claude remains configured for manual review and did not leave an
  actionable review. Per workstream policy, do not merge PR #2626 without human
  approval.
- Started stacked branch `codex/user-collected-network-cards-a11y-i18n` from
  PR #2626 for a low-risk `/{user}/collected` network card-list follow-up.
- Implemented labelled list/listitem semantics for profile network collected
  card results. Added source message keys for the list label, empty state,
  fallback token/collection names, image alt text, token number label, and xTDH
  labels, plus focused component and fallback-message coverage.
- Validation passed for the profile collected network-card follow-up: focused
  network-card/i18n Jest suites (2 suites, 5 tests), focused Prettier check,
  `lint:changed`, `typecheck:changed`, and `react-doctor:diff`. React Doctor
  still reports only the unrelated dirty EmojiContext diagnostic.
- Browser smoke passed on the live local frontend for
  `/punk6529/collected?collection=network`. The local seed data returns the
  network empty state, so non-empty list semantics are covered by component
  tests. Verified localized `No network tokens found` copy, no horizontal
  overflow, and no Next.js runtime session errors. Console errors were shared
  backend wave endpoints and blocked emoji feed noise.
- Opened review-ready stacked PR #2627 against PR #2626. Per workstream policy,
  do not merge PR #2627 without human approval.
- Confirmed PR #2627 is bot-happy on the latest head: DCO passed, Snyk passed,
  CodeRabbit passed with no review threads, and SonarCloud reported 0 new
  issues. Claude remains configured for manual review and did not leave an
  actionable review. Per workstream policy, do not merge PR #2627 without human
  approval.
- Started stacked branch `codex/user-collected-empty-states-a11y-i18n` from
  PR #2627 for a low-risk `/{user}/collected` empty-state follow-up.
- Implemented message-backed native collected empty-state copy and native
  `<output>` status semantics while preserving existing filter and full-set
  behavior. Reused the network empty-state message from PR #2627.
- Validation passed for the empty-state follow-up: focused collected empty-state
  and i18n Jest suites (2 suites, 8 tests), focused Prettier check,
  `lint:changed`, `typecheck:changed`, and `react-doctor:diff`. React Doctor
  still reports only the unrelated dirty `contexts/EmojiContext.tsx`
  fetch-in-effect diagnostic.
- Browser smoke passed on the live local frontend for
  `/punk6529/collected?collection=memes&seized=seized`. Local seed data returned
  the non-empty collected list rather than the empty-state branch, so the status
  region is covered by component tests. Verified no horizontal overflow and no
  Next.js runtime session errors. Console errors were shared backend wave
  endpoints and blocked emoji feed noise.
- Opened review-ready stacked PR #2628 against PR #2627. Per workstream policy,
  do not merge PR #2628 without human approval.
- Addressed SonarCloud's PR #2628 native-status finding by replacing explicit
  `role="status"` with `<output>`, then addressed CodeRabbit's active-context
  wording nit. Re-ran focused empty-state/i18n tests, focused Prettier check,
  `lint:changed`, `typecheck:changed`, `react-doctor:diff`, and
  `git diff --check`; results remained green apart from the known unrelated
  EmojiContext React Doctor diagnostic.
- Confirmed PR #2628 is bot-happy on the latest head: DCO passed, Snyk passed,
  SonarCloud passed with 0 new issues, CodeRabbit passed with no review threads,
  and Claude remained configured for manual review only. Per workstream policy,
  do not merge PR #2628 without human approval.
- Started stacked branch `codex/user-collected-sort-controls-a11y-i18n` from
  PR #2628 for a low-risk `/{user}/collected` filter-control follow-up.
- Implemented message-backed collected filter labels for View, Native/Network,
  Collection, All/All Collections, Unknown Collection, Sort By, collection sort
  options, Seized filter options, and horizontal filter-scroll buttons. Removed
  derived sort-item state in favor of memoized source-label items and made the
  touched filter-strip scroll listener passive.
- Focused validation passed for the filter-control follow-up: collected filter
  and i18n Jest suites (6 suites, 17 tests), focused Prettier check,
  `lint:changed`, `typecheck:changed`, and `react-doctor:diff`. React Doctor
  still reports only the unrelated dirty `contexts/EmojiContext.tsx`
  fetch-in-effect diagnostic.
- Browser smoke passed on the live local frontend for `/punk6529/collected` at
  desktop and a 390px mobile viewport. Verified source-message filter labels,
  filter accessible names, no horizontal overflow, no page errors, and no
  Next.js runtime session errors. Console errors were shared backend wave
  endpoints and blocked emoji feed noise.
- Opened review-ready stacked PR #2629 against PR #2628. Per workstream policy,
  do not merge PR #2629 without human approval.
- Confirmed PR #2629 is bot-happy on the latest head: DCO passed, Snyk passed,
  SonarCloud passed with 0 new issues, CodeRabbit passed with no review threads,
  and Claude remained configured for manual review only. Per workstream policy,
  do not merge PR #2629 without human approval.
- Started stacked branch `codex/user-collected-season-strip-a11y-i18n` from PR
  #2629 for a low-risk `/{user}/collected` season-strip follow-up.
- Implemented message-backed source-locale labels for the collected season
  strip: `Seasons`, started count, desktop show more/less controls, unseized
  label, and season tile set-count plural labels. Extracted the tile renderer
  into a stable `SeasonTiles` component to avoid React Doctor render-helper
  warnings.
- Validation passed for the season-strip follow-up: focused season/i18n Jest
  suites (3 suites, 26 tests), focused Prettier check, `lint:changed`,
  `typecheck:changed`, and `react-doctor:diff`. React Doctor still reports only
  the unrelated dirty `contexts/EmojiContext.tsx` fetch-in-effect diagnostic.
- Browser smoke passed on the live local frontend for `/punk6529/collected` at
  desktop and a 390px mobile viewport. Verified message-backed season heading
  and started count, button season tiles, no page errors, and no Next.js
  runtime session errors. Mobile horizontal overflow came from existing
  scrollable strips, including the season carousel. Console resource errors
  were shared backend wave endpoints and blocked emoji feed noise.
- Opened review-ready stacked PR #2630 against PR #2629. Per workstream policy,
  do not merge PR #2630 without human approval.
- Confirmed PR #2630 is bot-happy on the latest head: DCO passed, Snyk passed,
  SonarCloud passed with 0 new issues, CodeRabbit manual review passed with no
  review threads, and Claude remained configured for manual review only. Per
  workstream policy, do not merge PR #2630 without human approval.
- Started stacked branch `codex/user-collected-stats-summary-a11y-i18n` from
  PR #2630 for a low-risk `/{user}/collected` stats-summary follow-up.
- Implemented message-backed source-locale copy for collected header metric
  labels, multiplier values, unique-count copy, the `Details`/`Hide Details`
  toggle, the stats-unavailable message, and remaining season tile label/detail
  copy. Marked the Details icon decorative for assistive technologies.
- Validation passed for the stats-summary follow-up: focused stats/season/i18n
  Jest suites (3 suites, 27 tests), focused Prettier write/check during the
  edit loop, `lint:changed`, `typecheck:changed`, and `react-doctor:diff`.
  React Doctor still reports only the unrelated dirty `contexts/EmojiContext.tsx`
  fetch-in-effect diagnostic.
- Browser smoke passed on the live local frontend for `/punk6529/collected` at
  desktop and a 390px mobile viewport. Verified source-message metric labels,
  season tile detail text, Details/Hide Details toggle text, `aria-expanded`
  state changes, no page errors, and no Next.js runtime session errors. Mobile
  horizontal overflow came from existing scrollable strips. Console resource
  errors were shared backend wave endpoints and blocked emoji feed noise.
- Opened review-ready stacked PR #2631 against PR #2630. Per workstream policy,
  do not merge PR #2631 without human approval.
- Addressed SonarCloud's PR #2631 new-code duplication gate by moving the
  collected stats message keys into a typed `namespaceMessages` block while
  preserving the same public message keys. Re-ran focused stats/season/i18n
  Jest suites, `lint:changed`, `typecheck:changed`, and `react-doctor:diff`;
  results remained green apart from the known unrelated EmojiContext diagnostic.
- Confirmed PR #2631 is bot-happy on the latest head: DCO passed, Snyk passed,
  SonarCloud passed with 0 new issues and 0.0% duplication, CodeRabbit manual
  review passed with no review threads, and Claude remained configured for
  manual review only. Per workstream policy, do not merge PR #2631 without
  human approval.
- Started stacked branch `codex/user-collected-details-tables-a11y-i18n` from
  PR #2631 for the next low-risk `/{user}/collected` Details-panel follow-up.
- Implemented message-backed source-locale labels for the expanded collected
  details tables, added screen-reader table captions, promoted touched row
  labels to table row headers, added column scopes, and moved touched collected
  table counts/percent copy through the repo i18n formatting helpers. Hid the
  visual separator rows from assistive technologies.
- Validation passed for the details-table follow-up: focused collected
  stats/shared-table/i18n Jest suites (3 suites, 6 tests), focused Prettier
  write/check during the edit loop, `lint:changed`, `typecheck:changed`,
  `react-doctor:diff`, and `git diff --check`. React Doctor still reports only
  the unrelated dirty `contexts/EmojiContext.tsx` fetch-in-effect diagnostic.
- Browser smoke passed on the live local frontend for `/punk6529/collected` at
  desktop and 390px mobile viewport. Verified `Details` opens, collected table
  captions, scoped column headers, row headers, hidden separator rows, no
  desktop or mobile page overflow, and no Next.js runtime session errors.
  Console resource errors were shared backend wave endpoints and blocked emoji
  feed noise.
- Opened review-ready stacked PR #2633 against PR #2631. Per workstream policy,
  do not merge PR #2633 without human approval.
- Addressed SonarCloud's PR #2633 new-code duplication gate by refactoring the
  collected details table headers/rows into mapped column definitions and
  small reusable cells while preserving the rendered table semantics. Re-ran
  focused collected stats/shared-table/i18n Jest suites, `lint:changed`,
  `typecheck:changed`, `react-doctor:diff`, `git diff --check`, and a live
  browser DOM smoke; results remained green apart from the known unrelated
  EmojiContext diagnostic and shared backend/emoji console noise.
- Narrowed the remaining PR #2633 SonarCloud duplication finding to the new
  source-locale message entries and moved the collected details message group
  to an object-backed helper while preserving all public message keys. Re-ran
  focused collected stats/shared-table/i18n Jest suites, `lint:changed`,
  `typecheck:changed`, `react-doctor:diff`, and `git diff --check`; results
  remained green apart from the known unrelated EmojiContext diagnostic.
- Confirmed PR #2633 is bot-happy on the latest head: DCO passed, Snyk passed,
  SonarCloud passed, CodeRabbit manual review passed, there are no review
  threads, and Claude remained configured for manual review only. Per
  workstream policy, do not merge PR #2633 without human approval.
- Started stacked branch `codex/user-collected-boost-breakdown-a11y-i18n` from
  PR #2633 for the next low-risk `/{user}/collected` Details-panel follow-up.
- Implemented message-backed source-locale labels for the Boost Breakdown
  heading, TDH version link, table caption, columns, row labels, season labels,
  and total boost tooltip copy. Added a screen-reader table caption, promoted
  touched row labels to row headers, moved boost numeric values through the
  repo i18n formatting helper, and made info tooltip triggers keyboard
  focusable with accessible names.
- Validation passed for the Boost Breakdown follow-up: focused boost
  breakdown/i18n Jest suites (3 suites, 8 tests), `lint:changed`,
  `typecheck:changed`, `react-doctor:diff`, and `git diff --check`. React
  Doctor still reports only the unrelated dirty `contexts/EmojiContext.tsx`
  fetch-in-effect diagnostic.
- Browser smoke passed on the live local frontend for `/punk6529/collected` at
  desktop and a 390px mobile viewport. Verified `Details` opens, Boost
  Breakdown renders with a screen-reader table caption, scoped column headers,
  row headers, keyboard-focusable tooltip buttons with accessible names, no
  page-level mobile overflow, and no Next.js runtime session errors. Console
  resource errors were shared backend wave endpoints and blocked emoji feed
  noise.
- Opened review-ready stacked PR #2634 against PR #2633. Per workstream policy,
  do not merge PR #2634 without human approval.
- Confirmed PR #2634 is bot-happy on the latest head: DCO passed, Snyk passed,
  SonarCloud passed, CodeRabbit manual review passed, there are no review
  threads, and Claude remained configured for manual review only. Per
  workstream policy, do not merge PR #2634 without human approval.
- Started stacked branch `codex/user-collected-activity-overview-a11y-i18n`
  from PR #2634 for the next low-risk `/{user}/collected` Details-panel
  follow-up.
- Implemented message-backed source-locale labels for the Activity Overview
  heading, accordion headings, table captions, columns, row labels, season
  labels, and numeric/ETH values. Refactored repeated overview and per-season
  activity rows into typed row/column configs, added screen-reader table
  captions, and promoted touched row labels to row headers.
- Validation passed for the Activity Overview follow-up: focused activity
  overview/i18n Jest suites (2 suites, 5 tests), `lint:changed`,
  `typecheck:changed`, `react-doctor:diff`, and `git diff --check`. React
  Doctor still reports only the unrelated dirty `contexts/EmojiContext.tsx`
  fetch-in-effect diagnostic.
- Browser smoke passed on the live local frontend for `/punk6529/collected` at
  desktop and a 390px mobile viewport. Verified `Details` opens, Activity
  Overview tables render with screen-reader captions, scoped column headers,
  row headers, message-backed labels, horizontal scrollers containing wide
  tables on mobile, and no Next.js runtime session errors. Console resource
  errors were shared backend wave endpoints and blocked emoji feed noise.
- Opened review-ready stacked PR #2635 against PR #2634. Per workstream policy,
  do not merge PR #2635.
- Confirmed PR #2635 is bot-happy on the latest head: DCO passed, Snyk passed,
  SonarCloud passed after reducing the row-config duplication, CodeRabbit
  manual review passed after the async test assertion fix, the stale review
  thread is resolved/outdated, and Claude remained configured for manual review
  only. Per workstream policy, do not merge PR #2635.
- Started stacked branch `codex/user-collected-activity-tabs-a11y-i18n` from
  PR #2635 for the next low-risk `/{user}/collected` Details-panel follow-up.
- Implemented message-backed source-locale labels for the lower Activity tab
  list and tabs, added a tab-list accessible name, connected tabs to the active
  tabpanel, added roving tab focus with Arrow/Home/End keyboard switching, and
  exposed active state via `aria-selected` while preserving the existing
  query-param tab switching.
- Validation passed for the Activity tabs follow-up: focused activity
  tab/wrapper/i18n Jest suites (4 suites, 8 tests), `lint:changed`,
  `typecheck:changed`, and `git diff --check`. `react-doctor:diff` exits 0 and
  still reports the unrelated dirty `contexts/EmojiContext.tsx` fetch-in-effect
  diagnostic plus a `useSearchParams` Suspense warning for
  `UserPageActivityWrapper.tsx`; the wrapper now owns a local Suspense boundary
  around the hook content, and the remaining warning appears to be analyzer
  follow-up rather than a missing local boundary.
- Browser smoke passed on the live local frontend for
  `/punk6529/collected?activity=wallet-activity`. Verified the lower Activity
  tab group exposes a named tablist, tabs expose `role="tab"`,
  `aria-selected`, roving tab indexes, `aria-controls`, and stable IDs, the
  active panel exposes `role="tabpanel"` and `aria-labelledby`, ArrowRight moves
  focus/selection from `Wallet Activity` to `Distributions`, the query string
  updates, and Next.js runtime diagnostics reported no config or session
  errors. Console resource errors were shared backend wave endpoints and blocked
  emoji feed noise.
- Opened review-ready stacked PR #2636 against PR #2635. Per workstream policy,
  do not merge PR #2636.
- Confirmed PR #2636 is bot-happy on the latest head: DCO passed, Snyk passed,
  SonarCloud passed, CodeRabbit manual review passed after tightening the
  page-PR merge policy wording, the prior review thread is resolved/outdated,
  and Claude remained configured for manual review only. Per workstream policy,
  do not merge PR #2636.
- Started stacked branch
  `codex/user-collected-wallet-activity-filter-a11y-i18n` from PR #2636 for the
  next low-risk `/{user}/collected` Details-panel follow-up.
- Implemented message-backed source-locale labels for the Wallet Activity
  heading, filter trigger/options, empty states, and transaction table caption.
  Added accessible filter trigger/option names, `aria-expanded`,
  `aria-controls`, option pressed state, status semantics for empty states, and
  a screen-reader table caption. Swapped the touched framer-motion dropdown
  usage to `LazyMotion`/`m`.
- Validation passed for the Wallet Activity filter follow-up so far: focused
  wallet filter/table/i18n Jest suites (5 suites, 10 tests), `lint:changed`,
  `typecheck:changed`, `react-doctor:diff`, and browser smoke on
  `/punk6529/collected?activity=wallet-activity`. React Doctor still reports
  the unrelated dirty `contexts/EmojiContext.tsx` fetch-in-effect diagnostic
  and the `useSearchParams` Suspense warning for the touched wallet component,
  which is rendered under the activity wrapper Suspense boundary from PR #2636.
  Browser smoke verified the Wallet Activity heading, filter trigger accessible
  name, option list labels, pressed state, Wallet Activity table caption,
  `Mints` selection/query update, and no Next.js runtime session errors.
- Opened review-ready stacked PR #2637 against PR #2636. Per workstream policy,
  do not merge PR #2637.
- SonarCloud reported one non-blocking accessibility code smell on PR #2637:
  prefer native `<output>` over `role="status"` for the Wallet Activity empty
  state. Updated the empty state wrapper to `<output>` and reran focused wallet
  filter/table/i18n Jest suites, targeted eslint for the touched wrapper file,
  `typecheck:changed`, and `git diff --check`.
- Confirmed PR #2637 is bot-happy on the latest head: DCO passed, Snyk passed,
  SonarCloud passed with zero open issues after the `<output>` fix, CodeRabbit
  manual review passed, no review threads are open, and Claude remains
  configured for manual review only. Per workstream policy, do not merge PR
  #2637.
- Started stacked branch `codex/user-collected-distributions-a11y-i18n` from
  PR #2637 for the next low-risk `/{user}/collected` Details-panel follow-up.
- Implemented message-backed source-locale labels for the Distributions
  heading, empty state, table caption, table headings, collection labels,
  token link accessible names, and a loading-only screen-reader label. Replaced
  the empty state with native `<output>`, switched distribution row numbers to
  default-locale `Intl` formatting, switched relative time to the repo i18n
  helper, and replaced phase index keys with stable phase-name keys.
- Validation passed for the Distributions follow-up so far: focused
  distributions/i18n Jest suites (5 suites, 10 tests), targeted eslint for the
  PR-specific TypeScript files, `typecheck:changed`, `react-doctor:diff`, and
  browser smoke on `/punk6529/collected?activity=distributions`.
  `lint:changed` was not rerun for this branch because the long stacked diff
  expands beyond Windows' command-line limit; the PR-specific eslint run passed.
  React Doctor still reports the unrelated dirty `contexts/EmojiContext.tsx`
  fetch-in-effect diagnostic and the `useSearchParams` Suspense warning for
  the touched Distributions component, which is rendered under the activity
  wrapper Suspense boundary from PR #2636. Browser smoke verified the
  Distributions tab selection/panel relationship, message-backed heading,
  native empty-state output, and no Next.js runtime session errors.
- Opened review-ready stacked PR #2638 against PR #2637. Per workstream policy,
  do not merge PR #2638.
- CodeRabbit flagged that the Distributions loading label remained in the
  accessibility tree when visually hidden by opacity. Fixed the loader subtree
  to render only while loading and added a focused regression assertion.
- Confirmed PR #2638 is bot-happy on the latest head after the loading-label
  follow-up: DCO passed, Snyk passed, SonarCloud passed with zero new issues,
  CodeRabbit manual review passed, and the prior loading-label review thread is
  resolved/outdated. Per workstream policy, do not merge PR #2638.
- Started stacked branch `codex/user-collected-tdh-history-a11y-i18n` from PR
  #2638 for the next low-risk `/{user}/collected` Details-panel follow-up.
- Implemented message-backed source-locale labels for the TDH History heading,
  loading label, empty state, chart list label, chart titles, dataset labels,
  and chart accessible names. Replaced the empty state with native `<output>`,
  switched chart date and axis labels through the repo i18n helpers, and
  replaced random chart keys with stable chart IDs.
- Validation passed for the TDH History follow-up so far: focused TDH
  History/i18n Jest suites (3 suites, 8 tests), targeted eslint for the
  PR-specific TypeScript files, `typecheck:changed`, `react-doctor:diff`, and
  browser smoke on `/punk6529/collected?activity=tdh-history`. React Doctor
  still reports the unrelated dirty `contexts/EmojiContext.tsx`
  fetch-in-effect diagnostic and the pre-existing heavy Chart.js import warning
  in the touched TDH chart component. Browser smoke verified the TDH History tab
  selection/panel relationship, message-backed heading, chart list label, chart
  headings, canvas accessible names, and no Next.js runtime session errors; the
  remaining browser console errors were the known local shared API wave 500s and
  blocked emoji-list request.
- Opened review-ready stacked PR #2639 against PR #2638. Per workstream policy,
  do not merge PR #2639.
- Confirmed PR #2639 is bot-happy on the latest head: DCO passed, Snyk passed,
  SonarCloud passed, CodeRabbit manual review passed, and no review threads are
  open. Per workstream policy, do not merge PR #2639.
- Started stacked branch `codex/user-profile-tabs-a11y-i18n` from PR #2639 for
  the next low-risk profile shell follow-up.
- Implemented message-backed source-locale labels for profile tab titles, beta
  badge text, profile-section navigation landmark text, and tab-scroll button
  labels. Added `aria-current="page"` to the active profile tab link, wrapped
  the search-param-driven tab tree in a documented Suspense boundary, and made
  the horizontal tab scroll listener passive.
- Validation passed for the profile tabs follow-up so far: focused
  layout-tabs/i18n Jest suites (4 suites, 20 tests), targeted eslint for the
  PR-specific TypeScript files, `typecheck:changed`, `react-doctor:diff`, and
  browser smoke on `/punk6529/collected?activity=tdh-history`. React Doctor
  still reports the unrelated dirty `contexts/EmojiContext.tsx`
  fetch-in-effect diagnostic, still flags `useSearchParams` in the touched
  profile tab files despite the `UserPageLayout` Suspense boundary, and still
  flags the existing `router.replace()` redirect effect. Browser smoke verified
  the `Profile sections` navigation landmark, message-backed tab labels, the
  explicit `xTDH Beta` link name, `aria-current="page"` on Collected, and no
  Next.js runtime session errors; remaining browser console errors were the
  known local shared API wave 500s and blocked emoji-list request.
- Opened review-ready stacked PR #2640 against PR #2639. Per workstream policy,
  do not merge PR #2640.
- Confirmed PR #2640 is bot-happy on the latest head: DCO passed, Snyk passed,
  SonarCloud passed, CodeRabbit manual review passed, and no review threads are
  open. Per workstream policy, do not merge PR #2640.
- Started stacked branch `codex/user-followers-modal-a11y-i18n` from PR #2640
  for the next low-risk profile modal/list follow-up.
- Implemented message-backed source-locale labels for the profile followers
  modal title, follower list label, loading status label, follower profile link
  names, and follower avatar alt text. Converted the follower collection to a
  semantic list/listitem structure, added `aria-busy` plus a polite loading
  status, and switched follower avatars to `next/image` with `unoptimized` for
  arbitrary remote profile hosts.
- Validation passed for the followers modal/list follow-up so far: focused
  followers/i18n Jest suites (5 suites, 11 tests), targeted eslint for the
  PR-specific source files, `typecheck:changed`, `react-doctor:diff`, and live
  browser smoke on `/punk6529` at desktop and 390px mobile widths. React Doctor
  still reports only the unrelated dirty `contexts/EmojiContext.tsx`
  fetch-in-effect diagnostic. Browser smoke verified the `Followers` dialog
  title, modal `aria-modal`, `Followers` list label, two list items, labeled
  profile links, avatar alt text, close button on mobile, and no Next.js
  runtime session errors; browser console errors were local API/resource
  responses unrelated to the followers modal change.
- Opened review-ready stacked PR #2641 against PR #2640. Per workstream policy,
  do not merge PR #2641.
- Recorded `/about/tech` and `/about/tech/[reportSlug]` fallback debt while
  addressing PR #2719 bot feedback: the report index/detail count chrome now
  uses source-locale messages and `formatInteger`, and the not-found metadata
  fallback is message-backed. Remaining debt is the broader tech-report chrome
  and editorial report data (`dateLabel`, `publishedAt`, repo focus summaries,
  and markdown report bodies), which intentionally stays `en-US` until the
  About Tech shelf gets a full localization pass.
- Recorded brain left-sidebar waves filter fallback debt while addressing PR
  #2778 bot feedback: `WavesFilterToggle`, `UnifiedWavesList`, and
  `WebUnifiedWavesList` now use source-locale message keys for the All/Joined
  labels, filter group name, and joined empty state, but the sidebar has no
  viewer-locale source yet and therefore falls back to `en-US`. Non-English
  viewers may see English sidebar filter copy until locale is threaded through
  the brain sidebar shell; owner is the frontend a11y/i18n workstream, and the
  remediation path is to pass the resolved app locale into the brain sidebar
  components before translating this surface.
