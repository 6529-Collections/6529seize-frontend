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
