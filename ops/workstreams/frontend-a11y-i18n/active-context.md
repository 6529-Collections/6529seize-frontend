# Active Context

## Resume First

Read this section first after compaction or handoff.

- Latest testing-roadmap state, 2026-06-23T11:28Z:
  - Current active worktree:
    `D:\repos\6529seize-frontend-wallet-signing-sandbox`.
  - Current active branch:
    `codex/e2e-wallet-signing-sandbox`, rebased onto current `origin/main`
    `b5ec8a62805f261fa4f8c10bc5c30f1114412227` after PR #2852 merged.
  - PR #2853 is the active merge target:
    https://github.com/6529-Collections/6529seize-frontend/pull/2853
  - Active slice is test-only signed-drop sandbox hardening. It adds a
    deterministic signature-required Rank-wave fixture, local-only
    `test:e2e:signature-sandbox`, inclusion in `test:e2e:auth-sandbox`, and a
    negative assertion window proving no late unsigned `/api/drops` POST is
    recorded when no wallet signature is available.
  - Current local validation passed on the rebased head:
    `node --check` for the sandbox server, package JSON parse,
    `seize run lint:package-json`, focused ESLint on actual changed JS/TS
    files, `seize run typecheck:playwright`, `seize run typecheck:changed`,
    `codex-diff-check`, `test:e2e:signature-sandbox`, `test:e2e:reaction-sandbox`,
    `test:e2e:auth-sandbox`, `test:e2e:composer-sandbox`, the focused signing
    Jest batch, risk floor, changed-secret scan, and workflow-security scan.
  - Local `seize run lint:changed` overflows the Windows command line because
    it compares against stale local `main`; use the focused ESLint evidence
    against `origin/main...HEAD` for this PR.
  - Next action: force-with-lease push PR #2853, trigger CodeRabbit plus all
    existing 6529bot lanes including `general`, `wcag`, `i18n`, `security`,
    `responsiveness`, and `glm-swarm`, then merge when CI and material bot
    feedback are clear.

- Latest testing-roadmap state, 2026-06-23T09:38Z:
  - Current rebase worktree:
    `D:\repos\6529seize-frontend-native-package-evidence`.
  - Current active branch:
    `codex/native-package-evidence-e2e`, PR #2851, rebased onto current
    `origin/main` `daeac04bcb701786b5429a54ec832c0a24b42fd2` after PR #2850
    and PR #2854 merged.
  - Active slice is test-only native surface evidence classification:
    add a read-only `native-surface-evidence.cjs` classifier, optional
    deployment-bus pack `native:surface-evidence`, package scripts, tests, and
    docs that distinguish browser simulation, package prerequisites, and real
    packaged native/Electron runtime evidence.
  - Rebase conflict was in `ops/scripts/deployment-bus.cjs`, where PR #2854
    added `deployment:http-version` durable upload evidence and PR #2851 adds
    `native:surface-evidence`; both validation packs are preserved.
  - Latest CodeRabbit test feedback on
    `__tests__/scripts/native-surface-evidence.test.ts` is fixed in head
    `4151a1bb8`.
  - Latest rebased validation passed:
    - `node --check ops/scripts/native-surface-evidence.cjs`
    - `node --check ops/scripts/deployment-bus.cjs`
    - `seize run test:no-coverage -- __tests__/scripts/native-surface-evidence.test.ts __tests__/scripts/deployment-bus.test.ts`:
      60 passed.
    - `seize run test:native-evidence`
    - `seize run test:e2e:native-shell-readonly`: 11 passed, 13 skipped.
    - `seize run typecheck:playwright`
    - `seize run typecheck:changed`: 39 changed TypeScript files passed.
    - focused ESLint on native evidence, deployment bus, surface simulation,
      and native-shell spec files.
    - `seize run lint:package-json`
    - risk floor Level 4, changed-secret scan clean, workflow-security scan
      clean, and `codex-diff-check`.
  - Next action: commit this memory update, force-push PR #2851, trigger all
    reviewbot lanes including GLM-swarm, then merge after checks and material
    bot feedback are clear.

- Latest testing-roadmap state, 2026-06-23T05:00Z:
  - Current active worktree:
    `D:\repos\6529seize-frontend-admin-guards`.
  - Current active branch:
    `codex/e2e-admin-destructive-guards`, based on current `origin/main`
    `d0bf12f52`.
  - Active slice is test-only admin/destructive fail-closed E2E hardening:
    add `tests/admin/admin-destructive-guards-readonly.spec.ts`, wire
    `test:e2e:admin-guards-readonly`, add staging/production variants, and add
    the pack to `test:e2e:production:readonly`.
  - Scope is deliberately read-only and unauthenticated: NextGen manager must
    show a disconnected or non-admin permission boundary and no admin action
    buttons; Drop Forge landing, craft, and launch routes must show permission
    fallback and no claim/action controls; public Groups must wait for the
    groups API/card render and hide owner, edit/delete, and Rep/NIC bulk voting
    controls without a connected profile.
  - Validation target before PR: run the new local pack across desktop/mobile,
    Playwright typecheck, package-json lint, changed lint/typecheck, risk and
    secret/workflow scans where applicable, and `codex-diff-check`; then trigger
    existing 6529bot lanes plus GLM swarm on the PR without removing any
    existing reviewbot lane.
  - Current validation evidence:
    - `seize run test:e2e:admin-guards-readonly`: 6/6 passed locally across
      desktop and mobile. Latest follow-up rerun after GLM feedback also passed
      6/6.
    - `seize run test:e2e:staging:admin-guards-readonly` with local Credential
      Manager target `STAGING_AUTH`: 6/6 passed across desktop and mobile.
      Latest follow-up rerun also passed 6/6 after loading the target only into
      the child process; no credential value was printed or persisted.
    - `seize run test:e2e:production:admin-guards-readonly`: 3/3 passed on
      production desktop. Latest rebased rerun also passed 3/3.
    - `seize run test:e2e:production:readonly`: 68/68 passed on production
      desktop with the new admin pack included. Latest follow-up rerun also
      passed 68/68.
    - `seize run typecheck:playwright`, `seize run lint:package-json`,
      targeted ESLint, `seize run typecheck:changed`, `seize run lint:changed`,
      risk floor, secret scan, workflow-security validation, and
      `codex-diff-check` passed before PR publication and after latest-head GLM
      follow-up edits. Risk floor is Level 4 because `package.json`
      release-validation scripts changed.
  - Latest bot loop:
    - Reviewbot PR #411 fixed GLM-swarm empty internal reviewer handling and was
      merged into `6529reviewbot` main.
    - Latest PR #2855 GLM-swarm review succeeded with one degraded internal
      reviewer slice and produced actionable helper/docs feedback, now fixed.
    - PR #2855 was rebased cleanly onto `origin/main` `d0bf12f52`; focused
      local, staging, and production admin guard validation passed again before
      force-push.

- Latest testing-roadmap state, 2026-06-22T21:07Z:
  - Current active branch:
    `codex/e2e-wallet-signing-sandbox`, based on current `origin/main`
    `fe4af27e7 Add native shell read-only E2E coverage`.
  - Active slice is local-only wallet/signing sandbox hardening. It must not
    add a signing backdoor to app code. The intended coverage is a deterministic
    non-chat Rank wave with `participation.signature_required` and terms that
    drives the real Submit drop modal plus terms dialog, then proves an unsigned
    `/api/drops` POST is not attempted when no wallet signature is available.
  - Existing open reviewbot PRs remain intact: #2850, #2851, and #2852 are
    watched for CI/reviewbot state but must not be overwritten from this
    worktree.
  - PR #2847 is merged and deployed. Production serves
    `0c55e0c628541fb2ac695d87f871568848e7c057`.
  - PR #2847 shipped test-only production-readonly hardening:
    `gotoDocumentWithTransientRetry` retries one explicit 502/503/504 document
    response, production-readonly packs share that helper, ReMemes browse uses
    API-readiness plus breakpoint-aware collection identity checks, ReMemes
    detail accepts the current live title contract, the mutation guard aborts
    only exact `csp.withgoogle.com/csp/script-inclusions/<32-hex>` reports, and
    unit tests now cover route readiness plus Google CSP report boundaries.
  - PR review/CI state before merge:
    - required PR CI passed: CodeQL, DCO, Installed app checks, Plan risk and
      security checks, SonarCloud, Snyk, and CodeRabbit status.
    - 6529bot final-head Opus lanes were clean: general Good to merge, WCAG no
      findings, i18n no findings, security no findings.
    - 6529bot responsiveness rerun passed on final head across web desktop,
      web mobile, native simulation, and Electron simulation.
    - GLM swarm found useful feedback on the previous head and it was fixed in
      the final head. Two final-head GLM reruns failed inside the reviewbot
      worker with the same empty-output error before producing review text; this
      was recorded as bot-infra noise, not an unresolved frontend finding.
  - Staging deployment passed:
    - `1a-staging` deploy SHA:
      `0fdc39ecddebc8f6730da82ff9838284924e9492`
    - workflow:
      https://github.com/6529-Collections/6529seize-frontend/actions/runs/27976114194
    - local staging `/api/version` matched the staging deploy SHA.
    - `seize run test:e2e:staging`: 24 passed / 6 skipped.
    - broad staging read-only aggregate: 127 passed / 2 skipped / 1 transient
      mobile NextGen staging API network miss; the exact failed case passed on
      focused rerun.
  - Production deployment passed:
    - workflow:
      https://github.com/6529-Collections/6529seize-frontend/actions/runs/27977449591
    - local production `/api/version` matched
      `0c55e0c628541fb2ac695d87f871568848e7c057`.
    - `seize run test:e2e:production:readonly`: 65/65 passed.
  - Release notes posted:
    - 6529 Releases drop #1123251:
      https://6529.io/waves/05b14183-e153-4e47-bc66-42a0f49102d4?drop=62b11757-72d5-4cbe-83b2-95a550710648
    - Follow The Repo drop #1123253:
      https://6529.io/waves/49f0e595-ec7c-4235-8695-a527f61b69f4?drop=d18e6cc7-eb53-473c-a94c-d1edcb4be808
  - Current active branch:
    `codex/e2e-native-shell-readonly`, based on current `origin/main`
    `0c55e0c628541fb2ac695d87f871568848e7c057`.
  - Active slice is test-only native/Electron simulated shell hardening:
    Capacitor simulation exposes both package and global runtime signals,
    Open Data native subscription visibility gets iOS hide, iOS US-visible, and
    Android visible coverage,
    Capacitor app-wallet empty-state behavior and Electron app-wallet
    unsupported behavior are checked separately, and the Electron share modal is
    checked for desktop handoff suppression. This is simulation evidence only;
    it must not be claimed as real packaged native or Electron verification.
  - PR #2848 is open:
    https://github.com/6529-Collections/6529seize-frontend/pull/2848
    - 6529bot Opus lanes on head `28b3866587b6` were clean: general Good to
      merge, WCAG no findings, i18n no findings, security no findings, and
      responsiveness passed on final-head rerun.
    - GLM swarm on head `28b3866587b6` found useful advisory feedback. Valid
      items were fixed locally: `test:e2e:native-sim` now uses an explicit
      native-surface allowlist, iOS US and Android subscription checks assert
      visibility before href, the country-check listener documents its
      pre-navigation usage, the Capacitor `convertFileSrc` passthrough is
      documented and currently has no app callers, `HeaderShare.test.tsx`
      documents the JSDOM origin assumption, and the Electron app-wallet case
      asserts the actual Capacitor web runtime plus Electron user-agent signal.
    - Independent local subagent reviewer found no P0/P1/P2 blockers and
      recommended future iOS US-visible coverage. That coverage is now added.
    - Review-response follow-up also gives country-check waits a clearer
      timeout failure message.
    - CodeRabbit status on head `28b3866587b6` was green; its docstring
      coverage note was non-blocking for this test/docs slice.
  - The slice also repairs two existing relevant unit-test harness breaks so
    share and app-wallet connector coverage runs again: `HeaderShare.test.tsx`
    no longer redefines JSDOM `window.location`, and
    `wagmiAppWalletConnector.test.ts` uses hoist-safe viem mocks.
  - Local validation passed for this active slice:
    - `seize run typecheck:playwright`
    - `seize run test:e2e:native-shell-readonly`: latest 9 passed / 12
      skipped.
    - `seize run test:e2e:native-sim`: initial run hit a transient iOS
      simulation mobile-search miss; focused rerun of the failed case passed,
      and the latest full rerun passed 25 passed / 23 skipped.
    - `seize run test:e2e:surface-matrix`: latest 24 passed / 20 skipped.
    - targeted share/wallet/Capacitor/AppKit Jest batch: 60 passed before the
      GLM follow-up; targeted share/wallet rerun after the GLM follow-up passed
      57 tests across 2 suites.
    - `seize run lint:changed`, `seize run typecheck:changed`,
      risk floor Level 4, changed-secret scan clean, workflow-security scan
      clean, and `codex-diff-check`.
  - GLM reviewbot remains live and additive. Do not remove, downgrade, or make
    optional any existing reviewbot lanes.
- Latest testing-roadmap state, 2026-06-22T15:20Z:
  - PR #2844 is merged and deployed. Current production is serving
    `d26393b40d2fec0e9a2bf557f911324b27bc7686`.
  - Staging deploy for #2844 used branch `1a-staging` SHA
    `a803ae9d61e396112153418fb8b03f4a11cce562`; staging version verification,
    smoke, surface matrix, and WCAG/i18n validation passed before production.
  - Production deploy run #27956752856 succeeded from exact merge SHA
    `d26393b40d2fec0e9a2bf557f911324b27bc7686`; local production
    `/api/version` matched and `seize run test:e2e:production:readonly`
    passed 65/65.
  - Current branch:
    `codex/e2e-wave-create-sandbox`, based on current `origin/main`
    `d26393b40d2fec0e9a2bf557f911324b27bc7686`.
  - Active slice adds positive local-only authenticated sandbox E2E coverage
    for `/waves/create` Chat-wave creation. It extends the existing mock API
    runner and mutation auditor so create-wave may only create the exact
    synthetic "Only playwright" admin group, publish that group, and create the
    exact synthetic Chat wave body before routing to the deterministic created
    wave detail page.
  - Local validation passed for this active slice:
    - `node --check tests/support/composerSandboxServer.cjs`
    - focused ESLint on changed sandbox support/spec files
    - `seize exec prettier --check ...` for changed docs/spec/support/package
      files
    - `seize run typecheck:playwright`
    - `seize run typecheck:changed`
    - `seize run lint:changed`
    - focused `tests/social/create-wave-sandbox.spec.ts`: 1 passed
    - `seize run test:e2e:auth-sandbox`: 5 passed
    - `seize run test:e2e:composer-sandbox`: 4 passed across desktop and
      mobile Chromium
    - `seize run testing-strategy -- compute-risk-floor --changed-from origin/main --json`:
      Level 4
    - changed-secret scan and workflow-security scan passed
    - `codex-diff-check`
  - Independent verifier `Hubble` initially found that the create-wave
    mutation validators checked expected values but still allowed arbitrary
    extra nested fields. Fixed by adding recursive exact-key checks for the
    synthetic admin group and wave body, then Hubble re-reviewed and found no
    remaining publication blockers.
  - Next action: commit/push/open PR and iterate CI plus all reviewbot lanes.
  - GLM reviewbot remains live and additive. Do not remove, downgrade, or make
    optional any existing reviewbot lanes.
- Latest testing-roadmap state, 2026-06-22T12:15Z:
  - PR #2838 is merged and deployed. Current production is serving
    `a07a205a35282ef1d9697549ee9a167369b465c3`.
  - Staging validation for current main passed before production:
    version verifier matched staging SHA
    `64bc9e277a125c7f38ea37cd11fb92957a42a31b`,
    `test:e2e:staging:smoke` 12 passed,
    `test:e2e:staging` 24 passed / 6 skipped, and
    staging WCAG/i18n surface matrix 6 passed.
  - Production deploy run #27949660165 succeeded from exact
    `origin/main` SHA `a07a205a35282ef1d9697549ee9a167369b465c3`.
    Local production `/api/version` matched that SHA, and
    `seize run test:e2e:production:readonly` passed 65/65.
  - Current branch:
    `codex/auth-sandbox-e2e`, based on current `origin/main`
    `a07a205a35282ef1d9697549ee9a167369b465c3`.
  - Active slice adds positive local-only authenticated sandbox E2E coverage
    for `/notifications` and `/messages/create`, while preserving the existing
    composer/upload/link-preview sandbox. It reuses the local mock API/dev-auth
    runner, refuses non-loopback base URLs, explicitly binds Next dev to a
    loopback hostname, audits request logs so only exact sandbox IDs/bodies are
    allowed for local mock API mutations on queryless paths, blocks oversized
    mutation bodies as unsafe audit entries, and blocks unexpected same-origin
    Next.js API writes or unknown unsafe external browser writes in the browser.
    Known wallet and analytics SDK background writes are blocked in-browser but
    do not fail the sandbox pack.
  - Local validation passed for this active slice:
    - `node --check tests/support/composerSandboxServer.cjs`
    - focused ESLint on changed sandbox support/spec files
    - `seize exec prettier --check ...` for changed docs/spec/support files
    - `seize run typecheck:changed`
    - `seize run test:e2e:auth-sandbox`: 4 passed
    - `seize run test:e2e:composer-sandbox`: 4 passed across desktop and mobile
      Chromium
    - `codex-diff-check`
  - Independent verifier `Parfit` found that the first draft still bound Next
    dev too broadly and classified allowed mutations by path only. Those
    findings were fixed before PR publication.
  - Independent verifier `Volta` found one more pre-publication hardening pass:
    unknown external browser writes needed blocking, oversized mock mutation
    bodies needed unsafe audit evidence, and allowed mock mutations needed empty
    query strings. Those findings were fixed before PR publication.
  - Local `seize run lint:changed` is not a useful signal in this worktree
    because local branch `main` is stale (`7693d1138`) while this branch is
    based on `origin/main` (`a07a205a3`), causing the script's Windows command
    line to exceed the shell limit. Focused ESLint on the actual PR files is
    clean.
  - Next action: commit, push, open PR, trigger/iterate all reviewbot lanes
    including GLM, then merge/deploy if CI and bots stop adding material value.
- Previous testing-roadmap state, 2026-06-22T08:32Z:
  - PR #2823 is merged and deployed. Production is serving
    `02382bc81f1d945083b28bf78641ab2469e2212e`.
  - Staging deploy run:
    https://github.com/6529-Collections/6529seize-frontend/actions/runs/27943628946
    - staging SHA: `43d6f711a7f3856c62b5544736d001319f285bef`
    - workflow HTTP version evidence matched the staging SHA.
    - local staging validation passed:
      `test:e2e:staging:smoke` 12 passed,
      `test:e2e:staging` 24 passed / 6 skipped,
      `test:e2e:wcag-i18n:surface-matrix` 6 passed.
  - Production deploy run:
    https://github.com/6529-Collections/6529seize-frontend/actions/runs/27944602623
    - workflow HTTP version evidence matched the production SHA.
    - local production `/api/version` probe matched the production SHA.
  - Current branch:
    `codex/e2e-production-readonly-hardening`, based on current `origin/main`.
  - Active follow-up fixes the production-readonly aggregate after live
    validation found a real test-harness gap:
    - current production mint card can render dynamic interactive art inside an
      iframe, while the test only accepted direct `img[id^="image-"]` media.
    - the read-only mutation guard blocked safe read-only Ethereum JSON-RPC
      POSTs to known public RPC hosts used by the mint page.
    - the app was not rolled back: production app runtime is healthy and this
      branch changes test harness behavior only.
  - Validation passed for this follow-up:
    - `seize run test:no-coverage -- __tests__/playwright/readonlyMutationGuard.test.ts`
    - focused ESLint on the changed E2E/guard files
    - failing production mint test rerun: 1 passed
    - full `seize run test:e2e:production:readonly`: 65 passed
    - `seize run lint:changed`
    - `seize run typecheck:changed`
    - `codex-diff-check`
    - clean risk floor: Level 3
    - changed secret scan passed.
  - Next action: commit, open PR, iterate all reviewbot lanes including the
    now-live GLM reviewer, then merge/deploy if CI and bots add no further
    value.
- Previous testing-roadmap state, 2026-06-22T08:32Z:
  - PR #2822 is merged and deployed. Production is serving
    `7693d1138987175e0ccd6c54841d7547d99ce322`, and the full production-safe
    read-only aggregate passed again: `seize run test:e2e:production:readonly`
    reported 65/65 passed.
  - Current branch: `codex/deployment-evidence-verification`, based on current
    `origin/main`.
  - Active slice closes a deployment evidence gap:
    - adds `ops/scripts/verify-deployment-version.cjs` and
      `seize run verify:deployment-version` to GET `/api/version`, require
      HTTP 200, `Cache-Control: no-store`, and exact expected SHA match, with
      bounded retry and redacted `deployment-version-evidence.json` output.
    - wires staging and production workflows to run the HTTP version check
      before marking deploys verified and upload the evidence JSON beside the
      deployment-bus manifest/report.
    - records an `http-version-match` post-deploy-watch checkpoint when the
      workflow probe passes.
    - adds optional deployment-bus pack `playwright:production-readonly` for
      the existing production aggregate. It is production-only,
      desktop-Chromium only, and intentionally not in `DEFAULT_REQUIRED_PACKS`
      until durable artifact upload/recording is automated.
    - rejects known standard packs when required in an unsupported environment,
      so `playwright:production-readonly` cannot silently become a null-command
      staging requirement.
  - Validation passed for this slice:
    `node --check ops/scripts/verify-deployment-version.cjs`; focused ESLint on
    deployment-bus/verifier files; `seize run test:no-coverage --
__tests__/scripts/verify-deployment-version.test.ts
__tests__/scripts/deployment-bus.test.ts
__tests__/app/api/version/route.test.ts
__tests__/hooks/useVersion.test.tsx` (51 tests); `lint:changed`;
    `typecheck:changed`; risk-floor computed Level 5; changed secret scan;
    workflow-security scan; live production version probe; live staging version
    probe; `codex-diff-check`; and production aggregate E2E 65/65.
  - Reviewer subagent `Kepler` is inspecting the final uncommitted diff. Wait
    for it before committing/publishing.
  - GLM reviewbot is live and remains additive. Do not remove, downgrade, or
    replace existing Opus/general/WCAG/i18n/security/responsiveness reviewbot
    lanes.
- Latest testing-roadmap state, 2026-06-22T05:45Z:
  - PR #2819 is merged into `origin/main` as
    `174b2d054 Add search and wave read-only E2E coverage (#2819)`.
  - Current branch: `codex/e2e-composer-sandbox`, based on that current
    `origin/main`.
  - PR #2820 is open:
    https://github.com/6529-Collections/6529seize-frontend/pull/2820
  - Active slice adds local-only authenticated composer/upload/link-preview
    sandbox coverage. It starts a per-run mock API, runs Next against that mock
    runtime, uses generated synthetic dev-auth data only, and verifies file
    preview/removal plus deterministic link preview rendering on desktop and
    mobile Chromium.
  - The mock diagnostics record requests and fail the pack on dangerous
    composer/upload mutation endpoints (`/api/drops`, `/api/drop-media`,
    `/api/attachments`) and any other unhandled local mutation, while allowing
    known local notification wave-read side effects as separate diagnostics.
    The spec also refuses non-loopback Playwright base URLs so inherited shell
    env cannot point the pack at staging or production.
  - Local validation passed: `test:e2e:composer-sandbox`, Playwright typecheck,
    changed lint/typecheck, `critical-shell`, changed secret scan,
    workflow-security scan, and `codex-diff-check`. `quality:changed` still
    fails locally at its aggregate format step in this Windows worktree, while
    the equivalent direct subchecks pass.
  - Next action is to iterate CI and all reviewbot lanes on PR #2820. Keep
    GLM additive alongside existing reviewbots.
  - GLM reviewbot is live on `6529reviewbot` and remains additive. Do not
    remove, downgrade, or make optional the existing Opus/general/WCAG/i18n/
    security/responsiveness reviewbot lanes.
- Latest testing-roadmap state, 2026-06-22T04:25Z:
  - PR #2818 merged into `origin/main` as
    `d2b1c2ba4d9908ff0f592eeeb7200c80c578920c`, adding the authenticated
    notifications mutation-guard contract without turning `/notifications`
    into staging or production smoke.
  - Current clean worktree branch:
    `codex/e2e-search-waves-readonly`, based on current `origin/main` after
    PR #2818.
  - Active slice adds a production-safe read-only pack for global header search
    keyboard/navigation behavior and wave-local message search behavior.
  - The pack has passed locally and on staging with desktop and mobile
    Chromium, and on production with desktop Chromium only.
  - Next action is PR publication and reviewbot/CI iteration.
  - Keep `/notifications` out of staging or production smoke until
    notifications have a disposable sandbox account/backend or a
    user-equivalent product-safe read-only test path.
  - GLM reviewbot is live on `6529reviewbot` and remains additive. Do not
    remove, downgrade, or make optional the existing Opus/general/WCAG/i18n/
    security/responsiveness reviewbot lanes.
- Latest testing-roadmap state, 2026-06-21T22:35Z:
  - Current clean worktree branch:
    `codex/e2e-authenticated-shells-readonly`, based on current `origin/main`.
  - Active slice adds a credential-free-by-default authenticated read-only E2E
    pack for `/messages`, `/{profile}/subscriptions`, and `/{profile}/proxy`.
  - The pack uses the existing dev-auth runtime path only when the caller
    provides `PLAYWRIGHT_READONLY=1`, `USE_DEV_AUTH=true`,
    `DEV_MODE_WALLET_ADDRESS`, and `DEV_MODE_AUTH_JWT`, plus
    `PLAYWRIGHT_DEV_AUTH_PROFILE_HANDLE`. It skips loudly otherwise and never
    commits or extracts local secrets.
  - Authenticated `/notifications` is not part of the read-only pack because
    live dev-auth validation with the mutation guard showed it auto-posts
    `POST /api/notifications/read` on mount. Treat this as a separate
    mutation-safety follow-up, not as an allowlist candidate.
  - The intended validation bar before PR publication is focused Jest coverage
    for the read-only guard, Playwright typecheck, changed lint/typecheck,
    skipped-pack proof without dev auth, critical-shell regression, changed
    secret scan, workflow security scan, and `codex-diff-check`. If secure
    dev-auth env is present, also run the pack against both baseline web
    projects.
  - Already-merged read-only E2E packs before this branch include Waves/Profile,
    media/mint/detail, delegation, Network/Open Data, collections, and public
    Groups/Tools. Preserve their scripts, ownership docs, and run-log evidence
    when rebasing this branch.
  - GLM reviewbot is live on `6529reviewbot` and must remain additive. Do not
    remove, downgrade, or make optional the existing Opus/general/WCAG/i18n/
    security/responsiveness reviewbot lanes.
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
  - Current implementation branch at that time: `codex/e2e-waves-profile`,
    based on production `origin/main`
    `1bdddd30c16c53e08601bf2bbfb67a267f517738`.
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

`codex/e2e-wallet-signing-sandbox`

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

1. Commit, push, and open the `codex/e2e-search-waves-readonly` PR with the
   focused search/wave E2E pack, Playwright typecheck, changed lint/typecheck,
   secret scan, workflow-security scan, critical-shell regression evidence,
   staging/production pack evidence, and `codex-diff-check`.
2. Iterate CodeRabbit, Sonar, CI, Opus reviewbot, GLM reviewbot, and any
   available specialized bots until Codex judges the loop is no longer adding
   material value. Keep all reviewbot lanes additive; do not remove existing
   bots.
3. Merge the search/wave read-only PR after checks and review signals are green
   or consciously dispositioned.
4. Record the PR #2809 production post-deploy watch checkpoint if the real
   30-minute observation window has elapsed and deployed-environment validation
   still passes. Leave release reports on hold if approved durable artifact
   storage is not wired.
5. Start the next E2E packs in focused PRs: composer/upload/link-preview
   sandbox coverage, wallet/native/Electron shell coverage, and deployment
   evidence/version verification.
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

## 2026-06-22 Current Autonomous Run

- User asked to continue autonomous manager mode and finish the not-completed
  and partially-completed testing roadmap items, with important E2E coverage
  across app areas.
- GLM reviewbot is live in `6529reviewbot`; keep it additive. Do not remove,
  downgrade, or replace existing reviewbots.
- PRs #2810 through #2817 are merged into `origin/main`, adding public
  read-only packs for social/profile, media/mint/detail, delegation,
  network/open-data, collections/NextGen, public groups/tools, public content,
  authenticated shell gates, and profile deep links.
- PR #2818 merged the authenticated notifications guard hardening slice.
- PR #2819 merged the global search and wave-local message search E2E slice
  into `origin/main` as `174b2d054 Add search and wave read-only E2E coverage
(#2819)`.
- PR #2820 (`codex/e2e-composer-sandbox`) merged into `origin/main` as
  `fa048794f72898c9604a7063e25192eaf2731c1c` and shipped to production in
  production workflow run #27934426448 after staging workflow run #27933627091
  and staging E2E passed.
- Production post-deploy read-only validation exposed testing debt, not a live
  app regression: `test:e2e:production:collections-readonly` expected the exact
  Gradient page title `6529 Gradient`, while production returns
  `6529 Gradient | Collections`.
- Current branch `codex/fix-production-collections-readonly` fixes that title
  assertion and adds aggregate `test:e2e:production:readonly` so release
  validation can run all production-safe read-only packs in one failing
  Playwright invocation.
- Deployment train policy remains: merge only after Codex, reviewbots, and CI
  stop adding material value; deploy staging first, validate exact merged SHA,
  then production from current `origin/main` with release evidence.

## Current Next Actions

1. PR #2851 (`codex/native-package-evidence-e2e`) merged into `origin/main` as
   `8c1ec66ea31d6ef952586b17716f0f43030c1ec2`.
2. PR #2852 (`codex/e2e-wallet-signing-guards`) merged into `origin/main` as
   `b5ec8a62805f261fa4f8c10bc5c30f1114412227`.
3. PR #2853 (`codex/e2e-wallet-signing-sandbox`) is rebased and locally
   validated on current main. Force-with-lease push, re-trigger CodeRabbit and
   all existing 6529bot lanes including GLM-swarm/responsiveness on the exact
   pushed head, then merge after CI and material review feedback are clear.
4. Deploy merged testing-roadmap slices through staging first, validate exact
   staged SHA, then production from current `origin/main` with exact-SHA
   validation and production-safe E2E evidence.
5. Keep durable artifact storage as an infra follow-up; do not fake S3/IPFS
   artifact pointers or weaken release holds.
