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
