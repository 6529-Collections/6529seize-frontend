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
specs/web.smoke.spec.cjs       mobile web smoke (Android Chrome / iOS Safari)
specs/native-android.smoke.spec.cjs
                               native shell smoke (launch, WebView boot,
                               mobile6529:// deep link)
testspecs/*.yml                Device Farm test spec files (run on the Device
                               Farm test host, not in GitHub Actions)
```

Specs are mocha `.cjs` files on purpose: Playwright only collects
`tests/**/*.spec.ts`, so these never leak into the Playwright packs, and knip
ignores `tests/**`.

## Read-only discipline

Both suites run against live environments (production by default). They must
stay navigation + DOM-read only: no authentication, no posting, no mutations.
Same rules as the `readonlyMutationGuard` Playwright packs.

## Packaging (what CI does)

```bash
cd tests/device-farm
npm ci
npm pack                 # bundleDependencies: true embeds node_modules in the tgz
zip -j dist/devicefarm-tests.zip ./*.tgz
```

(`npm-bundle`, which the AWS docs mention, predates modern npm and fails with
symlinked local installs; native `bundleDependencies` + `npm pack` produces
the same tgz layout.)

The workflow uploads the zip as the Device Farm test package; the test spec
then runs `npm install *.tgz && cd node_modules/6529-device-farm-tests` and
invokes `npm run test:web` or `npm run test:native` on the test host.

## Local development

There is nothing device-specific to run locally — sessions require the Appium
server plus a device that Device Farm provides. For fast iteration:

- syntax-check: `node --check specs/web.smoke.spec.cjs`
- dispatch a real run: `gh workflow run device-farm-qa.yml -f packs=web`
- point at your own Appium + device/emulator by exporting
  `DEVICEFARM_DEVICE_PLATFORM_NAME`, `DEVICEFARM_DEVICE_UDID`, `TARGET_URL`
  and running `npm run test:web` — useful with a local Android emulator.
