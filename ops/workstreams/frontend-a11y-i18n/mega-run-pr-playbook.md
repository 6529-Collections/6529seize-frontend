# Mega Run PR Playbook

Use this playbook for every page or cluster of pages in the frontend WCAG/i18n
mega run. The reviewbot is an additional reviewer, not a substitute for local
engineering judgment, local testing, or browser verification.

## Required Order

1. Define the page cluster and affected workflows.
2. Complete the pre-PR impact and testing plan before opening the PR.
3. Implement the changes in a clean worktree based on current `origin/main`.
4. Run the planned local validation, including Playwright where UI behavior is
   visible or cross-surface behavior matters.
5. Open the PR with the full PR description template below.
6. Wait for `general`, `wcag`, `i18n`, `security`, and `responsiveness`
   reviewbot lanes plus external checks.
7. Fix real findings, document false positives or accepted exceptions, then
   assign the PR to a deployment train.

## Local Environment Standard

Keep a strong local environment for the whole mega run:

- Bootstrap each frontend worktree with `seize-local-dev bootstrap`.
- Use the shared local backend, MySQL, and Redis services unless the page
  cluster explicitly requires backend ownership.
- Use the repo command model. On this Windows Codex host, AGENTS.md documents
  the local helpers: `seize run <script>`, `seize exec playwright test`, and
  `seize-local-dev start-frontend`. In other repo environments, use the
  equivalent repo `6529` wrapper command.
- Prefer focused checks first, then broaden when the change touches shared
  primitives, routing, config, or build-sensitive code.
- Use Playwright for real browser verification. Curl or status-only checks are
  not enough for UI changes because they miss hydration, focus, layout,
  JavaScript, and runtime errors.
- Capture enough Playwright evidence to prove the changed workflows work on the
  relevant surfaces. Screenshots are required when visual layout changes.
- Record all known local-environment gaps, such as unavailable native shells or
  known broken staging harnesses.

## Surface Matrix

For every page cluster, assess all three surfaces. If a surface is not relevant,
say why.

| Surface | Required questions | Minimum local validation |
| --- | --- | --- |
| Web | What desktop and mobile web routes, auth states, loading states, URL params, metadata, and navigation paths can change? | Desktop and mobile Playwright smoke for changed routes; keyboard/focus checks; console/page-error review; route docs review. |
| Mobile/Capacitor | Does the change affect app shell, deep links, safe areas, keyboard behavior, push/share/upload flows, scanner, hidden desktop-only controls, or Capacitor-only branches? | Mobile viewport Playwright checks; user-agent or runtime-flag simulation where practical; virtual keyboard and safe-area review when forms or fixed UI are touched. |
| Electron/Desktop Shell | Does the change affect share/deep-link flows, desktop app connection handoff, hidden Electron branches, external links, storage, window sizing, or desktop-only controls? | Browser checks for Electron-gated UI branches where simulation exists; route docs/code review for shell-specific branches; explicit residual risk if native Electron cannot be run locally. |

## Pre-PR Impact And Testing Plan Template

Complete this before opening the PR. Keep it in the PR body, and optionally copy
it into `mega-run-status.md` when the cluster is large.

```md
## Migration Context

This PR is part of the frontend WCAG 2.2 AA and i18n migration mega run. It
keeps visible copy, accessible names, locale-sensitive formatting, semantic
interaction, keyboard/focus behavior, mobile behavior, and native-shell-adjacent
surfaces aligned with the frontend accessibility and localization standards.

## Page Cluster

- Routes/pages:
- Components/primitives:
- User workflows:
- Auth/data states:
- Related docs/tests:

## Change Intent

- WCAG goals:
- I18n goals:
- Non-goals:
- Existing debt intentionally left:

## Functionality Impact

- User-visible behavior that should remain unchanged:
- Behavior intentionally changed:
- Data fetching, caching, routing, URL params, metadata, or state risks:
- Backward compatibility risks:

## UX Impact

- Layout, responsive, wrapping, overflow, or density risks:
- Focus order and visible focus risks:
- Loading, empty, error, disabled, selected, and validation states:
- Copy, labels, names, and long-text risks:

## Safety And Security Impact

- Auth, wallet, transaction, signing, admin, moderation, upload, or privacy risks:
- External links, media, embeds, markdown, or user-generated content risks:
- Secret, token, local path, prompt, or private-data exposure risks:
- Abuse, spoofing, phishing, or accessibility dark-pattern risks:

## Surface Assessment

- Web:
  - Relevant? yes/no:
  - Why:
  - Test plan:
- Mobile/Capacitor:
  - Relevant? yes/no:
  - Why:
  - Test plan:
- Electron/Desktop Shell:
  - Relevant? yes/no:
  - Why:
  - Test plan:

## Local Testing Strategy

- Unit/component tests:
- Lint/typecheck/check commands:
- Playwright routes and viewports:
- Keyboard/focus checks:
- Screen-reader or accessibility tree smoke:
- Locale checks (`en-US`, `en-GB`, `fr-FR`, `es-ES`, `de-DE`):
- Mobile/Capacitor simulation:
- Electron simulation or code-review fallback:
- Screenshots/videos to capture:
- Known local test limitations:

## Risk Assessment

- Computed risk floor:
- Declared risk level:
- Final risk level:
- Downgrade approval, if any:
- Hazard analysis:
  - hazard -> severity -> likelihood -> detection -> required test -> rollback
    or fix-forward:

## Validation And Artifacts

- Validation manifest path:
- Durable artifact storage plan:
- Artifact redaction strategy for secrets, local paths, prompts, and private
  data:
- Reviewbot lanes expected:
```

## PR Description Template

Use this structure when opening the PR. Keep it concrete enough for reviewers,
reviewbot, and future deployment agents to understand the blast radius.

```md
## Migration Context

This PR is part of the frontend WCAG 2.2 AA and i18n migration mega run.

- Accessibility standard: `ops/standards/frontend-accessibility-wcag-22-aa.md`
- I18n standard: `ops/standards/frontend-i18n-localization.md`
- Reviewbot role: additional i18n/WCAG reviewer; not a substitute for local
  validation.
- Testing posture: local validation first, reviewbot second, deployment
  validation last.

## Summary

-
-
-

## Page Cluster And Workflows

- Routes/pages:
- Components/primitives:
- Main user workflows:
- Auth/data states covered:

## WCAG Changes

-
-
-

## I18n Changes

-
-
-

## Functionality And UX Impact

- Expected behavior preserved:
- Intentional behavior changes:
- Layout/responsive/focus/copy risks considered:
- Existing debt or exceptions:

## Surface Impact

| Surface | Impact | Validation |
| --- | --- | --- |
| Web |  |  |
| Mobile/Capacitor |  |  |
| Electron/Desktop Shell |  |  |

## Safety And Security Review

- Auth/wallet/admin/transaction impact:
- Upload/media/embed/user-generated content impact:
- Secret/private-data exposure review:
- Abuse/spoofing/phishing considerations:

## Risk And Validation

- Computed risk floor:
- Declared/final risk level:
- Hazard analysis summary:
- Validation manifest:
- Durable artifact pointers:
- Artifact redaction status:

## Local Validation

- [ ] `seize run lint:changed`
- [ ] `seize run typecheck:changed`
- [ ] `seize run check:changed` or documented focused substitute
- [ ] Targeted Jest/component tests:
- [ ] Playwright desktop routes:
- [ ] Playwright mobile routes:
- [ ] Keyboard/focus checks:
- [ ] Locale checks:
- [ ] Screenshots/videos attached or described when visual behavior changed

## Reviewbot And External Checks

- 6529bot `general`:
- 6529bot `wcag`:
- 6529bot `i18n`:
- 6529bot `security`:
- 6529bot `responsiveness`:
- CodeRabbit/Sonar/Snyk/CodeQL/DCO:
- Findings fixed:
- Findings deferred or false-positive rationale:

## Deployment Train Notes

- Suggested train:
- Rollback/fix-forward considerations:
- Staging smoke routes:
- Production smoke routes:
```

## Playwright Expectations

For visible UI changes, use Playwright to verify the actual rendered app:

### Evidence Labels

Use these labels from `testing-improvement-plan.md` section `Surface Evidence`
when documenting Playwright results:

- `simulated`: browser-driven approximation, such as desktop Chromium, mobile
  viewport, Capacitor flag simulation, or Electron user-agent simulation.
- `shell-smoke`: app launched in an actual native or desktop shell with basic
  route and interaction checks.
- `real-device`: app checked on a real mobile device, emulator, simulator, or
  desktop shell that exercises the target runtime.
- `production-observed`: read-only validation against production for the exact
  deployed version.

For a page-cluster PR, desktop web and mobile viewport Playwright are normally
`simulated`. Capacitor and Electron browser approximations are also
`simulated` until PR 4 adds stronger native-adjacent integration.

- desktop viewport for primary workflows;
- 390px or equivalent mobile viewport for responsive behavior;
- keyboard-only interaction for focusable controls;
- relevant locale query or state for i18n surfaces;
- loading, empty, error, selected, disabled, and validation states when
  reachable locally;
- console error and page error collection;
- screenshots for layout, visual, focus, overflow, and responsive changes.

When native Capacitor or Electron runtime cannot be exercised locally, document
the unavailable native capability with the evidence label used. Do not use
`shell-smoke` or `real-device` when only `simulated` browser Playwright was run.
Inspect the native-gated branch in code and record the residual risk.
