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

Surface matrix:

- `web-desktop-chromium` is the baseline desktop web project.
- `web-mobile-chromium` is the baseline mobile web project.
- `test:e2e` keeps the historical default behavior and runs the full test set
  on `web-desktop-chromium` only.
- `test:e2e:all-projects` intentionally fans out across every configured
  project and should be reserved for train/nightly or targeted compatibility
  runs.
- `test:e2e:smoke:surface-matrix` runs the deployed smoke pack on both
  baseline web projects.
- `test:e2e:surface-matrix` runs the core public route/navigation pack on both
  baseline web projects.
- `test:e2e:social-readonly` runs the public Waves/Profile read-only pack on
  both baseline web projects.
- `test:e2e:media-readonly` runs the public media, mint, and detail read-only
  pack on both baseline web projects. Exact ReMemes detail assertions are limited
  to the production pack until local and staging have a stable matching fixture.
- `test:e2e:delegation-readonly` runs the public delegation documentation,
  wallet-checker, disconnected write-route guard, and collection-scope pack on
  both baseline web projects.
- `test:e2e:network-open-data-readonly` runs the public Network, Health, Open
  Data, API docs, restricted-route, and fail-closed route-handler pack on both
  baseline web projects.
- `test:e2e:collections-readonly` runs the public NextGen, The Memes, Meme
  Lab, 6529 Gradient, and ReMemes browse/read-only pack on both baseline web
  projects.
- `test:e2e:public-groups-tools-readonly` runs the public Groups, Subscriptions
  Report, and Meme Calendar read-only pack on both baseline web projects.
- `test:e2e:public-content-readonly` runs the public legacy content pack on
  both baseline web projects, with the mutation guard enabled even locally.
- `test:e2e:authenticated-shells-readonly` runs authenticated, read-only
  route-shell coverage for direct messages and own-profile subscriptions/proxy
  tabs on both baseline web projects. It skips unless `PLAYWRIGHT_READONLY=1`,
  `USE_DEV_AUTH=true`, `DEV_MODE_WALLET_ADDRESS`, `DEV_MODE_AUTH_JWT`, and
  `PLAYWRIGHT_DEV_AUTH_PROFILE_HANDLE` are provided by the caller.
- `test:e2e:notifications-mutation-guard` is a local/dev-auth-only negative
  contract for `/notifications`. It verifies that the current authenticated
  mount-time `POST /api/notifications/read` side effect is blocked by the
  read-only mutation guard. It is not a staging or production smoke pack and
  should not be converted into one until notifications have a sandbox-safe or
  product-safe read-only test path.
- `test:e2e:profile-deep-links-readonly` runs public profile legacy deep-link
  redirect coverage on both baseline web projects, with the mutation guard
  enabled even locally.
- `test:e2e:search-waves-readonly` runs global header search keyboard and
  navigation coverage plus wave-local message search coverage on both baseline
  web projects, with the mutation guard enabled even locally.
- `test:e2e:composer-sandbox` runs a local-only authenticated Waves composer
  sandbox on both baseline web projects. It starts a mock API runtime,
  renders a real wave detail route, verifies attachment queue/remove behavior
  and deterministic link previews, and fails if composer submit/upload
  endpoints are touched. It must run against a loopback base URL, but it is not
  a full network-isolation harness and is not a staging or production smoke
  pack.
- `test:e2e:auth-sandbox` runs the local authenticated sandbox on desktop
  Chromium. It includes the composer checks plus positive `/notifications`
  `/messages/create`, and `/waves/create` Chat-wave flows with deterministic
  mock API data. It allows only explicit local sandbox mutations such as
  notification mark-read, synthetic direct-message creation, and synthetic
  create-wave group/wave creation with exact sandbox IDs, queryless paths, and
  request bodies. Unknown mock API writes fail the sandbox request audit, and
  unexpected same-origin Next.js API writes or unknown unsafe external browser
  writes are blocked by a browser route guard. Known wallet and analytics SDK
  background writes are still blocked in-browser, but they do not fail the test.
  This pack must never run against staging or production.
- `test:e2e:staging:smoke` runs the smoke surface matrix against staging.
- `test:e2e:staging` runs the broader surface matrix against the same
  environment.
- `test:e2e:staging:social-readonly` runs the Waves/Profile read-only pack
  against staging with the remote mutation guard and staging access unlock.
- `test:e2e:staging:media-readonly` runs the media/mint/detail read-only pack
  against staging with the remote mutation guard and staging access unlock.
  Production-only ReMemes fixture assertions are skipped on staging.
- `test:e2e:production:social-readonly` runs the same pack against production
  desktop web only as a public, read-only smoke.
- `test:e2e:production:media-readonly` runs the media/mint/detail pack against
  production desktop web only as a public, read-only smoke.
- `test:e2e:staging:delegation-readonly` runs the delegation read-only pack
  against staging with the remote mutation guard and staging access unlock.
- `test:e2e:production:delegation-readonly` runs the delegation read-only pack
  against production desktop web only as a public, read-only smoke.
- `test:e2e:staging:network-open-data-readonly` runs the Network/Open Data
  read-only pack against staging with the remote mutation guard and staging
  access unlock.
- `test:e2e:production:network-open-data-readonly` runs the Network/Open Data
  read-only pack against production desktop web only as a public, read-only
  smoke.
- `test:e2e:staging:collections-readonly` runs the collections read-only pack
  against staging with the remote mutation guard and staging access unlock.
- `test:e2e:production:collections-readonly` runs the collections read-only
  pack against production desktop web only as a public, read-only smoke.
- `test:e2e:staging:public-groups-tools-readonly` runs the public Groups,
  Subscriptions Report, and Meme Calendar read-only pack against staging with
  the remote mutation guard and staging access unlock.
- `test:e2e:production:public-groups-tools-readonly` runs the same public
  Groups/Tools/Calendar pack against production desktop web only as a public,
  read-only smoke.
- `test:e2e:staging:public-content-readonly` runs the public content pack
  against staging with the remote mutation guard and staging access unlock.
- `test:e2e:production:public-content-readonly` runs the public content pack
  against production desktop web only as a public, read-only smoke.
- `test:e2e:staging:profile-deep-links-readonly` runs the profile deep-link
  redirect pack against staging with the remote mutation guard and staging
  access unlock.
- `test:e2e:production:profile-deep-links-readonly` runs the profile deep-link
  redirect pack against production desktop web only as a public, read-only
  smoke.
- `test:e2e:staging:search-waves-readonly` runs the search and wave-detail
  read-only pack against staging with the remote mutation guard and staging
  access unlock.
- `test:e2e:production:search-waves-readonly` runs the search and wave-detail
  read-only pack against production desktop web only as a public, read-only
  smoke.
- `test:e2e:production:readonly` runs the full production-safe read-only pack
  family in one Playwright invocation so release validation fails fast and
  returns one aggregate status. Deployment-bus manifests know this as the
  optional production-only `playwright:production-readonly` pack; record that
  pack only with redacted durable evidence and desktop Chromium surface
  metadata.
- `web-desktop-firefox` and `web-desktop-webkit` are browser-diversity
  projects for train, nightly, or targeted compatibility checks.
- `capacitor-ios-sim`, `capacitor-android-sim`, and `electron-shell-sim` are
  browser simulations only. They may catch responsive/runtime branching issues,
  but they are not evidence that the real native or desktop shells were tested.
- The iOS Capacitor simulation seeds the app's existing EULA consent cookie so
  route-level smoke tests exercise the page shell instead of the legal modal.

Large-pack ownership:

- `test:e2e`, `test:e2e:smoke`, and targeted single-route specs are ordinary
  PR-owner checks.
- `test:e2e:surface-matrix` is owned by the PR owner for user-facing route,
  navigation, shell, WCAG, i18n, deployment, or routing changes. Keep it
  read-only and stable enough for staging and production validation.
- `test:e2e:social-readonly` is owned by PR or train owners changing Waves,
  public profile routing, profile tabs, social feed shells, route canonicalizing,
  or read-only mutation guard behavior.
- `test:e2e:media-readonly` is owned by PR or train owners changing The Memes
  detail pages, mint routing, Meme Lab detail pages, ReMemes detail pages,
  media controls, detail tabs, collection image rendering, or read-only mutation
  guard behavior on public media surfaces. ReMemes regressions need production
  pack evidence until the same fixture is stable in local and staging.
- `test:e2e:delegation-readonly` is owned by PR or train owners changing
  delegation routes, wallet-checker read behavior, delegation documentation,
  disconnected wallet gates, or delegation collection management shells.
- `test:e2e:network-open-data-readonly` is owned by PR or train owners changing
  Network, Health metrics, Open Data downloads, public API docs, restricted
  access shells, or the covered fail-closed route handlers.
- `test:e2e:collections-readonly` is owned by PR or train owners changing
  NextGen public collection/token routes, The Memes, Meme Lab, 6529 Gradient,
  ReMemes, collection sorting/filter shells, or collection browse cards.
- `test:e2e:public-groups-tools-readonly` is owned by PR or train owners
  changing public Groups, profile Groups redirects, Subscriptions Report, Meme
  Calendar, subscription download affordances, calendar locale/timezone controls,
  or read-only mutation guard behavior.
- `test:e2e:public-content-readonly` is owned by PR or train owners changing
  education, museum, OM, news, capital, blog, author, legacy content rendering,
  image/link rendering, route canonicalizing, or read-only mutation guard
  behavior.
- `test:e2e:authenticated-shells-readonly` is owned by PR or train owners
  changing auth restoration, wallet/profile gating, direct messages,
  subscriptions, profile proxy, profile tab visibility, or the read-only
  mutation guard. The pack is explicitly read-only: it may render
  create/assign/top-up affordances but must not click submit, post, assign,
  sign, upload, or otherwise mutate backend state. Authenticated notifications
  are excluded from this read-only pack because the current route marks
  notifications read on mount with `POST /api/notifications/read`; keep that
  behavior covered by a separate mutation-safety follow-up instead of allowing
  it through the read-only guard.
- `test:e2e:notifications-mutation-guard` is owned by PR or train owners
  changing `/notifications`, notification read state, auth restoration, or the
  read-only mutation guard. It is a negative guard contract: it proves the
  mutation is detected and blocked before backend state changes. Full
  remote notification UI coverage requires a disposable sandbox account/backend
  or a user-equivalent product behavior that does not mark notifications read.
- `test:e2e:auth-sandbox` is owned by PR or train owners changing local
  dev-auth behavior, notifications UI/filtering, direct-message creation,
  create-wave wizard behavior, composer shell behavior, or the sandbox mutation
  auditor. It is the positive stateful counterpart to the remote read-only packs
  and must stay loopback only; the mock API and spawned Next dev server are
  intentionally bound to loopback hosts.
- `test:e2e:profile-deep-links-readonly` is owned by PR or train owners
  changing public profile routing, query-preserving profile links, legacy
  waves/groups/followers redirects, profile tab canonicalization, query
  preservation, or read-only mutation guard behavior.
- `test:e2e:search-waves-readonly` is owned by PR or train owners changing
  header search, site search result catalog entries, wave-local message search,
  public wave detail routing, search modal keyboard/focus behavior, or
  read-only mutation guard behavior on search and wave surfaces.
- `test:e2e:composer-sandbox` is owned by PR or train owners changing Waves
  composer input, attachment preview/removal, link preview rendering, dev-auth
  composer eligibility, or local sandbox/mock API coverage. The pack may use
  local synthetic auth and a mock API, but it must never submit a drop or upload
  files to staging or production. Treat it as coverage for composer/drop/upload
  API safety, not as a guarantee that every external read-only media or metadata
  endpoint is isolated.
- `test:e2e:production:readonly` is owned by the release captain or validation
  agent after a production deploy. It is a production-safe aggregate of the
  individual public read-only packs and is the command behind the optional
  deployment-bus pack `playwright:production-readonly`. Do not make it a
  staging requirement unless a real staging aggregate command and evidence path
  exist.
- `test:e2e:browser-diversity` is a train/nightly compatibility pack. A PR
  owner should run it when changing browser-sensitive rendering, media,
  focus/keyboard behavior, or CSS layout primitives.
- `test:e2e:native-sim` is a native-adjacent smoke pack. A PR owner should run
  it when changing native runtime detection, deep links, wallet/native shell
  branching, or viewport assumptions.
- Large-pack failures belong to the PR or train owner until they are diagnosed
  as unrelated infrastructure. Do not quarantine, skip, or downgrade a failing
  large pack without recording the reason in the PR or release report.
