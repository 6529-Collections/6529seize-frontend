# Device Farm Appium Suites

Appium smoke suites executed on AWS Device Farm **real devices** by
`.github/workflows/device-farm-qa.yml`. Regime overview, provisioning, cost
model, and triage: `ops/docs/developer/device-farm-qa.md`.

This directory is a self-contained npm package (plain npm, **not** part of the
pnpm workspace) because Device Farm's `APPIUM_NODE`/`APPIUM_WEB_NODE` test
types consume an npm-bundled tarball. The nested `package-lock.json` is
intentional and allowed — the root `guard:no-package-lock` only forbids a root
lockfile.

## Layout

```
lib/driver.cjs                 session helpers; builds capabilities from the
                               DEVICEFARM_* env vars on the test host
lib/reporter.cjs               readable Mocha output plus per-device JSON evidence
lib/result.cjs                 conservative failure classification and retry counts
unit/reporter.test.cjs         offline tests using real Mocha with synthetic fixtures
specs/web.smoke.spec.cjs       mobile web smoke (Android Chrome / iOS Safari)
specs/native-android.smoke.spec.cjs
                               native shell smoke (launch, WebView boot,
                               mobile6529:// deep link)
testspecs/*.yml                Device Farm test spec files (run on the Device
                               Farm test host, not in GitHub Actions)
```

Specs are mocha `.cjs` files on purpose: Playwright only collects
`tests/**/*.spec.ts`, so these never leak into the Playwright packs. Knip
analyzes this bundle as its own package using its nested dependency manifest;
this does not add it to the pnpm workspace or the frontend application bundle.

## Read-only discipline

Both suites run against live environments (production by default). They must
stay navigation + DOM-read only: no authentication, no posting, no mutations.
Same rules as the `readonlyMutationGuard` Playwright packs.

## Packaging (what CI does)

```bash
cd tests/device-farm
npm ci
npm run test:unit        # offline reporter contract checks; no device connection
npm pack                 # bundleDependencies: true embeds node_modules in the tgz
zip -j dist/devicefarm-tests.zip ./*.tgz
```

(`npm-bundle`, which the AWS docs mention, predates modern npm and fails with
symlinked local installs; native `bundleDependencies` + `npm pack` produces
the same tgz layout.)

The workflow uploads the zip as the Device Farm test package; the test spec
then runs `npm install *.tgz && cd node_modules/6529-device-farm-tests` and
invokes `npm run test:web` or `npm run test:native` on the test host.
Both commands invoke the bundled Mocha entry point through Node explicitly.
Root PR quality checks can analyze this package without installing its separate
dependencies or inferring executable names from an absent nested installation.

The web command disables Mocha retries and rejects pending/empty suites. Its
reporter writes `devicefarm-result.json` to `$DEVICEFARM_LOG_DIR`, including
failed setup hooks, selected/executed counts, failure classifications, and
navigation recovery counts. `scripts/device-farm-report.py` reads these nested
customer artifacts for the Actions summary without extracting arbitrary ZIP
contents. Missing evidence, known infrastructure failures, and recovered runs
do not become clean passes. The native command is unchanged.

On iOS 16.4+, Safari starts through an ordinary native XCTest app launch.
The harness then opens the target once with `mobile: deepLink`, waits for a
Safari context matching its origin/path, and switches to web automation.
It does not use WDA's `initialDeeplinkUrl` cold-launch path or automatically
attach to an old tab. Failed attachment closes the session without retrying;
Xcode output is included in the Appium log. Older/unknown iOS versions retain
the default Safari session path.

Each web page check verifies a fully loaded `about:blank` document before
requesting its target once. This isolates direct-load checks from the previous
page's delayed router effects. Target readiness checks origin, pathname,
document state, and visible content together. Navigation is not retried;
timeouts preserve browser diagnostics. The same seven app assertions and
long-press interaction remain required.

## Local development

There is nothing device-specific to run locally — sessions require the Appium
server plus a device that Device Farm provides. For fast iteration:

- syntax-check: `node --check specs/web.smoke.spec.cjs`
- dispatch a real run: `gh workflow run device-farm-qa.yml -f packs=web`
- point at your own Appium + device/emulator by exporting
  `DEVICEFARM_DEVICE_PLATFORM_NAME`, `DEVICEFARM_DEVICE_UDID`, `TARGET_URL`
  and running `npm run test:web` — useful with a local Android emulator.
