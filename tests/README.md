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
- For staging, the shared `page` fixture unlocks the access gate before
  installing the read-only mutation guard.
- Traces are disabled for staging and production by default because they can
  retain credentials or private page state.
