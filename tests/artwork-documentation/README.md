# Artwork documentation browser regression pack

Run `seize run test:e2e:artwork-documentation-sandbox` on Windows, or the repository `6529` wrapper elsewhere.

The pack runs the real editor on desktop and mobile with the published legacy photography v2 catalogue and the canonical museum v3 catalogue. All records, account state and uploaded bytes are fictional. A loopback API and browser interception provide deterministic save, transfer, processing and attachment responses. The shared sandbox mutation guard refuses non-local writes.

The tests exercise independent answer saving, inline validation, chapter and reading navigation plus viewport changes across the mobile/desktop shell boundary during a transfer, scanning-state polling, attachment recovery without a second transfer, final-file selection and saved values after reload. The first attachment deliberately receives HTTP 503. This is browser regression coverage across mocked HTTP boundaries; it does not prove live authorization, object storage, malware scanning or deployment health. Those require separate staging end-to-end checks.

The pack reserves local ports 3295 and 4295, uses the existing composer sandbox server and writes Next output to the ignored `.next-playwright-artwork-documentation` directory. It uses a public unsigned synthetic account through the ordinary stored-account hydration path, not development impersonation. It must never be pointed at staging or production.

`profile-v2.json` is the public `photography_documentation_v1` version 2 catalogue exported from the backend catalogue, without artist answers. Museum v3 reuses `__tests__/fixtures/artwork-documentation-profile-v3.json`. Update the fixture deliberately when its contract changes.

App PR CI selects this pack for artwork-documentation runtime, responsive shell, fixture and sandbox-policy changes through `scripts/app-pr-ci-effective-plan.cjs`.

## Production-built local acceptance

Use separate terminals or managed child processes. Keep the mock API running during the build and browser run. These commands are local fixtures only.

Start the loopback API without a development frontend:

    $env:PORT = "3295"
    $env:PLAYWRIGHT_COMPOSER_SANDBOX_API_PORT = "4295"
    $env:PLAYWRIGHT_COMPOSER_SANDBOX_API_ONLY = "1"
    $env:USE_DEV_AUTH = "false"
    seize exec node tests/support/composerSandboxServer.cjs

In the build/server terminal, retain the repository's other required environment settings and set these fixture origins:

    $env:API_ENDPOINT = "http://127.0.0.1:4295"
    $env:ALLOWLIST_API_ENDPOINT = "http://127.0.0.1:4295"
    $env:WS_ENDPOINT = "ws://127.0.0.1:4295"
    $env:BASE_ENDPOINT = "http://localhost:3295"
    $env:USE_DEV_AUTH = "false"
    $env:ASSETS_FROM_S3 = "false"
    seize run build:ci
    seize exec next start --port 3295 --hostname localhost

Against that server:

    $env:PLAYWRIGHT_SKIP_WEB_SERVER = "1"
    $env:PLAYWRIGHT_ARTWORK_DOCUMENTATION_PRODUCTION_SANDBOX = "1"
    seize run test:e2e:artwork-documentation-sandbox

The production build intentionally rejects the plain-HTTP fixture API under its Content Security Policy. The explicit production-sandbox flag bypasses CSP only in this pack's browser contexts, and only with the local sandbox flags; the mandatory loopback-origin and mutation guards still run before navigation. Normal development/CI runs retain CSP. This opt-in tests the production bundle's editor behavior and appearance; **it does not validate CSP**. Staging and production acceptance must keep CSP enforced and use their real HTTPS/WSS services. Do not change application headers to accommodate the mock API.

The fixture route is /artwork-documentation/works/22222222-2222-4222-8222-222222222222/contexts/11111111-1111-4111-8111-111111111111?section=artwork. It exists only while installDocumentationSandbox is installed in that browser page. Other chapters use the same route with section=materials, section=rights or the corresponding chapter ID. The helper returns the mutable fictional context and route, so a separate local visual review can reuse it at 1440, 820 and 390 pixels without copying artist records. Preserve operational screenshots outside tracked files.

The built output must have the loopback API origin above. Do not aim this mutation pack at a deployed server or replace a running server owned by another task.
