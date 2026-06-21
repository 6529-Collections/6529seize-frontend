# Playwright Test Conventions

This directory contains browser tests for 6529.io.

Test size tags:

- `@small`: single-process unit or helper tests. These normally live under
  `__tests__/`.
- `@medium`: local browser tests against localhost or local services.
- `@large`: deployed-environment tests against staging, production, or a real
  external service.

The same Playwright spec can be `@medium` locally and `@large` when
`PLAYWRIGHT_BASE_URL` targets staging or production. Use
`resolvePlaywrightTestSize(baseURL)` when a helper needs to record the current
size at runtime.

Remote read-only defaults:

- `PLAYWRIGHT_ENV=staging|production` may be used to declare the target.
- `PLAYWRIGHT_READONLY=1` is the default for staging and production.
- Non-GET/HEAD/OPTIONS requests fail unless explicitly allowlisted by the
  read-only mutation guard.
- Known third-party SDK page-load POSTs, such as analytics and wallet SDK
  telemetry, are aborted without failing the read-only run. This keeps remote
  smoke tests private while still failing unknown external POSTs and all
  registered first-party mutations.
- WalletConnect RPC POSTs are body-classified: known read-only JSON-RPC methods
  may continue, while unsafe, unknown, or unparseable calls fail the run.
- For staging, the shared `context` fixture installs the read-only mutation
  guard before the `page` fixture unlocks the access gate. The current access
  gate uses safe GET requests plus a browser cookie.
- Traces are disabled for staging and production by default because they can
  retain credentials or private page state.

App PR CI:

- `.github/workflows/app-pr-ci.yml` computes a risk-aware CI plan before
  installing dependencies.
- Pull-request CI is read-only and secret-free. It must not receive staging
  credentials, deployment credentials, external-model API keys, or durable
  artifact-store write credentials.
- The workflow runs `test:e2e:smoke` only when the CI plan sees route, runtime
  UI, style, or higher-risk changes that need browser evidence.
- The workflow runs `test:e2e:critical-shell` when the CI plan sees guarded,
  build-sensitive, or deleted runtime source changes. This pack is read-only and
  covers high-value route shells and auth/operator gates without signing,
  posting, admin mutations, or wallet writes.
- Uploaded PR CI artifacts are short-term debugging evidence. Durable
  deployment-train evidence still belongs on approved 6529-controlled artifact
  storage, not Git LFS.

WCAG and i18n route evidence:

- `test:e2e:wcag-i18n` runs the first dedicated WCAG/i18n browser evidence
  pack under `tests/wcag-i18n`.
- Axe checks use `@axe-core/playwright` with WCAG A/AA tags through 2.2 and
  scope to `main` by default.
- Axe allowlist entries must name an exact route, rule, selector, owner, reason,
  and future expiry. Expired or broad entries fail before the scan runs.
- Locale stress tests should wait for route-specific hydrated content before
  checking axe, keyboard focus, overflow, or locale-preserving links.
