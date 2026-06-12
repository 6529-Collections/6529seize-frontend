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
