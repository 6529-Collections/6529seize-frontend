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
Before opening the target or connecting Web Inspector, the harness launches
Settings and follows Safari > Advanced (Apps > Safari > Advanced on iOS 18+).
After each app launch, it waits for `mobile: activeAppInfo` to identify that
app before reading controls or opening a URL. Settings navigation waits for
its root title or a visible back control before choosing an action; a missing
root during a transition is not treated as a nested screen. Each readiness
wait is bounded to ten seconds, and native command errors remain terminal.
It reads the Web Inspector switch, enables it only when off, and verifies it
is on before returning to Safari. The configured device pools use English
Settings labels. Navigation back to the Settings root is bounded; missing,
locked, unknown, or non-persisting controls fail setup without a fallback or
session retry. The simulator-only `mobile: updateSafariPreferences` API is
not used on these physical devices. Setup failures retain a screenshot before
cleanup; Inspector-preparation errors include `web-inspector-setup` diagnostics.
The harness then opens the target once with `mobile: deepLink`, waits for a
Safari context matching its origin/path, and switches to web automation.
It does not use WDA's `initialDeeplinkUrl` cold-launch path or automatically
attach to an old tab. Failed attachment closes the session without retrying;
Xcode output is included in the Appium log. Older/unknown iOS versions retain
the default Safari session path.

This prerequisite addresses run `36566055869`: iPhone 16's system log recorded
Web Inspector shutting down because its preference was disabled, while Safari
loaded the page. All seven iPhone 16 tests remained unexecuted. Device setup
changes only this debugging preference; tests remain logged out and read-only
against the target site. The native Settings path requires fresh device evidence.

Run `36573433144` exposed an app-switch race in that preparation: both iPhones
queried controls before Settings became active and tried to click a nonexistent
back button. Neither reached the Inspector switch or any site assertion;
Android passed. Foreground and navigation readiness now guard those reads.

Each Android web page check creates a fresh blank tab through W3C `createWindow`,
closes the previous tab, verifies it is gone, and switches to the new handle.
Safari continues navigating the current tab to `about:blank`. Both paths verify
the blank document before requesting the target once. Android no longer depends
on the old document accepting navigation away: the A15 acknowledged that command
but stayed on Memes for 90 seconds in run `36431891530`. A tab-command failure is
terminal; no fallback, retry, or replacement session is attempted. Cookies and
local storage remain shared; session storage starts fresh with each tab.
Target readiness checks origin, pathname,
document state, and visible content together. Navigation is not retried;
timeouts preserve browser diagnostics. The same seven app assertions and
long-press interaction remain required.

Android web sessions use `pageLoadStrategy: none`, so Chrome returns navigation
control to the harness instead of blocking behind its implicit load wait.
The explicit blank-document barrier and target origin/path, `readyState=complete`,
and visible-content checks remain required. This addresses the Pixel 8 command
stall in run `36401855670`: the video showed Memes content by 27 seconds, while
the URL command failed at Appium's 240-second proxy deadline. The subsequent
diagnostic read returned about five minutes after navigation began. A command that
actually fails is still terminal; a later healthy diagnostic cannot turn it into
a pass. Safari and native Android retain their existing page-load settings.

Document readiness does not establish asynchronous page-content readiness.
The Memes assertion separately waits up to 90 seconds for its existing `meme`
body-text requirement; a header or `Loading collections` skeleton is insufficient.
Each observation still checks crash markers, and the first crash or failed
browser read terminates the assertion. This only waits for content on the
current page: it never reopens the URL or retries a failed test.

## Local development

There is nothing device-specific to run locally — sessions require the Appium
server plus a device that Device Farm provides. For fast iteration:

- syntax-check: `node --check specs/web.smoke.spec.cjs`
- dispatch a real run: `gh workflow run device-farm-qa.yml -f packs=web`
- point at your own Appium + device/emulator by exporting
  `DEVICEFARM_DEVICE_PLATFORM_NAME`, `DEVICEFARM_DEVICE_UDID`, `TARGET_URL`
  and running `npm run test:web` — useful with a local Android emulator.
