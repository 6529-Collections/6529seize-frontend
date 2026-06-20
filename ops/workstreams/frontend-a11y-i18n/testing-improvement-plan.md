# Frontend Testing And Release Strategy

Status: draft strategy for the WCAG 2.2 AA and i18n mega run.
Date: 2026-06-20.
Scope: `6529seize-frontend` local, CI, review, staging, production, and
agentic-swarm validation.

## Purpose

Build a testing and release system that lets 6529.io move faster without
flattening risk. 6529.io is a web app with decentralization features, not a
live consensus client. The right target is not Bitcoin-Core-style release
gravity for every change. The target is:

- low-risk changes move quickly with standardized evidence;
- page and workflow changes get strong local, browser, and reviewbot coverage;
- auth, wallet, upload, posting, admin, deploy, data-loss, identity, and
  decentralization-adjacent risk are routed into guarded lanes;
- deployment trains are traceable by exact SHA, validation evidence, artifacts,
  and post-deploy watch.

This is a prerequisite for scaling the frontend WCAG/i18n mega run. Broad
page-cluster remediation should not accelerate until the foundation PRs in this
document are in place.

## Design Inputs

External inputs:

- Next.js Playwright and Jest guides:
  https://nextjs.org/docs/app/guides/testing/playwright
  https://nextjs.org/docs/app/guides/testing/jest
- Playwright projects, fixtures, traces, CI, mocking, and accessibility:
  https://playwright.dev/docs/test-projects
  https://playwright.dev/docs/test-fixtures
  https://playwright.dev/docs/trace-viewer
  https://playwright.dev/docs/ci
  https://playwright.dev/docs/mock
  https://playwright.dev/docs/accessibility-testing
- WCAG 2.2:
  https://www.w3.org/TR/WCAG22/
- MDN Intl and Unicode CLDR:
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl
  https://cldr.unicode.org/
- OWASP ASVS and Web Security Testing Guide:
  https://owasp.org/www-project-application-security-verification-standard/
  https://owasp.org/www-project-web-security-testing-guide/
- GitHub Actions secure use, OpenSSF Scorecard, and SLSA:
  https://docs.github.com/en/actions/reference/security/secure-use
  https://scorecard.dev/
  https://slsa.dev/
- Electron automated testing, Playwright WebView2, and Capacitor docs:
  https://www.electronjs.org/docs/latest/tutorial/automated-testing
  https://playwright.dev/docs/webview2
  https://capacitorjs.com/docs
- Google testing, release, and SRE ideas:
  https://abseil.io/resources/swe-book/html/ch11.html
  https://abseil.io/resources/swe-book/html/ch14.html
  https://abseil.io/resources/swe-book/html/ch23.html
  https://sre.google/sre-book/release-engineering/
  https://sre.google/workbook/canarying-releases/
  https://sre.google/sre-book/reliable-product-launches/
  https://sre.google/sre-book/evolving-sre-engagement-model/
- OpenRouter GLM 5.2 listing and Z.ai direct pricing:
  https://openrouter.ai/z-ai/glm-5.2
  https://docs.z.ai/guides/overview/pricing

Internal inputs:

- Repo and local environment rules in `AGENTS.md`.
- WCAG standard in `ops/standards/frontend-accessibility-wcag-22-aa.md`.
- I18n standard in `ops/standards/frontend-i18n-localization.md`.
- Autonomous manager skill in `ops/skills/6529-autonomous-manager/SKILL.md`.
- WCAG and i18n skills in `ops/skills/wcag-22-aa/SKILL.md` and
  `ops/skills/i18n-localization/SKILL.md`.
- Deployment skill and bus docs in `ops/skills/deploy-6529/SKILL.md`,
  `ops/docs/developer/deployment-bus-process.md`, and
  `ops/docs/developer/deployment-bus-automation.md`.
- Current test config in `package.json`, `jest.config.js`, `jest.setup.js`,
  `playwright.config.ts`, `tests/`, and `__tests__/`.
- Reviewbot config in `.github/6529bot.yml`.
- Page-cluster workflow in
  `ops/workstreams/frontend-a11y-i18n/mega-run-pr-playbook.md`.

## Current State

Existing strengths:

- Thousands of Jest unit and component tests under `__tests__/`.
- Existing Testing Library usage with accessible-role queries.
- Existing i18n helpers in `i18n/locales.ts`, `i18n/format.ts`, and
  `i18n/messages.ts`.
- Existing locale tests for route params, formatting, and locale-preserving
  links in several migrated areas.
- Existing security-sensitive tests around auth, route handlers, URL guards,
  upload helpers, sanitizers, rate limits, and preview APIs.
- Existing `eslint-plugin-jsx-a11y`, `eslint-plugin-security`, dependency
  governance, deploy manifests, deployment concurrency, and reviewbot lanes.
- Reviewbot now runs `general`, `wcag`, `i18n`, `security`, and
  `responsiveness` on frontend PRs.

Current gaps:

- The Playwright suite on `origin/main` is not a reliable gate because smoke
  specs import `../testHelpers`, but `tests/testHelpers.ts` is absent.
- `test:e2e:staging` depends on those smoke specs, so staging E2E cannot yet
  be treated as a hard promotion signal.
- There is no broad ordinary-PR CI workflow for app changes.
- Playwright currently runs only a desktop Chromium project.
- Playwright artifacts are not yet standardized for trace, screenshot, console,
  network, locale, overflow, accessibility, and surface evidence.
- Tests are not typechecked as a first-class project.
- Some changed-file scripts compare against different base refs.
- Browser E2E does not yet systematically cover keyboard/focus, locale
  wrapping, mobile overflow, native-adjacent branches, or production-safe
  security smoke.
- Native behavior detection is spread across hooks and direct Capacitor imports,
  so simulated browser checks can overstate true native coverage.

## Core Principles

1. Testing is a speed system, not a ceremony system.
2. Use the smallest sufficient test for each behavior.
3. Production confidence requires multiple layers: static, small tests, browser
   tests, deployed tests, reviewbot, and monitoring.
4. Browser tests should exercise user-observable behavior.
5. Accessibility automation supports WCAG review but does not prove WCAG
   conformance by itself.
6. I18n tests must cover visible copy, accessible names, locale formatting,
   fallback behavior, wrapping, and sorting.
7. Security-sensitive tests are read-only by default in staging and production.
8. Native-simulated tests must be labeled as simulated unless they run inside a
   real native shell.
9. Every deployment train needs exact SHA evidence, a validation manifest, and
   a release report.
10. Reviewbot is a second reviewer, not a substitute for local and deployed
    tests.
11. Stop-the-line is rare and reserved for confirmed disaster-class evidence,
    not ordinary uncertainty or model disagreement.
12. Swarms are high-recall hypothesis generators. Only deterministic gates and
    reproducible disaster-class invariant violations have promotion-blocking
    authority.
13. Codex plus review bots should cycle until they are no longer adding useful
    findings or patches; the system should then promote safe work instead of
    waiting for ritual human review.
14. Most test, reviewbot, and swarm output is feedback to Codex. It should drive
    another iteration, not take decision authority away from the agent.

## Pre-PR Template Contract

The executable pre-PR template lives in
`ops/workstreams/frontend-a11y-i18n/mega-run-pr-playbook.md`. That playbook is
the source of truth for page-cluster PR planning, and it must continue to collect
these fields before a non-trivial WCAG/i18n migration PR opens:

- Risk assessment: computed risk floor, declared risk level, final risk level,
  downgrade approval when final risk is below the computed floor, and hazard
  analysis in the format `hazard -> severity -> likelihood -> detection ->
  required test -> rollback or fix-forward`.
- Validation and artifacts: validation manifest path, durable artifact storage
  plan, artifact redaction strategy for secrets/local paths/prompts/private data,
  and expected reviewbot lanes.
- PR description risk summary: risk level summary, hazard summary, validation
  manifest status, and durable artifact pointers or planned artifact locations.

This contract connects the playbook template to the validation manifest schema in
`ops/testing-strategy/validation-manifest.v1.schema.json` and to the safety-case
requirements in this strategy's "Safety Case And Validation Manifest" section.

## 6529.io Invariants

High-risk PRs must map their evidence to the relevant invariants below. Add
narrower invariants in the validation manifest when a workflow has special
rules.

Identity and wallet:

- A user must never be shown as connected to the wrong wallet, profile, or
  identity.
- Wallet connection, switching, and disconnect states must be visible,
  reversible, and fail closed.
- A signing prompt must never misdescribe what is being signed or imply a safer
  action than the wallet is actually requesting.
- Wallet, TDH, delegation, ownership, or identity claims must not be inferred
  from stale client state when fresh authoritative data is required.

Posting and user actions:

- Posting, deletion, moderation, voting, admin, or other state-changing actions
  must not happen from automated tests unless the environment and fixture are
  explicitly safe for that action.
- Destructive or irreversible actions must have clear accessible labels and must
  not become available to unauthorized users.
- Read-only production smoke must never mutate production state unless the user
  explicitly requests that exact operation.

Auth and permissions:

- Auth/session failures must fail closed.
- Admin and moderation affordances must not appear to unauthorized users.
- Route protection and API authorization must not rely only on hidden client UI.
- Cookies, tokens, staging credentials, wallet data, and user-private data must
  not appear in logs, screenshots, traces, reviewbot prompts, or artifacts.

Uploads, media, and links:

- Uploaded content and link previews must not execute script or unsafe HTML.
- URLs must be sanitized and rendered with safe link behavior.
- Media failures must degrade without hiding primary actions or breaking page
  navigation.

WCAG and i18n:

- I18n migration must not remove accessible names, labels, roles, or status
  announcements.
- Long translated text must not hide controls, overlap content, or cause
  horizontal overflow.
- Locale formatting must preserve meaning for dates, numbers, percentages,
  relative time, and sorting.
- Keyboard users must be able to reach and operate every changed interactive
  control.

Deployment:

- Every staging and production result must map to an exact known SHA or release
  set.
- A deployment train must not mix stale branches or hidden unreviewed changes.
- Production validation must check the actual deployed version, not just the
  branch that was intended to deploy.

## Risk And Autonomy Lanes

Every PR and deployment train needs a risk level. The risk level selects the
minimum gates; owners can always run more.

| Lane | Risk | Examples | Minimum gates |
| --- | --- | --- | --- |
| Fast | Level 0 | Docs, comments, test-only changes, non-runtime metadata | Whitespace/doc checks, changed lint when applicable, reviewer confirms no runtime path changed |
| Fast | Level 1 | Isolated copy, labels, styles, non-shared presentational UI | Changed lint/typecheck, focused component tests where present, `@a11y` or `@i18n` if visible, mobile overflow if layout changed |
| Standard | Level 2 | User-facing UI behavior, forms, navigation, menus, dialogs, route rendering, shared components | Level 1 gates, focused Jest, changed-route Playwright, keyboard/focus, mobile, locale, reviewbot findings addressed |
| Guarded | Level 3 | Auth, session, wallet-adjacent UI, uploads, link previews, posting, moderation/admin, generated API, route protection, deploy config, shared data fetching | Level 2 gates, build, security pack, read-only destructive-action guard, staging validation for exact SHA, independent verifier |
| Release-captain | Level 4 | Cross-surface changes, broad shared infrastructure, production routing, cache behavior, native-shell behavior, release-train changes | Level 3 gates, release captain, broader surface matrix, deployment manifest, rollback/fix-forward note, post-deploy watch |
| Release-captain | Level 5 | Security-critical changes, funds or signing flows, irreversible data writes, credentials, infra/deploy control | Level 4 gates, explicit threat model, independent security review, least-privilege/secret review, release-captain approval, production monitoring checkpoints before public notes |

Risk can only move down with a written reason. If agents disagree, use the
higher risk level until a human or release captain resolves it.

Fast lane execution mode:

- Level 0-1 PRs use a minimal validation manifest: risk floor, changed files,
  commands run, reviewbot status, and residual risk.
- Level 0-1 PRs do not require full deployment train release reports unless
  they affect runtime routes, deployment config, auth/wallet/upload/admin paths,
  or a release captain explicitly groups them into a train.
- GLM swarm is not required for Level 0-1 PRs. Run only cheap risk/evidence
  classifiers when useful.
- Staging is optional for Level 0-1 PRs unless route rendering, build behavior,
  runtime config, or deploy packaging changed.
- Auto-merge can be allowed for tightly scoped safe classes once Codex, CI, and
  reviewbot stop producing new useful findings. Initial safe classes are docs,
  test scaffolding, i18n dictionary-only fixes, and constrained accessible-name
  or label fixes with passing tests.
- Layout and UI behavior fixes may auto-open PRs, but should not auto-merge
  until visual/browser evidence is reliable enough to avoid oscillation.

### Risk Classification Mechanism

Risk classification must be enforced by a deterministic CI risk-floor
classifier, not only by the PR owner. The classifier computes a minimum risk
level from changed paths, package/config changes, and declared impact. The PR
may declare a higher risk level. It may not declare a lower risk level unless a
release captain records a downgrade reason in the validation manifest.

Initial risk-floor table:

| Change pattern | Minimum risk |
| --- | --- |
| Docs-only under `ops/`, Markdown docs, comments, non-runtime metadata | Level 0 |
| Isolated non-shared style/copy/component changes outside auth/wallet/upload/admin/deploy paths | Level 1 |
| `app/**`, `components/**`, `hooks/**`, `contexts/**`, `store/**`, `helpers/**`, `lib/**`, `utils/**` touching user-visible route/workflow behavior | Level 2 |
| Any auth/session, wallet, signing, profile identity, TDH/delegation, upload, media/link-preview, posting, moderation, admin, route protection, generated API model, shared data-fetching, or Next.js rendering-mode path | Level 3 |
| Deployment workflows, deployment bus, environment schema, build/release config, cache/routing infrastructure, native-shell behavior, broad shared primitives used across many route families | Level 4 |
| Credentials, secret handling, signing/funds, irreversible data writes, deploy-control authority, artifact-store access controls, or security-critical auth/wallet/admin changes | Level 5 |

The first implementation must encode the Level 3+ floor with explicit path
globs. Start conservative; false positives are cheaper than silently treating a
wallet or deploy change as ordinary UI. The validation manifest must record:

- computed risk floor;
- declared risk level;
- final risk level;
- downgrade approver and reason when final risk is below the computed floor.

Risk modifiers:

- Feature-flag changes that alter ON/OFF behavior, default values, or runtime
  eligibility rules escalate the computed risk by one level unless already at
  Level 4 or Level 5.
- Large i18n payload changes, unusually long translated strings, or dictionary
  changes touching primary navigation, forms, modals, or action labels add a
  layout/i18n risk modifier and require mobile/overflow evidence.
- Route-impact heuristics should map changed routes/components to affected
  workflows so the classifier can request targeted smoke instead of sending
  every PR through the full matrix.

## Safety Case And Validation Manifest

Every non-trivial PR must make explicit claims about what changed, what can
fail, which evidence covers those failures, who validated the evidence, and
which deployed SHA carries the change.

Required safety-case chain:

```text
changed requirement or risk
-> implementation files
-> local test evidence
-> PR/CI/review evidence
-> staging evidence
-> production evidence
```

Validation manifest fields:

- PR, branch, owner, verifier, and risk level.
- Computed risk floor, declared risk level, final risk level, and downgrade
  approval if any.
- Affected routes, workflows, user-visible requirements, and invariants.
- Changed files grouped by behavior, accessibility, i18n, security, and
  deployment impact.
- Required test sizes, packs, commands, and pass/fail results.
- Playwright report, screenshots, traces, console/network evidence, and
  artifact pointers.
- Reviewbot, GLM swarm, and human review URLs or run IDs.
- Staging deployment URL, candidate SHA, and validation result when applicable.
- Production version/SHA and read-only smoke result when applicable.
- Known skipped checks, why they were skipped, who accepted the risk, and when
  they must be revisited.

Hazard analysis format:

```text
hazard -> severity -> likelihood -> detection -> required test -> rollback or fix-forward
```

Default hazards for the mega run:

- Inaccessible navigation, dialog, menu, or form interaction.
- Broken focus order, focus trap, or focus return.
- Missing accessible names after copy or icon migration.
- Locale formatting corruption for dates, numbers, addresses, or sorting.
- Long translated text breaking layout or hiding controls.
- Mobile layout blocking a primary action.
- Auth/session state lost or misrepresented.
- Wallet/signing UI confusion or unsafe confirmation language.
- Upload, media, or link-preview path accepting unsafe URLs or HTML.
- Posting, deletion, moderation, or admin action accidentally becoming
  destructive in tests.
- Native shell behavior claimed from browser-only simulation.
- Staging SHA, production SHA, or deployment candidate set unclear.
- Stale branch merged after `origin/main` moved.

Any hazard without a detection path is not ready for merge. Any hazard without a
rollback or fix-forward path is not ready for production.

Temporary foundation constraint:

- Until the Playwright harness repair and deployment evidence integration are
  both green, Level 3+ page-cluster work is blocked by default.
- A release captain may allow a one-off Level 3+ exception only with a written
  manual-validation plan, explicit expiry, and a follow-up to replace the manual
  evidence with automated evidence once the gates exist.

## Test Size Taxonomy

Use Google-style test sizing to keep the suite fast and deterministic.

| Size | Definition | 6529 examples | Runs |
| --- | --- | --- | --- |
| `@small` | Single process, deterministic, no network, no real browser, no external service | Pure helpers, formatters, reducers, URL guards, small components with fakes | Local, PR CI, changed-file gates |
| `@medium` | Single machine, localhost allowed, local browser or local services allowed | Playwright against local frontend, local API smoke, component integration with browser, local upload validation | Local, PR CI when selected, train validation |
| `@large` | Deployed or real external service, staging/prod, real native shell, production-like environment | Staging Playwright, production read-only smoke, real Capacitor/Electron shell smoke, train-level security smoke | Staging, production, release trains, scheduled runs |

Rules:

- Prefer many `@small`, some `@medium`, and few `@large` tests.
- If a large test catches a bug, add the smallest practical regression test
  below it.
- Large tests need an owner, purpose, runtime expectation, flake policy, and
  repair owner.
- Larger tests should not silently rot behind retries; quarantine and repair
  them with an owner and deadline.
- During Level 3+ deployment trains, zero quarantined `@auth`, `@wallet`,
  `@security`, `@upload`, `@readonly-prod`, or deployment-gate tests are
  allowed unless the release captain removes the affected PR from the train.

CI runtime and flake controls:

- Each lane should have a runtime budget after baseline measurements:
  - Fast lane target: under 10 minutes;
  - Standard lane target: under 20 minutes;
  - Guarded lane target: under 35 minutes before staging;
  - Release-captain lane target: explicit train budget recorded in the release
    report.
- Default retry budget is 0 for unit/static tests and 1 for browser tests
  unless a pack owner records a narrower rule.
- Quarantined tests must be listed in a versioned quarantine registry with test
  id, pack, risk surface, owner, reason, expiry, and blocking effect.
- A quarantined high-risk test cannot silently downgrade coverage; it either
  blocks the affected train or the release captain removes the affected PR.

## Test Pack Taxonomy

Use consistent tags or project names:

- `@small`
- `@medium`
- `@large`
- `@smoke`
- `@route`
- `@a11y`
- `@keyboard`
- `@i18n`
- `@mobile`
- `@capacitor-sim`
- `@electron-sim`
- `@security`
- `@upload`
- `@wallet`
- `@auth`
- `@readonly-prod`
- `@visual`
- `@performance`
- `@staging`
- `@production`

Pack selection is route/risk based. Not every PR runs every pack, but every PR
explains why its selected packs are enough.

## Test Architecture

### Static And Structural Gates

Required capabilities:

- Format and whitespace checks.
- Changed-file lint and full lint in CI.
- `eslint-plugin-jsx-a11y` for obvious accessibility issues.
- `eslint-plugin-security` for obvious security smells.
- Typecheck app code.
- Typecheck tests and Playwright helpers.
- Hardcoded user-facing string detection for migrated areas.
- Missing source message detection for i18n dictionaries.
- Dependency governance and dependency-risk gates.
- Workflow permission review: least privilege, pinned actions where practical,
  no secret exposure in artifacts.

First targets:

- Add `typecheck:tests`.
- Fix JSON scripts that point at missing helpers.
- Normalize changed-file base refs.
- Add normal app PR CI.

### Small Unit And Component Tests

Purpose:

- Fast feedback for helpers, primitives, hooks, formatters, route helpers, auth
  boundaries, API request builders, and shared UI states.

Rules:

- Use Testing Library role/name queries when practical.
- Test visible text and accessible names together for migrated UI.
- Test locale helpers with `en-US`, `en-GB`, `fr-FR`, `es-ES`, and `de-DE`.
- Test fallback to `en-US` without crashes.
- Test formatting through repo helpers, not raw `toLocaleString()` in newly
  touched UI.
- Keep security helper tests close to URL, upload, auth, sanitizer, and route
  boundary code.
- Use Playwright instead of Jest when rendered async Server Component behavior
  is the more faithful test.

### Medium Browser Harness

Purpose:

- Validate rendered, hydrated, user-observable behavior against local app
  targets.

Required shared fixtures:

- `test` and `expect` exports from `tests/testHelpers.ts`.
- `gotoAndReady(path)` that waits for usable route state and asserts successful
  response where applicable.
- Console error, page error, and failed request collection with narrow allowlist.
- `expectNoHorizontalOverflow()`.
- `expectVisibleFocus()` and keyboard tab helpers.
- `expectLandmarks()` for main/header/nav/footer where applicable.
- `expectAxeClean()` using `@axe-core/playwright`.
- `expectNoMissingI18nKeys()` when app instrumentation exists.
- Stable screenshot names:
  `<pack>-<route-slug>-<surface>-<locale>-<state>-<short-hash>`.
- Trace and screenshot capture on failure.
- Read-only mutation guard for staging and production:
  - `PLAYWRIGHT_READONLY=1` is default outside local.
  - shared fixtures intercept network requests and fail the test on
    non-allowlisted mutations;
  - the denylist must include posting, deletion, voting, moderation, admin,
    wallet/signing, upload, profile write, and deploy-control endpoints;
  - allowlists are environment-specific, reviewed, and stored with the test
    harness;
  - read-only safety is enforced by interception, not by test discipline.
- Redaction fixture hook that runs before traces, screenshots, videos, console
  logs, or network logs leave the runner.

PR-gating Playwright baseline:

- `web-desktop-chromium`.
- `web-mobile-chromium`.

Train or nightly projects until stable:

- `web-tablet-chromium`.
- `web-desktop-firefox` for train or nightly.
- `web-desktop-webkit` for train or nightly.
- `capacitor-ios-simulated`.
- `capacitor-android-simulated`.
- `electron-simulated`.

Config targets:

- Keep `PLAYWRIGHT_BASE_URL` for local, staging, and production targets.
- Add `PLAYWRIGHT_ENV=local|staging|production`.
- Add `PLAYWRIGHT_READONLY=1` for staging/production by default.
- Prefer production-like build/start validation for release trains when time
  permits.
- Centralize native runtime detection before relying on `@capacitor-sim` or
  `@electron-sim`; simulation projects should target one shared detection API
  rather than scattered direct Capacitor imports or user-agent checks.

### Accessibility Packs

Pack types:

- `a11y-smoke`: axe smoke on selected routes.
- `keyboard-flow`: tab order, focus visibility, escape behavior, focus return.
- `dialog-menu-overlay`: focus trap, labels, roles, state, close behavior.
- `form-a11y`: labels, descriptions, errors, required/invalid state.
- `media-a11y`: image alt, video controls/captions where applicable.
- `landmark-heading`: main/header/nav/footer, heading order, page title.
- `screen-reader-smoke`: accessible tree snapshots or manual SR notes for
  high-risk flows.

Rules:

- Automated a11y is a regression guard, not a WCAG certificate.
- `expectAxeClean()` must use a documented axe profile. Start with rules that
  catch owned semantic, label, color-contrast, landmark, and form issues without
  blocking on known third-party or user-generated content outside our control.
- Known axe exceptions require a route/component, selector, owner, reason,
  expiry, and follow-up. Do not disable axe wholesale for a route family.
- New visible UI needs keyboard/focus evidence.
- Icon-only controls need accessible names and hover/focus tooltips where
  useful.
- Do not attach mouse/keyboard handlers to non-interactive elements.

### I18n Packs

Pack types:

- `i18n-source-messages`: source locale key completeness.
- `i18n-locale-matrix`: route smoke across supported locales.
- `i18n-formatting`: dates, times, numbers, percentages, lists, relative time,
  compact values.
- `i18n-accessible-names`: visible copy and accessible names share messages.
- `i18n-long-text`: wrapping and overflow for long labels.
- `i18n-sort-filter`: locale-sensitive sorting and filtering when applicable.
- `i18n-metadata`: page titles, descriptions, alt text, and canonical/locale
  policy where touched.

Rules:

- `en-US` remains canonical source locale.
- Non-source locales may fall back to `en-US` until reviewed translations are
  available.
- User-generated content remains in the user's authored language unless a
  product translation feature explicitly changes it.
- Optional later stress cases: pseudo-locale, long German strings,
  accent-heavy French/Spanish, and bidi smoke when RTL is in scope.

### Security-Sensitive Packs

Pack types:

- `security-readonly-auth`: anonymous/authenticated boundary behavior with
  approved test identity only.
- `security-wallet-readonly`: wallet UI state, connection prompts, and blocked
  transaction paths without signing.
- `security-upload-local`: file validation, drag/drop, paste, size/type
  rejection, preview behavior.
- `security-preview-api`: URL preview and media proxy safety paths.
- `security-xss-smoke`: unsafe HTML, markdown, link, and preview payload smoke
  using local or mocked data.
- `security-headers`: CSP/security header checks where configured.
- `security-prod-safe`: production smoke that forbids public posts, purchases,
  transfers, signer changes, Safe actions, and destructive data mutations.

Rules:

- Use OWASP ASVS and WSTG as a coverage map, not a promise of certification.
- Keep exploit details out of public artifacts and PR descriptions.

### Performance, Visual, And Responsiveness Packs

Pack types:

- `responsive-layout`: desktop, tablet, mobile widths, no horizontal overflow.
- `visual-smoke`: stable screenshots for high-risk migrated surfaces.
- `performance-smoke`: basic load and route interaction timing for train
  validation, with budgets only after baseline data exists.
- `reduced-motion`: major animated UI respects reduced motion.
- `canvas-media-smoke`: images, video, NFT previews, and canvas-heavy areas are
  nonblank and framed correctly.

## Surface Evidence

| Surface | Coverage goal | Testing mode |
| --- | --- | --- |
| Main desktop web | Full migration confidence | Jest, Playwright desktop, axe, keyboard, staging/prod smoke |
| Mobile web | Layout and touch confidence | Playwright mobile projects, viewport screenshots, touch/zoom checks |
| Capacitor iOS | Native-adjacent confidence | Simulated Playwright first, real shell smoke later |
| Capacitor Android | Native-adjacent confidence | Simulated Playwright first, real shell smoke later |
| Electron/Desktop Shell | Shell-adjacent confidence | Electron user-agent simulation first, real shell smoke later |
| Standalone/exported surfaces | Independent confidence | Surface-specific build/export and browser smoke |
| Staging | Deployment candidate confidence | Deployed Playwright smoke plus release-specific packs |
| Production | Live safety confidence | Read-only smoke, changed-route checks, console/network checks |

Evidence labels:

- `simulated`: browser-driven approximation, such as mobile viewport,
  Capacitor flag simulation, or Electron user-agent simulation.
- `shell-smoke`: app launched in actual native or desktop shell with basic route
  and interaction checks.
- `real-device`: app checked on a real mobile device, emulator, simulator, or
  desktop shell that exercises the target runtime.
- `production-observed`: read-only validation against production for the exact
  deployed version.

Do not write "Capacitor verified", "Electron verified", or "native verified"
when only browser simulation was run.

## Execution Ladder

| Stage | Goal | Required signal |
| --- | --- | --- |
| Local inner loop | Fast agent/developer feedback | `@small` tests, changed lint/typecheck, focused component tests |
| Local pre-PR | Prove touched workflow locally | Risk level, hazard analysis, selected packs, focused Playwright for visible UI |
| PR CI | Repo-owned baseline before review/deploy | frozen install, lint, typecheck, test typecheck, focused/full Jest by risk, build when needed, small Playwright smoke |
| Review | Independent reasoning | 6529reviewbot lanes, GLM swarm when available, human/agent review, findings mapped into manifest |
| Post-merge/train | Validate train composition | exact PR set, exact SHA, release report, selected medium/large packs |
| Staging | Validate production candidate | read-only staging Playwright, changed routes, owner validation, durable artifacts |
| Production | Validate live release | exact deployed SHA, read-only smoke, error/route/API watch, public notes only after green |
| Nightly/scheduled | Catch drift cheaply | broader browsers, Firefox/WebKit, full Jest, flake detection, dependency/security checks |

## Pull Request Workflow

Before opening:

- Use a clean worktree based on current `origin/main`.
- Run `seize-local-dev bootstrap`.
- Use the assigned frontend port from `seize-local-dev status`.
- Use `seize` for package commands in Windows Codex shells.
- Use the shared backend API unless the task explicitly owns backend state.
- Complete the pre-PR impact/testing plan from `mega-run-pr-playbook.md`.
- Assign risk level and hazard analysis.
- Select required sizes and packs.
- Prepare the validation manifest and artifact storage plan.

Minimum local validation:

- `seize run lint:changed`.
- `seize run typecheck:changed`.
- Focused Jest tests for touched helpers/components.
- Focused Playwright route pack for touched visible UI.
- Keyboard/focus evidence for visible UI.
- Locale matrix evidence for migrated UI.
- Mobile viewport evidence.
- Native-surface decision: web-only, simulated native, or real native needed.
- Security safety decision for auth/wallet/upload/posting/admin surfaces.

Before merge:

- Required local checks pass.
- Required CI checks pass.
- Reviewbot findings are fixed or explicitly deferred.
- Required artifacts and durable pointers exist for retained evidence.
- Level 3+ PRs have independent verifier signoff.
- PR is assigned to a deployment train.

## CI And Deployment Gates

### Pull Request CI

Required baseline:

- Deterministic risk-floor classifier plus manually declared risk level.
- Frozen install.
- Package metadata and lockfile checks.
- Typecheck app.
- Typecheck tests.
- Lint.
- Jest focused or full run based on risk and cost.
- Build when routing, Next config, generated models, deployment-sensitive code,
  or shared behavior changes.
- Security baseline: secret scan, dependency vulnerability policy check, and
  workflow permission/secret exposure check.
- Playwright smoke for core routes and changed routes when feasible.
- Short-term artifact upload for CI debugging.
- Validation manifest check for Level 2+ PRs.
- Fork PRs and untrusted PRs do not receive secrets, staging credentials,
  Anthropic/OpenRouter keys, artifact-store write access, or deployment
  permissions. Use `pull_request` for untrusted validation; do not use
  `pull_request_target` for code execution from forks.

### Staging

Required before production promotion:

- Exact staging SHA recorded.
- Included PRs recorded.
- Risk level for each PR and train overall recorded.
- Required packs listed by release risk.
- Core deployed smoke passes.
- Each PR owner validates their surface.
- Independent verifier signs off for Level 3+ PRs.
- Durable artifact pointers for staging reports, traces, screenshots, and
  validation manifests recorded.
- Failed, flaky, or held checks are resolved or removed from the candidate.
- Level 3+ trains are not eligible for production promotion unless PR 1
  harness repair and PR 5 deployment evidence integration are already green, or
  a release captain records a temporary manual-validation exception.

### Production

Required after production deployment:

- Exact production SHA or version label recorded.
- Production promotion uses the exact immutable SHA validated on staging. If
  `origin/main` advanced after staging validation, re-validate the new SHA or
  promote the already validated SHA through the deployment process.
- Production artifact manifest recorded on 6529-controlled storage.
- Changed routes load and hydrate.
- Critical API calls succeed.
- Console and network checks show no release-critical errors.
- Static assets load from expected build.
- No destructive actions unless explicitly requested.
- Required post-deploy watch checkpoints completed for Level 4+ and Level 5
  trains.
- Public release notes and Follow The Repo notes only after production
  validation is green.

### Auto-Hold And Canary Direction

Initial implementation should be auto-hold, human rollback. Future deployment
infra can move toward true canary or traffic-split rollout.

Hold the train if any of these occur:

- Production candidate SHA or included PR set is unclear.
- Staging failed and the cause is unknown.
- Test evidence contradicts PR or release-report claims.
- Auth, wallet, upload, posting, admin, infra, or deploy control changed
  without required security packs.
- Native behavior is claimed but only browser simulation was run.
- High-confidence security, WCAG, data-loss, or deployment-risk finding is
  open.
- Production Sentry, API errors, console errors, or critical route health
  worsens after deployment and the cause is unknown.
- Required durable artifacts are missing or only exist as temporary logs.
- Any `@auth`, `@wallet`, `@security`, `@upload`, `@readonly-prod`, or
  deployment-gate test needed for the train is quarantined.

Future canary target:

- Deploy candidate to a small production slice or feature-flag population.
- Compare candidate and control for route health, API errors, frontend errors,
  latency, static assets, and key workflow smoke.
- Automatically hold or roll back when canary health fails.

## Deployment Train Release Report

Every train should produce a release report with:

- Train name, release captain, staging SHA, production SHA, and timestamps.
- Included PRs, titles, owners, verifiers, and risk levels.
- Diff range since previous production release.
- Required test packs and commands.
- CI, reviewbot, GLM swarm, human review, staging, and production evidence.
- Durable artifact pointers.
- Skipped checks, accepted risk, and follow-up owners.
- Rollback/fix-forward path.
- Post-deploy watch result.
- Public note URLs after production validation is green.

This report is the human-readable release record. The validation manifests and
artifact store are the machine-readable evidence.

## Artifact Strategy

Evidence is a first-class release artifact:

- Command names and summarized results.
- Jest summaries.
- Playwright HTML reports.
- Playwright traces, screenshots, videos when useful, and console/network logs.
- Axe results and manual keyboard/focus notes.
- Locale screenshots or extracted text samples for migrated UI.
- Reviewbot, GLM swarm, and human review URLs.
- Staging and production run URLs, candidate SHAs, and validation manifests.
- Known skipped checks and accepted-risk notes.

Do not store validation artifacts in Git LFS. Do not commit large generated
artifacts into the repo. GitHub Actions artifacts are acceptable for short-term
CI debugging, but they are not the durable record for the mega run.

Durable artifacts should live on 6529-controlled infrastructure. The practical
default is a private S3 bucket or equivalent private object store because most
reports, traces, logs, and screenshots are internal validation material.
IPFS/IPNS with controlled pinning is useful when public, content-addressed
provenance is desired. A future 6529 artifact service can wrap either storage
backend.

Manifest pointers should include:

- S3 URI plus ETag/version ID or IPFS CID.
- Content hash.
- Retention class.
- Access class.
- Redaction status.
- Producing workflow run and command.

Artifact rules:

- Validation manifests and artifact pointer files must be checked against a
  versioned JSON schema in CI before Level 2+ train assignment.
- Missing required artifacts or invalid artifact pointers are hard gate failures
  for Level 3+ PRs and deployment trains.
- If artifact upload fails after tests pass, the PR or train remains held until
  the artifact is uploaded or a release captain records a temporary exception
  with expiry.
- Redact or avoid secrets, cookies, auth headers, wallet data, private user
  data, local paths, and hidden prompts.
- Keep sensitive artifacts private and separated from public PR comments.
- Store only durable pointers in PR descriptions when the raw artifact should
  remain private.
- Prefer content-addressed or versioned storage where possible.
- All retained artifacts pass through `scrub -> verify -> upload`:
  - scrub removes cookies, authorization headers, API keys, wallet addresses
    when not needed, session identifiers, local paths, prompt internals, request
    bodies for private endpoints, and response bodies with user-private data;
  - verify fails closed if known secret patterns, credential headers, staging
    credentials, bearer tokens, wallet-signing payloads, or local credential
    paths remain;
  - upload happens only after verification passes.
- Add a regression test that plants fake secrets into representative trace/log
  content and proves the verifier blocks the upload.
- `@auth`, `@wallet`, `@security`, `@upload`, and `@readonly-prod` raw traces
  and network logs must remain in private, deletable 6529-controlled object
  storage. Do not publish these artifacts to IPFS/IPNS.
- IPFS/IPNS is reserved for public, deliberately redacted, content-addressed
  provenance artifacts only.

## Mutation Endpoint Registry

The read-only mutation guard depends on a versioned registry of state-changing
endpoints and wallet/signing operations.

Registry requirements:

- Store endpoint patterns, HTTP methods, owning surface, environment-specific
  allowlist status, and review owner.
- CI should fail when route handlers, API clients, or mutation helpers add
  state-changing calls that are not represented in the registry.
- Staging and production Playwright fixtures must load the registry and fail on
  non-allowlisted mutations when `PLAYWRIGHT_READONLY=1`.
- Registry drift between local, staging, and production must be visible in the
  release report.
- The registry is a safety control, not documentation; tests should prove it
  catches representative unsafe mutations.

## Agentic Operating Model

Manager:

- Owns workstream goal, memory, release train, and final evidence.
- Keeps `README.md`, `active-context.md`, `run-log.md`, this strategy, and PR
  descriptions current.
- Splits work into non-overlapping implementation scopes.
- Assigns validation owners per PR and per train.
- Enforces risk levels, stop-the-line rules, and durable artifact requirements.
- Keeps deployment trains serialized unless a release captain approves overlap.

Explorer agents:

- Inspect route/test/deploy context.
- Return file paths, risks, and proposed packs.
- Do not edit files.

Worker agents:

- Implement bounded testing infrastructure or page-cluster fixes.
- Own disjoint file sets.
- Add or update focused tests.
- Preserve unrelated dirty changes.

Verifier agents:

- Run local commands and Playwright packs.
- Inspect screenshots, traces, logs, manifests, and deploy evidence.
- Try to falsify the PR owner's claims.
- Refuse native, staging, or production claims that are only simulated or
  missing exact SHA evidence.
- For Level 3+ PRs, use a different agent instance from the worker, preferably a
  different model family when available.
- Start from a clean worktree based on the PR head, rerun required commands,
  and inspect generated artifacts rather than trusting worker-reported output.
- Write a separate verifier note or manifest section with commands run,
  evidence inspected, unresolved doubts, and final signoff/hold decision.

Reviewer agents:

- Review final diffs for regressions, missing tests, security, WCAG, i18n, and
  deployment risk.

Release captain:

- Owns one deployment train at a time.
- Confirms every PR has risk level, validation manifest, and artifact pointers.
- Confirms all train PRs are reconciled with current `origin/main`.
- Confirms staging and production promotion use the same immutable candidate
  SHA, or records why re-validation was required after `origin/main` advanced.
- Decides rollback versus fix-forward when a train stops.

Command-and-control rules:

- One owner per PR.
- One release captain per deployment train.
- One independent verifier for Level 3+ PRs.
- Owned paths must be explicit before implementation begins.
- No PR joins a train without a validation manifest.
- No stale patch joins a train without reconciliation against current
  `origin/main`.
- No train deploys while another train controls the same production lane unless
  release captains coordinate the overlap.

## Reviewbot And GLM Swarm

The existing `6529reviewbot` lanes remain required but secondary to tests:

- `general` for broad correctness.
- `wcag` for accessibility risks.
- `i18n` for localization risks.
- `security` for security-sensitive changes.
- `responsiveness` for layout and viewport risk.

Every PR description must state how reviewbot findings were fixed, deferred,
or marked false positive. For Level 3+ PRs, reviewbot findings must be mapped
into the validation manifest.

Swarm and reviewbot feedback model:

- Reviewbot, GLM, Codex reviewers, and scanner outputs are hypothesis
  generators. They are allowed to be high-recall, noisy, and redundant.
- A swarm finding normally creates feedback for Codex to evaluate, fix, rerun,
  or explicitly dismiss. It does not take decision authority away from Codex.
- A finding can block promotion only when it maps to a disaster-class hard
  invariant violation with deterministic, reproducible evidence.
- Missing evidence required by the risk floor holds promotion until Codex
  produces the evidence, records an accepted exception, or moves the PR out of
  the train. It should not stop Codex from continuing to iterate.
- Non-invariant findings become advisory risk signals, auto-fix candidates, or
  logged noise. They should not block merge by volume, majority vote, or model
  confidence alone.
- No PR may be blocked solely because two swarms disagree. Contradictions are
  resolved by invariant precedence, reproducibility, and deterministic test
  evidence.
- Codex plus review bots should continue cycling on a PR until no new useful
  findings or safe patches are produced. For safe classes, merge can proceed
  once deterministic gates pass and the cycle has stopped adding value.
- Hard blocks should be exceptional. When in doubt, feed the finding back into
  Codex for another iteration rather than giving the bot/test more authority
  than the coding agent.

Add a separate, parallel GLM/OpenRouter swarm review path. It should not
replace the existing Opus-backed lanes. It should run beside them and post one
synthesized comment: `6529bot GLM Swarm Review`.

Initial target model:

- `z-ai/glm-5.2` through OpenRouter, subject to verification at implementation
  time.
- As of 2026-06-20, OpenRouter listed GLM 5.2 at a 1M-token context window with
  `$1.20 / 1M` input tokens and `$4.10 / 1M` output tokens.
- Z.ai direct pricing listed GLM-5.2 at `$1.40 / 1M` input tokens, `$0.26 / 1M`
  cached input tokens, and `$4.40 / 1M` output tokens.
- Prices, routing, context limits, and provider availability must be rechecked
  before implementation.

Suggested GLM internal threads:

1. Diff risk classifier.
2. Missing test evidence auditor.
3. Changed-route smoke planner.
4. WCAG semantic HTML reviewer.
5. Keyboard and visible-focus reviewer.
6. Dialog, menu, popover, and overlay reviewer.
7. I18n hardcoded-copy reviewer.
8. I18n date, number, percent, relative-time, and sorting reviewer.
9. Long translated text and wrapping reviewer.
10. Mobile and responsive layout reviewer.
11. Capacitor/native-adjacent reviewer.
12. Electron/Desktop Shell reviewer.
13. Auth, session, cookie, and token reviewer.
14. Wallet, signing, and transaction-safety reviewer.
15. Upload, media, and link-preview reviewer.
16. XSS, unsafe URL, and unsafe HTML reviewer.
17. Next.js rendering, hydration, routing, and build-risk reviewer.
18. Loading, error, empty-state, and recovery reviewer.
19. Deployment, staging, production, and rollback-risk reviewer.
20. Contrarian reviewer: strongest argument this PR should not merge yet.

High-risk GLM lanes should be adversarial:

- How could this break auth or session recovery?
- How could this show the wrong wallet, profile, owner, or identity?
- How could this misdescribe a signing action?
- How could this make posting, deletion, moderation, voting, or admin actions
  available when they should not be?
- How could this upload, media, or link-preview path allow unsafe URLs, unsafe
  HTML, or script execution?
- How could translated or long text hide an important action?
- How could this remove accessible names, focus order, or keyboard operation?
- How could this route expose admin or private UI to the wrong user?
- How could this PR claim mobile, Capacitor, Electron, staging, or production
  evidence that was not actually collected?
- What exact invariant from this strategy is untested or contradicted?

GLM posting rules:

- Post one synthesized comment, not twenty comments.
- Keep the final comment to the strongest findings.
- Every finding must cite a file/line, PR section, CI result, or missing
  evidence field.
- Mark severity and confidence.
- Include required test packs for evidence findings.
- Treat GLM swarm findings as advisory at first.
- Do not pass secrets, credentials, cookies, raw production data, or hidden
  prompts to the GLM job.
- Store retained raw swarm outputs on approved artifact storage, not Git LFS.
- Record model slug, provider, prompt version, prompt hash, tokens, cost,
  latency, and comment URL.
- Do not run GLM or any external-model job with secrets on fork or untrusted
  PRs. For untrusted PRs, run only local static classifiers that do not require
  external API keys.
- Thread selection is risk based:
  - Level 0-1: risk classifier plus missing-evidence auditor only;
  - Level 2: add WCAG, i18n, mobile, and changed-route planning lanes;
  - Level 3+: allow full adversarial fan-out when within budget;
  - Level 4-5: full fan-out plus release/deploy and contrarian lanes.
- Initial budget caps:
  - per PR hard cap: 300k input tokens and 40k output tokens;
  - full fan-out hard cap: 20 internal threads;
  - diff-size cap: summarize or chunk large diffs before fan-out;
  - kill switch: one config flag disables GLM without disabling existing
    Opus-backed reviewbot lanes.

## Production Readiness For Level 4-5

Use PRR-lite only for Level 4-5 work. Do not apply it to ordinary UI patches.

Checklist:

- What production user journey can fail?
- What dependencies are involved?
- What metrics and alerts observe the change?
- What is the rollback or fix-forward path?
- What data, auth, wallet, upload, or admin state can be harmed?
- What secrets, credentials, or private artifacts are involved?
- What is the capacity/performance risk?
- Who is release captain?
- Who is verifier?
- Who watches production and for how long?
- What public communication waits for production validation?

## Metrics And Project Health

Track whether the system is getting safer and faster:

- Escaped defects by risk level and test pack.
- Failed staging causes.
- Production rollback or fix-forward events.
- Reviewbot true positives and false positives.
- GLM swarm unique useful findings, duplicates, and false positives.
- Average PR validation time by risk level.
- Flaky test rate by pack and surface.
- Percent of PRs with complete validation manifests.
- Percent of deployment trains with durable artifact pointers.
- Percent of Level 3+ PRs independently verified before merge.
- Large test runtime and ownership coverage.
- Time from merge to production validation.

Metrics guide investment. They should not punish honest stop-the-line calls.

## First Implementation Train

### PR 0: Executable Safety Controls And Manifest Schema

Goals:

- Land this coherent strategy.
- Add validation manifest schema and examples.
- Add risk-level and hazard-analysis templates.
- Implement deterministic risk-floor classifier with conservative Level 3+
  path globs.
- Add risk downgrade fields that require release-captain approval.
- Define artifact pointer fields for S3, IPFS, or future 6529 artifact service.
- Define redaction contract for screenshots, traces, logs, and model outputs.
- Define read-only mutation-guard contract for staging and production tests.
- Define stop-the-line states and train assignment requirements.

Exit criteria:

- Page-cluster PRs have a standard safety-case template.
- Low-risk PRs can move quickly without pretending to be high-risk releases.
- Guarded risks are automatically routed to guarded lanes by an executable
  classifier, not by self-reporting.
- Risk downgrades are impossible without a release-captain manifest entry.
- Agents can record artifact URI, hash/CID/ETag, retention class, redaction
  status, workflow run, and producing command.
- The strategy is explicit that Git LFS is not the artifact store.

### PR 1: Test Harness Repair And Test Sizing

Goals:

- Restore or replace `tests/testHelpers.ts`.
- Repair local and staging Playwright smoke.
- Add shared page error, console error, no-overflow, screenshot, and route-ready
  helpers.
- Add read-only mutation guard with request interception for staging and
  production tests.
- Add artifact redaction hook and fake-secret regression test before retained
  traces/logs/screenshots are uploaded anywhere.
- Add `@small`, `@medium`, `@large` conventions.
- Add test typecheck coverage for Playwright helpers.

Exit criteria:

- `seize run test:e2e` can run at least core local smoke.
- `seize run test:e2e:staging` can run against staging in read-only mode.
- Staging/production tests fail closed on non-allowlisted mutations.
- Representative fake secrets are blocked by the redaction verifier.
- Missing helper imports are impossible to miss in test typecheck.
- Test-size guidance is visible to agents and reviewbot.

### PR 2: App PR CI Baseline

Goals:

- Add broad pull request workflow for ordinary app changes.
- Run install, lint, typecheck, test typecheck, Jest, build when needed, and a
  small Playwright smoke pack.
- Add risk-aware execution ladder.
- Enforce the deterministic risk-floor classifier in PR CI.
- Add security baseline checks: secret scanning, dependency vulnerability
  thresholds, and workflow permission/secret exposure review.
- Upload short-term CI artifacts.
- Avoid secret exposure for fork PRs.
- Use least-privilege workflow permissions.

Exit criteria:

- Ordinary app PRs receive repo-owned CI signal before reviewbot/deployment.
- Untrusted PRs never receive API keys, staging credentials, deployment
  permissions, or artifact-store write credentials.
- CI evidence is inspectable by agents.
- Expensive checks run in the right stage, not on every tiny PR.

### PR 3: WCAG/I18n Playwright Foundation

Goals:

- Add `@axe-core/playwright`.
- Add accessibility fixture and first route-level axe smoke.
- Add documented axe rule profile and expiring allowlist mechanism.
- Add keyboard/focus helpers.
- Add locale fixture for supported locale matrix.
- Add first long-label/wrapping smoke for migrated public routes.

Exit criteria:

- A migrated route can produce WCAG/i18n browser evidence with one command.
- Reports distinguish automated a11y from manual WCAG verification.

### PR 4: Surface Matrix And Large-Test Ownership

Goals:

- Add Playwright projects for desktop and mobile.
- Centralize native runtime detection before relying on simulation projects.
- Add Electron simulation against the centralized detection API.
- Add Capacitor iOS/Android simulation against the centralized detection API.
- Document simulation limits.
- Add owner/purpose/runtime/flake policy for large Playwright packs.
- Keep Firefox, WebKit, tablet, Capacitor simulation, and Electron simulation
  train/nightly-only until desktop and mobile Chromium are stable.
- Identify what is needed for future real native shell smoke.

Exit criteria:

- Page-cluster PRs can declare exact covered surfaces.
- Simulated native evidence is never mislabeled as real native evidence.
- Large tests have owners and repair expectations.
- Native-adjacent simulation is based on one shared runtime-detection path.

### PR 5: Deployment Evidence And Release Reports

Goals:

- Connect Playwright outputs to deployment bus manifests.
- Define staging and production pack names.
- Add train-level release report template.
- Integrate validation manifests with approved artifact storage.
- Store durable artifact pointers, not Git LFS blobs.
- Require surface owners to report validation slices.
- Add auto-hold criteria for staging/production promotion.
- Add SHA-pinned promotion: production promotes the exact staging-validated SHA
  or re-validates if `origin/main` advanced.

Exit criteria:

- A deployment train has exact SHA, included PRs, required packs, owners,
  evidence, failures, skipped checks, and final status.
- Staging and production evidence can be reloaded from 6529-controlled artifact
  storage by a future agent.
- Release reports make train state clear to humans.
- Level 3+ page-cluster work is blocked unless PR 1 and PR 5 gates are green or
  a release captain records a temporary manual-validation exception.

### PR 6: Open-Model Swarm Reviewbot

Goals:

- Keep current Opus-backed `6529reviewbot` lanes unchanged.
- Add a separate GLM/OpenRouter swarm review job.
- Fan out one PR review into narrow internal GLM threads.
- Synthesize outputs into one posted GLM swarm review comment.
- Add cost caps, telemetry, prompt/version tracking, and kill switch.
- Add risk-based thread selection, per-PR token caps, diff-size caps, and
  untrusted-PR restrictions.
- Store retained raw swarm outputs on approved artifact storage.
- Keep first rollout advisory.

Exit criteria:

- A test PR receives normal reviewbot plus one separate GLM swarm comment.
- GLM comments cite concrete file lines or missing evidence.
- Raw internal outputs are available for maintainers but do not spam the PR.
- Cost, latency, and usefulness can be measured per PR.
- Full fan-out cannot run accidentally on low-risk or untrusted PRs.

### PR 7: Canary And Feature-Flag Direction

Goals:

- Document what current infra can support: auto-hold, staged watch, feature
  flags, traffic splitting, or none.
- Add canary-readiness requirements for Level 4-5 changes.
- Define candidate-vs-control metrics for future rollout automation.

Exit criteria:

- Current production watch is explicit.
- Future canary work has clear prerequisites.

## Page-Cluster PR Requirements After The Sidequest

Before opening:

- Complete the pre-PR impact and testing plan from `mega-run-pr-playbook.md`.
- Record computed risk floor, declared risk level, final risk level, and hazard
  analysis.
- Select required test sizes and packs from this strategy.
- Run the local checks that match the impact plan.
- Capture evidence for web, mobile, and relevant native-adjacent surfaces.
- Prepare the validation manifest and durable artifact storage plan.
- For Level 3+ PRs, confirm PR 1 and PR 5 gates are already green or obtain a
  release-captain temporary manual-validation exception before opening.

In the PR description:

- State this is part of the WCAG 2.2 AA and i18n mega run.
- State risk level, safety-case summary, and required gates.
- Link the affected route cluster.
- State functionality, UX, safety, web, mobile/Capacitor, and Electron impact.
- List local commands and Playwright packs run.
- List manual checks performed.
- Link durable artifact pointers or explain when they will be produced.
- List reviewbot findings and decisions.
- List residual risk and exceptions.

Before production:

- Staging passed for the exact immutable production candidate SHA or release
  set. If `origin/main` advanced after staging, re-validate or promote the
  already validated SHA.
- Changed surfaces have owner validation.
- Core smoke passed.
- Required post-deploy watch plan exists.
- Production deployment is SHA-pinned and matches the release report.

## Success Criteria

The sidequest is complete when:

- Local Playwright and deployed staging smoke are reliable.
- Ordinary app PRs have repo-owned CI gates.
- Test files and helpers are typechecked.
- Deterministic risk-floor classifier is enforced in CI and downgrade requires
  release-captain manifest approval.
- Staging/production Playwright has request-interception mutation guard.
- Artifact redaction pipeline is tested with fake-secret regression coverage.
- `@small`, `@medium`, and `@large` sizing exists and is used.
- WCAG/i18n Playwright helpers exist and are documented.
- Desktop and mobile browser projects exist.
- Native-adjacent simulation is explicit and documented.
- Native runtime detection is centralized before Capacitor/Electron simulation
  is trusted.
- Large Playwright packs have owners, purpose, runtime expectations, and flake
  policies.
- Staging and production validation produce durable artifact pointers on
  6529-controlled infrastructure, not Git LFS.
- Page-cluster PRs use risk levels, hazard analysis, validation manifests, and
  traceable safety-case evidence.
- Fast, standard, guarded, and release-captain lanes speed safe work without
  flattening risk.
- Reviewbot and GLM swarm ask adversarial questions tied to invariants.
- Level 3+ PRs receive independent verification before merge.
- Level 4-5 PRs receive PRR-lite review.
- Deployment trains have release captains, release reports, exact candidate
  SHAs, auto-hold criteria, and post-deploy watch evidence.
- GLM swarm has risk-based fan-out, cost caps, diff caps, untrusted-PR
  restrictions, and a kill switch.
- Agents can join the workstream, read this strategy, and produce comparable
  validation evidence without bespoke instructions.

## Open Decisions

- Decide exact first-pass risk-floor glob list during PR 0 implementation.
- Decide whether first CI workflow should run changed-file Jest plus scheduled
  full runs, or full Jest on every PR after baseline timing is measured.
- WebKit and Firefox default to train/nightly gates until desktop/mobile
  Chromium is stable; decide when to promote them to PR gates.
- Decide when real Capacitor/Electron smoke becomes mandatory instead of
  simulated only.
- Decide whether coverage ratchets should apply only to critical helpers first
  or to broader directories.
- Decide whether to add pseudo-locale support during this sidequest or after the
  first successful page-cluster train.
- Private 6529-controlled object storage is the default durable artifact
  backend; decide exact bucket/service names, retention classes, and IAM roles.
- IPFS/IPNS is only for intentionally public, redacted provenance artifacts.
- Decide what current deployment infra can support for auto-hold, feature flags,
  and future canary rollout.
