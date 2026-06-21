# Active Context

## Resume First

Read this section first after compaction or handoff.

- Latest testing-roadmap state, 2026-06-21T16:45Z:
  - PR #2806, PR #2805, and PR #2808 are merged and deployed to production.
    - PR #2806 merge SHA:
      `745130a19785fdc844410a2798ba63a6db8256e8`
    - PR #2805 merge SHA and production version:
      `cd8635e004191fc0509f253bc8d9a66c8ff51805`
    - PR #2808 merge SHA and production version:
      `1bdddd30c16c53e08601bf2bbfb67a267f517738`
    - latest staging deploy run:
      https://github.com/6529-Collections/6529seize-frontend/actions/runs/27909464160
    - latest production deploy run:
      https://github.com/6529-Collections/6529seize-frontend/actions/runs/27909937482
  - PR #2808 added executable production post-deploy watch and canary-readiness
    reporting to the deployment bus. Production deployment and read-only
    validation passed for core smoke, surface matrix, WCAG/i18n, and the new
    Waves/Profile social pack. The release report remains on hold until durable
    artifact pointers are wired to approved infrastructure and the final
    post-deploy watch checkpoint is recorded.
  - Durable artifact storage remains an operational follow-up. The deployment
    bus accepts approved S3/artifact-service/IPFS pointers, but the expected
    `s3://6529-artifacts/` storage path was not present during validation.
    Do not weaken durable-artifact holds or treat GitHub Actions artifacts as
    durable retained evidence.
  - Current implementation branch: `codex/e2e-waves-profile`, based on
    production `origin/main` `1bdddd30c16c53e08601bf2bbfb67a267f517738`.
  - Active E2E PR adds a read-only Waves/Profile pack across desktop and mobile
    Chromium plus staging/production scripts and a staging-access cookie seed
    helper. It covers `/waves`, legacy `/waves?wave=...&serialNo=...`, the
    `punk6529` public profile shell, and profile tabs:
    `/punk6529/curations`, `/punk6529/collected`, `/punk6529/xtdh`.
  - Validation for the active E2E branch passed:
    `seize run test:e2e:social-readonly` (12 passed),
    `seize run test:e2e:staging:social-readonly` (12 passed),
    `seize run test:e2e:production:social-readonly` (6 passed),
    `seize run typecheck:playwright`, `seize run typecheck:changed`,
    `seize run lint:changed`, related Jest no-tests reproduction,
    workflow-security scan, changed-secret scan, and `codex-diff-check`.
  - GLM reviewbot is live on `6529reviewbot` and should remain additive. Do
    not remove or downgrade existing Opus/general/WCAG/i18n/security/
    responsiveness reviewbot lanes for any PR.
  - Next high-value E2E PRs after Waves/Profile should cover media/mint/detail,
    delegation, NextGen/groups/tools, and broad network/open-data/static route
    matrices. Keep each pack read-only unless a dedicated authenticated-sandbox
    mutation plan exists.
- Latest rollout state, 2026-06-19T23:10Z:
  - `6529reviewbot` PR #399 is merged and live on reviewbot `main`:
    https://github.com/6529-Collections/6529reviewbot/pull/399
    - merge SHA: `db1fced6105af2a975965c5604a79d578fe5080b`
    - adds deterministic, frontend-scoped i18n/WCAG review leads and trusted
      base-ref policy context for `6529seize-frontend` reviews.
  - `6529seize-frontend` PR #2789 is merged:
    https://github.com/6529-Collections/6529seize-frontend/pull/2789
    - merge SHA: `7c966099173d3610b34a40ff989cea41340a6637`
    - `.github/6529bot.yml` now runs initial reviews:
      `general, wcag, i18n, security, responsiveness`.
  - The frontend deployment train containing PR #2788 and PR #2789 reached
    production successfully:
    - staging run: https://github.com/6529-Collections/6529seize-frontend/actions/runs/27851212528
    - staging SHA: `15504066aa5cee0c2bfaca69022fbdbf7da72590`
    - production run: https://github.com/6529-Collections/6529seize-frontend/actions/runs/27851738857
    - production SHA: `7c966099173d3610b34a40ff989cea41340a6637`
  - Production browser smoke passed for `/`, `/about/the-memes`, and
    `/the-memes` on `https://6529.io`. Non-fatal 403s were limited to current
    CloudFront media renditions for one drop video; pages returned 200 and
    rendered expected content.
  - Public notes are posted:
    - release note:
      https://6529.io/waves/05b14183-e153-4e47-bc66-42a0f49102d4?drop=b3df3435-2bae-4a7f-b9c2-5d93feb7b524
    - Follow The Repo deployment note:
      https://6529.io/waves/49f0e595-ec7c-4235-8695-a527f61b69f4?drop=f8edf3f7-4255-4889-8a24-0a8a2e8cc469
  - PR #2792 added the executable testing strategy foundation and was deployed
    to production on 2026-06-20.
  - Follow-up branch `codex/fix-staging-playwright-smoke` restores
    `tests/testHelpers.ts` and makes `seize run test:e2e:staging` run real
    browser smoke when `PLAYWRIGHT_STAGING_ACCESS_CODE` or `STAGING_AUTH` is set.
- Latest testing-roadmap state, 2026-06-21T09:42Z:
  - Current clean worktree branch: `codex/testing-e2e-surface-matrix`, based
    on current `origin/main`.
  - PR5 deployment evidence/reporting foundation is implemented locally:
    deployed-environment pack plans, release reports, auto-hold readiness
    evaluation, `record-validation-check`, workflow release-report artifacts,
    and stricter durable artifact rules.
  - PR4 branch `codex/testing-e2e-surface-matrix` adds desktop and mobile
    Chromium Playwright projects, browser-diversity projects, Capacitor/Electron
    simulation projects, and a read-only `playwright:surface-matrix` deployment
    pack.
  - Required deployed packs are now `playwright:core-smoke`,
    `playwright:surface-matrix`, and `playwright:wcag-i18n`. Required deployed
    web surfaces are `web:desktop-chromium` and `web:mobile-chromium`.
    Firefox, WebKit, Capacitor simulation, and Electron simulation remain
    optional train/nightly or targeted validation lanes and must not be claimed
    as real native/Electron-shell coverage.
  - PR4 local validation is complete before PR publication:
    `lint:changed`, `typecheck:changed`, `typecheck:playwright`,
    deployment-bus Jest tests, `test:e2e:surface-matrix`,
    `test:e2e:wcag-i18n:surface-matrix`, `test:e2e:browser-diversity`,
    `test:e2e:native-sim`, workflow YAML parse, readonly secret scan,
    workflow-security scan, `seize run build`, and `codex-diff-check` all
    passed.
  - Independent verifier feedback found the staging/prod workflow
    `--required-packs` list omitted `playwright:surface-matrix`, the Playwright
    web-server default used the local Codex `seize` helper, and the
    deployment-bus process doc still described desktop-only evidence. All three
    findings are fixed in PR4 before PR publication.
  - Durable release evidence now requires one approved artifact pointer on each
    required pack's latest passing check, with verified redaction, integrity
    metadata (`sha256`, `etag`, or `cid`), retention metadata, and no query
    strings/fragments/signed URLs/local paths/Git LFS pointers.
  - Independent verifier `Linnaeus` found four P1s before PR publication:
    global artifact readiness, invalid manifests producing ready reports, weak
    artifact URI/redaction metadata handling, and generated EOF noise. All four
    were fixed locally and covered by tests.
- Latest testing-roadmap state, 2026-06-21T13:12Z:
  - PR #2806 critical route-shell guards merged into `origin/main` as
    `745130a19785fdc844410a2798ba63a6db8256e8`.
  - Current clean worktree branch is `codex/testing-e2e-surface-matrix`, rebased
    onto that post-#2806 `origin/main`.
  - PR #2805 still needs a force-push from local HEAD because GitHub currently
    has stale head `9c9c82b771cfe01b34c7e468ca251dab7a359b4a` and reports it
    conflicting. Local rebased HEAD includes the surface-matrix stack plus the
    merged critical-shell pack.
  - Rebased PR #2805 preserves the merged `test:e2e:critical-shell` script and
    scopes it to `--project=web-desktop-chromium`, so the added Playwright
    project matrix does not unexpectedly multiply the critical-shell job.
  - Rebased local validation passed: changed format/lint/typecheck,
    Playwright typecheck, deployment-bus Jest tests, critical-shell,
    surface-matrix, WCAG/i18n surface, browser-diversity, native-sim,
    workflow-security scan, changed-secret scan, production build after clearing
    stale ignored `.next` cache, and `codex-diff-check`.
  - GLM reviewbot is live in `.github/6529bot.yml`; frontend contract tests
    assert it is additive while preserving the five mandatory existing lanes:
    `general`, `wcag`, `i18n`, `security`, and `responsiveness`.
  - Next incomplete roadmap slices after PR #2805 deploy are PR7
    canary/watch/reporting, API-backed read-only E2E, authenticated read-only
    E2E, profile/page-cluster E2E, real native/Electron smoke, native runtime
    centralization, and upload/posting/admin guard packs.
- 2026-06-20 user direction: update the plan for the actual frontend WCAG/i18n
  mega run now that reviewbot is live. Reviewbot is an additional reviewer and
  regression detector only; it does not replace extensive local validation.
- 2026-06-20 user direction: each page or page-cluster PR needs an explicit
  functionality, UX, safety, web, Mobile/Capacitor, and Electron/Desktop Shell
  impact assessment plus a local testing strategy before opening the PR. Use
  `mega-run-pr-playbook.md`.
- 2026-06-20 user direction: pause to design a world-class testing improvement
  sidequest before scaling agentic page-cluster work. Use
  `testing-improvement-plan.md`; reviewbot is still only a second reviewer.
- Current mission changed on 2026-06-19: autonomously carry the combined
  accessibility, i18n, and reviewbot plan from PR #2788 through implementation
  trains, staging, production, and validation, using subagents when useful.
- PR #2788 is already merged into `main`:
  - PR: https://github.com/6529-Collections/6529seize-frontend/pull/2788
  - head: `127ae232ce047781ec5b4e79831f9749808f14a3`
  - merge commit: `9bc89b3b4b9f8f17e9ccb7a216aec1320a131b9f`
  - merged at: `2026-06-19T21:44:39Z`
- User explicitly authorized autonomous merge/deploy work through production,
  without permission prompts, and specifically asked to merge/deploy
  `6529reviewbot` changes first so review bots can review later PRs.
- Deployment authority: `ops/skills/deploy-6529/SKILL.md`. This file was
  absent in this local dirty branch, but exists on `origin/main`; reload with:
  `git show origin/main:ops/skills/deploy-6529/SKILL.md`.
- Local branch at mission start: `codex/polish-boosted-link-cards`, local HEAD
  `6c048340a`, with many dirty changes across tests, app, components, docs,
  skills, and workstream files. Preserve unrelated user/agent changes.
- Use local Windows wrappers: prefer `seize` for frontend package commands in
  this Codex shell, and `seize-local-dev` for local env/port setup.
- Historical reviewbot and PR #2788 investigations are complete; reviewbot and
  frontend config are live.
- User clarification: the core deliverable is to decide and implement the
  i18n and WCAG review bots in `6529reviewbot` so they automatically run on
  `6529seize-frontend` PRs. Do not treat arbitrary unrelated open reviewbot PRs
  as the prerequisite.
- For future `6529seize-frontend` patches, base work on current merged GitHub
  `origin/main` in a clean worktree, not this dirty local branch.

## Current Goal

The 2026-06-19 reviewbot/config deployment train is complete in production.
Current planning goal is the testing sidequest for the frontend WCAG/i18n mega
run: repair and harden local, CI, Playwright, WCAG, i18n, security-sensitive,
surface-matrix, staging, and production validation before scaling page-cluster
work.

The testing sidequest now has a coherent strategy document:
`testing-improvement-plan.md` is titled `Frontend Testing And Release Strategy`.
It integrates the safety-case model, 6529.io web-app speed lanes, Google-style
`@small`/`@medium`/`@large` test sizing, CI execution ladder, release reports,
auto-hold/canary direction, artifact storage, reviewbot/GLM swarm, and PRR-lite
for Level 4-5 work.

Opus 4.8 second review on 2026-06-20 identified four foundation controls that
must be executable before scaling page-cluster remediation: deterministic
risk-floor classifier (`testing-improvement-plan.md` section
`PR 0: Executable Safety Controls And Manifest Schema`), staging/production
request-interception mutation guard (`PR 1: Test Harness Repair And Test
Sizing`), artifact redaction pipeline with fake-secret regression test (`PR 1:
Test Harness Repair And Test Sizing`), and explicit Level 3+ blocking or
temporary manual-validation exception until Playwright harness plus deployment
evidence gates are green (`Safety Case And Validation Manifest`).

GPT 5.5 Pro feedback on 2026-06-20 added an important calibration: keep the
immediate strategy focused on testing, but treat Codex/reviewbot/swarms as
high-recall hypothesis generators. Their default role is to feed Codex another
iteration, not take decision authority away from the agent. Hard promotion
blocks should be rare and reserved for deterministic, reproducible
disaster-class invariant violations or missing required safety evidence for a
train. Codex plus review bots should be allowed to cycle until they stop adding
useful findings or safe patches; safe auto-merge can start with narrow classes
once deterministic gates pass.

Future self-organizing queue work is parked in
`continuous-swarm-engine-notes.md`. Do not expand the immediate testing
sidequest into a queue/worker/CCR implementation unless explicitly asked.

Apply the strategy as a web-app speed model, not Bitcoin-Core-style release
gravity. Use fast lanes for low-risk docs/tests/copy/style changes, standard
lanes for page/workflow changes, guarded lanes for auth, wallet, upload,
posting, admin, generated API, shared data fetching, and deploy-sensitive
changes, and release-captain lanes for production-risk, irreversible-data,
credentials, signing/funds, identity, or deploy-control changes.

Every non-trivial PR needs risk level, hazard analysis, validation manifest,
traceable test/review/deploy evidence, and stop-the-line handling. Durable
validation artifacts must live on 6529-controlled infrastructure such as private
S3, pinned IPFS, or a future artifact service. Do not use Git LFS or committed
generated artifacts as the durable evidence store.

## Current Branch

`codex/testing-e2e-surface-matrix`

## Constraints

- Preserve unrelated dirty files:
  - `__tests__/components/nft-image/RememeImage.test.tsx`
  - `contexts/EmojiContext.tsx`
  - `__tests__/contexts/EmojiContext.test.tsx`
  - `styles/seize-bootstrap.scss`
- Use `6529` wrapper commands for project checks.
- Use signed commits with the configured Git identity.
- Merge only the standards PR when bot-happy and branch protection allows.
- Page implementation PRs may now be merged only as part of the mega run after
  they are reconciled with current `origin/main`, locally validated,
  reviewbot-happy, and assigned to a deployment train.
- Level 3+ implementation PRs require independent verifier signoff before
  merge; Level 4+ trains require a named release captain and post-deploy watch.
- No PR joins a deployment train without a validation manifest and durable
  artifact pointers for required retained evidence.
- Foundation work should start with the strategy's PR 0 and PR 1: manifest and
  artifact schema, then Playwright harness repair plus test-size taxonomy.
- PR 0 now means executable safety controls and manifest schema: risk-floor
  classifier, risk downgrade approval fields, redaction contract, mutation-guard
  contract, artifact schema validation, mutation endpoint registry, and
  stop-the-line states.
- PR 1 now means Playwright harness repair plus request-interception mutation
  guard, artifact redaction hook, fake-secret redaction regression test, and
  test-size taxonomy.
- Level 3+ page-cluster work is blocked until PR 1 and PR 5 gates are green,
  unless a release captain records a temporary manual-validation exception.
- Level 0-1 fast-lane PRs should use minimal manifests and avoid full train
  ceremony unless they affect runtime/deploy/high-risk surfaces.

## Historical Stack Snapshot

The PR statuses below are historical context from the pre-reviewbot rollout.
Re-audit each PR against current `origin/main` before merging or deploying it.

- WCAG target: WCAG 2.2 AA.
- Source locale: `en-US`.
- Initial supported locales: `en-US`, `en-GB`, `fr-FR`, `es-ES`, `de-DE`.
- PR #2623 is bot-happy on the latest head and remains review-ready only.
- PR #2624 is open and review-ready only after the CodeRabbit video-fallback
  fix; keep it unmerged.
- PR #2625 is bot-happy on the latest head and remains review-ready only.
- PR #2626 is bot-happy on the latest head and remains review-ready only.
- PR #2627 remains review-ready only with a bot-happy latest head.
- PR #2628 is bot-happy on the latest head and remains review-ready only.
- PR #2629 is bot-happy on the latest head and remains review-ready only.
- PR #2630 is bot-happy on the latest head and remains review-ready only.
- PR #2631 is bot-happy on the latest head and remains review-ready only.
- PR #2633 is bot-happy on the latest head and remains review-ready only.
- PR #2634 is bot-happy on the latest head and remains review-ready only.
- PR #2635 is bot-happy on the latest head and remains review-ready only.
- PR #2636 is bot-happy on the latest head and remains review-ready only.
- PR #2637 is bot-happy on the latest head and remains review-ready only.
- PR #2638 is bot-happy on the latest head and remains review-ready only.
- PR #2639 is bot-happy on the latest head and remains review-ready only.
- PR #2640 is bot-happy on the latest head and remains review-ready only. It
  covers profile shell tab titles, beta badge text, navigation landmark labels,
  scroll button labels, and active-page semantics. It is stacked from PR #2639
  and must not be merged.
- PR #2641 is bot-happy on the latest head and remains review-ready only. It
  covers the profile followers modal title, follower list label, loading
  status, nullable follower handle fallback, follower profile link names,
  avatar alt text, and semantic list structure. It is stacked from PR #2640 and
  must not be merged.
- PR #2642 is bot-happy on the latest head and remains review-ready only. It
  covers the user profile header stats row labels, accessible names, and
  follower-count formatting. It is stacked from PR #2641 and must not be
  merged.
- PR #2643 is bot-happy on the latest head and remains review-ready only. It
  covers the user profile header identity/name/media labels, profile-enabled
  date formatting, and read-only wrapper semantics. It is stacked from PR #2642
  and must not be merged.
- PR #2644 is bot-happy on the latest head and remains review-ready only. It
  covers the user profile header About statement placeholder, add/edit controls,
  mobile expand/collapse toggle, and nested-interactive-control cleanup. It is
  stacked from PR #2643 and must not be merged.
- PR #2645 is open and review-ready only. It covers the user profile About edit
  form labels, placeholder, character count, actions, success toast, moderation
  errors, alert semantics, and error-dismiss name. It is stacked from PR #2644
  and must not be merged.
- Non-source locales currently fall back to `en-US` until reviewed
  translations are added.
- Full locale-prefixed routing is deferred.
- 2026-06-13 stack audit: PR #2604 and PRs #2607-#2645 are open, non-draft,
  mergeable, and green on the visible GitHub check rollup.
- Related-looking open PR #2597 is older OG metadata work, not part of this
  WCAG/i18n stack.
- Open PR #2632 is separate 6529bot admin dashboard work, not part of this
  WCAG/i18n stack.
- 2026-06-14 bottom-stack pass: PR #2604 received a passive scroll listener
  hardening commit (`23d119e`) and local validation/browser smoke passed.
  GitHub's visible latest-head rollup is green and a validation snapshot was
  posted on the PR. CodeRabbit's new incremental review was rate-limited, but
  prior actionable CodeRabbit findings are already fixed in the current code.
- 2026-06-14 audit inventory: `audit-inventory.md` records candidate hotspots
  for static copy, interaction semantics, locale formatting, image alt review,
  and i18n helper adoption.

## Next Actions

1. Commit, push, and open the `codex/e2e-waves-profile` PR with the validation
   evidence listed above.
2. Iterate CodeRabbit, Sonar, CI, Opus reviewbot, and GLM reviewbot feedback on
   the Waves/Profile E2E PR until Codex judges the loop is no longer adding
   material value.
3. Merge the Waves/Profile E2E PR after checks and review signals are green or
   consciously dispositioned, then deploy it through staging and production with
   `ops/skills/deploy-6529/SKILL.md`.
4. Record the PR #2808 production post-deploy watch checkpoint only after the
   real 30-minute observation window and deployed-environment validation pass.
   Leave the release report on hold if approved durable artifact storage is not
   wired.
5. Start the next E2E packs in focused PRs: media/mint/detail, delegation,
   NextGen/groups/tools, then broad network/open-data/static route matrices.
6. Reconcile the existing page-cluster PR stack from current `origin/main`
   before opening broad new implementation PRs.
7. For every implementation PR, complete the `mega-run-pr-playbook.md` pre-PR
   impact/testing plan, assign a risk level, write hazard analysis, create the
   validation manifest, and select durable artifact storage before opening the
   PR.
8. Run extensive local validation first; treat the live `wcag`, `i18n`,
   `security`, `responsiveness`, and `glm-swarm` reviewbot lanes as additional
   review, not a local-test substitute.
9. Preserve unrelated dirty EmojiContext, RememeImage test, and bootstrap style
   files in other worktrees.
