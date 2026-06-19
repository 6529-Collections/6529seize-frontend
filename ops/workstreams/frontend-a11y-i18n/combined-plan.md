# Combined Accessibility, I18n, And Reviewbot Plan

## Purpose

This plan combines the progressive frontend WCAG 2.2 AA and i18n migration with
new PR review-bot enforcement. It covers the main Next.js website, mobile web
surfaces, standalone/exported surfaces, and future reviewbot rules that prevent
new accessibility or localization regressions while the migration proceeds.

## Source Standards

- Accessibility baseline: `ops/standards/frontend-accessibility-wcag-22-aa.md`.
- I18n baseline: `ops/standards/frontend-i18n-localization.md`.
- Accessibility workflow: `ops/skills/wcag-22-aa/SKILL.md`.
- I18n workflow: `ops/skills/i18n-localization/SKILL.md`.
- PR workflow: `ops/skills/write-prs/SKILL.md`.

## Operating Principles

1. Migrate progressively. Do not move the full App Router tree under
   `app/[lang]` during the first wave.
2. Prevent new debt. New and touched user-facing UI must follow WCAG 2.2 AA and
   the frontend i18n standard.
3. Prefer shared fixes. Fix shared primitives before page-specific copies when
   the blast radius is reasonable.
4. Extract copy and accessible names together. Visible text, `aria-label`,
   `alt`, tooltips, placeholders, validation text, status messages, and
   metadata should share the same message/fallback system.
5. Keep `en-US` as the canonical source locale. Initial supported locales are
   `en-US`, `en-GB`, `fr-FR`, `es-ES`, and `de-DE`.
6. Use repo helpers for locale-sensitive formatting and sorting before adding
   broader dependencies.
7. Keep user-generated content in the user's authored language unless a product
   translation feature explicitly changes that behavior.
8. Treat automated checks and review bots as regression guards. They do not
   prove WCAG conformance; manual keyboard, focus, browser, and screen-reader
   smoke checks remain required for visible UI changes.

## Covered Surfaces

### Main Web App

- App Router routes under `app/`.
- Shared UI and feature components under `components/`.
- Route and feature state under `hooks/`, `contexts/`, `store/`, `helpers/`,
  `lib/`, `utils/`, `entities/`, `types/`, and related service modules.
- Runtime, metadata, security, image, proxy, and environment configuration when
  changes affect rendering, routing, assets, or user-facing behavior.

### Mobile Web And App-Like Surfaces

- Mobile navigation, app shell, pull-to-refresh, bottom navigation, keyboard
  behavior, safe-area behavior, push/share flows, upload flows, and any
  Capacitor-adjacent UI.
- Mobile viewport, touch target, zoom, reduced-motion, and virtual keyboard
  checks are required for migrated visible UI.

### Standalone And Exported Surfaces

- `standalone/standalone-memes-mint/` and any future standalone/exported entry.
- Standalone surfaces must be inspected with their local config and build/export
  behavior rather than assuming main-app behavior applies.

### Reviewbot Surfaces

- The reviewbot implementation repository, once available in the workspace or
  as a linked checkout.
- Frontend reviewbot dashboards and docs already tracked by
  `ops/workstreams/reviewbot-production-manager/` when reviewbot API or
  dashboard behavior changes.
- New i18n and WCAG review-bot rule packs should be integrated with the
  reviewbot's existing event, findings, commenting, and check-run model after
  architecture review.

## Workstream Artifacts

Maintain the following files in this workstream:

- `README.md`: workstream charter and reload order.
- `active-context.md`: current branch, constraints, next actions, and recent
  decisions.
- `route-page-status.md`: route and component migration status.
- `pr-links.md`: related PRs, branches, and status.
- `bot-decisions.md`: CI and review-bot findings with fix/defer decisions.
- `combined-plan.md`: this combined migration and bot-enforcement plan.

Add these files when the next implementation phase needs them:

- `exceptions.md`: accepted i18n and WCAG deferrals.
- `qa-matrix.md`: route-by-route browser, keyboard, locale, mobile, and
  standalone verification matrix.
- `bot-rules/i18n-rules.md`: i18n review-bot rule definitions.
- `bot-rules/wcag-rules.md`: accessibility review-bot rule definitions.
- `bot-rules/severity-model.md`: severity, confidence, and blocking criteria.

## Migration Status Model

Use these labels for each route/component/surface:

| Status | Meaning |
| --- | --- |
| `unreviewed` | No i18n/WCAG audit yet. |
| `blocked` | Needs product, design, backend, third-party, or reviewer input. |
| `message-backed` | Visible copy and accessible names are in dictionaries. |
| `locale-format-ready` | Dates, numbers, percentages, relative time, lists, and sorting use approved helpers. |
| `keyboard-verified` | Full keyboard operation and visible focus verified. |
| `screen-reader-smoke-verified` | Names, roles, labels, dialogs, and status updates smoke-tested. |
| `mobile-verified` | Touch targets, zoom, wrapping, viewport, keyboard, and reduced motion verified. |
| `standalone-verified` | Exported or standalone surface verified independently. |
| `complete` | Migration checklist satisfied with recorded validation. |
| `exception-recorded` | Remaining debt has route/component, issue, user impact, owner/follow-up, and remediation path. |

## Phase 0: Governance And Inventory

1. Keep this workstream current before starting broad autonomous work.
2. Inventory main app routes, shared primitives, mobile-sensitive surfaces, and
   standalone/exported surfaces.
3. Classify route families by risk and user impact.
4. Record existing debt separately from new PR regressions.
5. Preserve unrelated user or agent changes. Do not widen scope to unrelated
   generated files, dependency changes, auth/security behavior, or deployment
   behavior without explicit need.

## Phase 1: Shared I18n Foundation

1. Standardize locale constants and parsing for the supported locale set.
2. Keep `en-US` complete and default.
3. Allow partial non-source dictionaries to fall back to `en-US`.
4. Fail loudly in development/tests for missing source keys when helpers support
   it.
5. Use product-meaning message keys, not English sentence text.
6. Use interpolation instead of sentence concatenation.
7. Keep accessible names in the same message system as visible labels.
8. Add or consolidate formatting helpers for dates, times, relative time,
   integers, decimals, compact numbers, percentages, lists, and locale-sensitive
   sorting.
9. Defer full localized route prefixes until a route has message coverage,
   metadata policy, canonical link policy, and locale QA.

## Phase 2: Shared WCAG Foundation

Prioritize shared primitives before route-specific patches:

1. Buttons, links, icon buttons, and action cards.
2. Menus, popovers, dropdowns, dialogs, drawers, and bottom sheets.
3. Tabs, segmented controls, accordions, and disclosure controls.
4. Form fields, labels, descriptions, validation errors, and recovery messages.
5. Toasts, status messages, loading states, error states, and empty states.
6. Media, NFT previews, image viewers, videos, charts, tables, markdown, and
   user-generated content shells.
7. Virtualized lists, infinite scroll, timeline/chat surfaces, and jump controls.
8. Mobile navigation, shell controls, touch targets, keyboard interactions, and
   reduced-motion behavior.

For each primitive, verify semantic elements, keyboard support, accessible
names, focus visibility, focus restoration, role/state exposure, target size,
non-color signaling, and reduced-motion behavior.

## Phase 3: Surface Prioritization

### Priority 1: Shared Shell And Account-Critical Flows

- Root layout and app shell.
- Header, sidebar, search, mobile bottom navigation, and route landmarks.
- Wallet/account/profile switching/auth surfaces.
- Notifications.
- Messages/Waves shell and composers.
- Loading, error, empty, restricted, and recovery states.

### Priority 2: High-Traffic Public And Content Surfaces

- Home and Discover.
- The Memes, Meme Lab, Rememes, Meme Calendar, and mint-related read paths.
- Museum, 6529 Gradient, About, Education, Open Metaverse, and public content
  pages.
- Open data landing and downloads.

### Priority 3: Complex Interactive Product Areas

- Waves creation wizard and drop composer.
- Drop Forge.
- NextGen manager, mint, collection, and distribution flows.
- EMMA.
- Delegation and groups.
- Network, TDH, xTDH, dashboards, charts, tables, and leaderboards.
- Tools and admin-like surfaces.

### Priority 4: Mobile, Standalone, And Exported Surfaces

- Mobile navigation and app-like flows.
- Upload/share/push/keyboard/safe-area interactions.
- `standalone/standalone-memes-mint/`.
- Future standalone, embedded, or Electron-like surfaces.

## Phase 4: Per-Route Migration Recipe

For each route or component slice:

1. Read the route, direct client components, shared primitives, hooks, contexts,
   services, route docs, tests, and relevant standards.
2. Identify existing i18n paths nearby before adding new abstractions.
3. Extract visible copy and accessible names together.
4. Replace locale-sensitive formatting and sorting with approved helpers.
5. Fix semantic controls, keyboard operation, focus visibility/restoration,
   labels/descriptions/errors, landmarks/headings, status announcements, image
   alternatives, color-only meaning, touch targets, zoom behavior, and
   reduced-motion behavior.
6. Add focused tests where coverage exists nearby or the helper/primitive is
   reusable.
7. Update user-facing docs under `ops/docs/` when visible behavior, routes,
   loading/empty/error states, or workflows change.
8. Record remaining debt in this workstream if the whole page is not fully
   migrated.
9. Keep each PR small enough to review and validate independently.

## Phase 5: Automation And Quality Gates

Add or strengthen static checks for:

- new hardcoded JSX text in migrated areas;
- hardcoded accessible names such as `aria-label`, `title`, `placeholder`, and
  `alt`;
- direct `toLocaleString`, `toLocaleDateString`, `toLocaleTimeString`, or
  `localeCompare` in user-facing UI where helpers should be used;
- sentence concatenation for translated strings;
- clickable non-interactive elements;
- icon-only controls without accessible names;
- unlabeled form controls;
- hidden focus indicators;
- missing reduced-motion handling where animation can affect users;
- missing live/status announcements for relevant async states.

Prefer deterministic AST or ESLint-style findings before LLM review. Use LLMs
for context, explanation, suggested remediation, and manual-check prompts rather
than for ungrounded line comments.

## Phase 6: Dedicated I18n And WCAG Review Bots

### Bot Strategy

Build two specialized review bots on the shared reviewbot infrastructure:

1. `6529-i18n-reviewbot`
2. `6529-wcag-reviewbot`

They may share event handling, diff parsing, findings storage, comments, and
check-run publishing, but should have separate rule packs, prompts, severity
rubrics, labels, and rollout gates.

### Reviewbot Repo Prerequisite

Before implementation, inspect the `6529reviewbot` repository in its actual
checkout and document:

- webhook or polling event model;
- PR diff acquisition path;
- findings schema;
- check-run/status publishing;
- inline comment support;
- retry/idempotency behavior;
- cost, rate-limit, and token-budget controls;
- test harness and fixture conventions;
- deployment and rollout process;
- current frontend dashboard/API contract impacts.

If the repo is not available locally, record that limitation and do not invent
architecture-specific details.

### Shared Bot Finding Schema

Each finding should include:

- `ruleId`
- `category`: `i18n` or `wcag`
- `severity`: `blocker`, `major`, `minor`, or `advisory`
- `confidence`
- `file`
- `line`
- `message`
- `why`
- `suggestedFix`
- `standardReference`
- `blocking`
- `manualCheckRequired`

### I18n Review-Bot Rules

High-confidence rules:

1. `i18n/no-new-hardcoded-jsx-text`: new user-facing JSX text in migrated or
   touched UI should be message-backed.
2. `i18n/no-hardcoded-accessible-name`: new hardcoded `aria-label`, `title`,
   `placeholder`, `alt`, and screen-reader text should use the message system.
3. `i18n/no-direct-locale-formatting`: new direct `toLocaleString`,
   `toLocaleDateString`, `toLocaleTimeString`, or `localeCompare` in UI should
   use repo helpers.
4. `i18n/no-sentence-concat`: user-facing sentences should use interpolation,
   not concatenation or fragments.
5. `i18n/source-key-required`: new non-source locale keys must have complete
   `en-US` source keys.
6. `i18n/supported-locale-id`: locale identifiers should use supported BCP 47
   values, with `en-GB` instead of `EN-UK`.

Non-goals:

- Do not translate user-generated content.
- Do not require full non-source locale completion during progressive migration.
- Do not require app-wide `app/[lang]` routing.
- Do not recommend a broad i18n dependency unless the existing path is
  insufficient and maintainers explicitly accept the change.

### WCAG Review-Bot Rules

High-confidence rules:

1. `wcag/no-clickable-noninteractive`: prefer semantic `button`, `a`, `Link`,
   and form controls instead of clickable `div` or `span`.
2. `wcag/icon-button-accessible-name`: icon-only controls need stable accessible
   names.
3. `wcag/form-control-label`: form controls need associated labels,
   descriptions, validation errors, and recovery text.
4. `wcag/focus-visible-not-removed`: focus indicators must not be removed or
   hidden without an accessible replacement.
5. `wcag/dialog-focus-management`: dialogs, drawers, menus, and popovers need
   focus movement, trapping where modal, dismissal, and focus restoration.
6. `wcag/keyboard-support`: custom tabs, menus, carousels, and composite
   controls need keyboard operation.
7. `wcag/status-announcement`: loading, error, success, validation, and async
   updates should be announced when they affect task progress.
8. `wcag/reduced-motion`: motion that can distract, disorient, or block task
   completion should respect reduced-motion preferences.
9. `wcag/not-color-only`: selected, invalid, success, warning, and chart states
   should not rely on color alone.

Non-goals:

- The bot must not claim full WCAG conformance from static analysis.
- The bot should request manual keyboard, focus, browser, and screen-reader
  smoke verification when static analysis cannot prove behavior.

### Bot Review Modes

1. `advisory-summary`: post summary only; no inline comments; no blocking.
2. `inline-advisory`: line comments for high-confidence findings; no blocking.
3. `soft-blocking`: required check only for invalid bot config, bot runtime
   errors, missing source keys, or clear new blockers.
4. `migrated-path-blocking`: block high-confidence violations only in surfaces
   marked migrated or in newly touched UI where standards apply.

### Bot Rollout Sequence

1. Review `6529reviewbot` architecture and add no-op i18n/WCAG reviewers.
2. Add deterministic i18n scanner and fixture tests.
3. Add deterministic WCAG scanner and fixture tests.
4. Add LLM explanation layer that only comments on diff-backed findings.
5. Add frontend repo config and workstream exception/status integration.
6. Enable advisory mode on frontend PRs.
7. Tune false positives.
8. Enable blocking only for migrated paths and high-confidence new regressions.

### Bot Comment Style

Comments should be short, actionable, and grounded in the changed line:

- finding title;
- why it matters;
- exact rule ID;
- severity and confidence;
- suggested repo-patterned fix;
- manual verification request when needed;
- standard/workstream reference.

### Bot Safety Controls

- Review changed lines first; avoid blocking unrelated legacy debt.
- Read workstream exceptions before commenting.
- Discard LLM findings that are not tied to changed files/lines.
- Prefer deterministic findings for inline comments.
- Let LLMs explain and suggest, not invent unverified issues.
- Redact local paths, secrets, prompts, hidden instructions, and private data
  from public comments.
- Track costs, token usage, retries, and duplicate comments.

## Phase 7: Validation Matrix

### Docs-Only Or Workstream-Only PRs

- `git diff --check`.
- Link/path review for changed docs.
- Docs validators when touching structured docs areas.

### TypeScript, React, Or UI PRs

- `6529 run lint:changed`.
- `6529 run typecheck:changed`.
- `6529 run check:changed` for broader changed-file validation.
- `6529 run react-doctor:diff` when React, Next.js, JSX, hooks, routing, or UI
  state is touched.
- Targeted Jest/component tests when coverage exists nearby.

### Visible UI PRs

In addition to changed-file checks:

- browser verification for changed routes;
- keyboard-only pass;
- visible focus pass;
- relevant loading, empty, error, disabled, selected, pressed, and validation
  states;
- screen-reader smoke check when labels, dialogs, forms, or dynamic status
  messages change;
- screenshots for perceptible web app changes.

### I18n PRs

Verify the affected route/component in:

- `en-US`;
- `en-GB`;
- `fr-FR`;
- `es-ES`;
- `de-DE`.

Check long labels, accessible labels, dates, numbers, sorting, and fallback
behavior.

### Mobile Or Standalone PRs

- mobile viewport checks;
- 200% zoom or equivalent readability checks where practical;
- touch target checks;
- virtual keyboard/safe-area checks where relevant;
- reduced-motion checks for animation changes;
- standalone/export smoke checks for standalone surfaces.

### Routing, Config, Build, Or Deployment-Sensitive PRs

- all relevant focused checks;
- `6529 run build`.

## Phase 8: PR Sequencing

### Foundation PRs

1. Workstream and combined plan updates.
2. I18n helper hardening.
3. Locale formatting helper consolidation.
4. Shared WCAG primitive audits.
5. Static scan/report scripts.

### Primitive PRs

1. Buttons, links, and icon buttons.
2. Dialogs, menus, popovers, and drawers.
3. Forms and validation patterns.
4. Tabs, accordions, disclosure controls, and carousels.
5. Toasts, status regions, loading, error, and empty states.

### Surface PRs

1. App shell and navigation.
2. Auth, wallet, and account controls.
3. Waves/messages shell and composer.
4. Public media/content routes.
5. Profiles.
6. Network/dashboard/tooling routes.
7. Complex creation, minting, manager, and admin-like flows.
8. Mobile-specific passes.
9. Standalone/exported passes.

### Reviewbot PRs

1. Reviewbot architecture discovery and no-op reviewers.
2. I18n deterministic scanner.
3. WCAG deterministic scanner.
4. LLM explanation layer.
5. Frontend repo config and advisory rollout.
6. Blocking rollout for migrated paths.

## Stop Conditions

Pause autonomous implementation and request human/product review when:

- product copy meaning is unclear;
- legal, security, financial, or policy wording needs translation or rewrite;
- visual design decisions are needed for contrast, spacing, overflow, or target
  size;
- third-party widgets block accessibility fixes;
- route localization affects SEO, canonical URLs, or sitemap behavior;
- auth, wallet, transaction, admin, monitoring, security header, proxy, or
  secret-handling behavior might change;
- generated files, lockfiles, package metadata, docs, or environment behavior
  change unexpectedly;
- reviewbot architecture is unavailable but implementation would require
  architecture-specific assumptions.

## Definition Of Done

A surface is done when:

- visible copy is message-backed;
- accessible names and descriptions are message-backed;
- `en-US` source keys are complete;
- partial locales fall back safely to `en-US`;
- locale-sensitive formatting and sorting use approved helpers;
- semantic controls replace avoidable custom interactions;
- keyboard operation, visible focus, and focus restoration are verified;
- dialogs, menus, popovers, and overlays manage focus and dismissal;
- forms associate labels, descriptions, validation errors, and recovery text;
- status, loading, error, success, and validation updates are announced when
  needed;
- image, media, chart, table, and NFT preview alternatives are correct;
- mobile touch target, zoom, wrapping, and reduced-motion checks pass;
- standalone/exported behavior is verified where applicable;
- automated checks pass or limitations are documented;
- remaining debt has an exception with owner/follow-up/remediation path;
- i18n and WCAG review bots, once available, are green or findings are fixed or
  explicitly deferred with rationale.
