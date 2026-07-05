# AWS Device Farm Mobile QA Regime

Real-device QA for the 6529 mobile experience, run on AWS Device Farm
(us-west-2) from `.github/workflows/device-farm-qa.yml`.

## Why this shape

The 6529 mobile app (`6529-Collections/6529-core-mobile`, App Store id
`6654923687`, Play package `com.core6529.app`) is a thin Capacitor shell whose
WebView loads `https://6529.io` remotely (`capacitor.config.json` sets
`server.url`). The app's actual UI is therefore this repository's deployed
frontend, and mobile QA decomposes into two independently testable contracts:

1. **The frontend on real mobile browsers/WebViews.** Playwright already
   covers emulated mobile viewports and Capacitor browser simulations
   (`browser-simulation` evidence tier in `tests/README.md`); Device Farm
   upgrades this to the `real-device` tier on physical Android Chrome and iOS
   Safari hardware.
2. **The native shell contract.** The shell must launch, boot the remote
   frontend inside its WebView, honour `mobile6529://` deep links, and not
   crash under random UI input. This is exercised against a debug APK built in
   CI from the shell repository.

iOS **native** runs are intentionally out of scope for v1: Device Farm needs a
development-signed IPA, which requires Apple signing infrastructure in CI. The
shell's web content is already covered by the iOS Safari pack; revisit if the
shell gains meaningful iOS-native behavior.

## Packs

| Pack | Device Farm test type | Devices | What it validates |
| --- | --- | --- | --- |
| `devicefarm:mobile-web-smoke` | `APPIUM_WEB_NODE` | Android phones (pool `android-phones-smoke`), iPhone (pool `ios-phones-web-smoke`) | Deployed frontend renders `/`, `/the-memes`, `/network` without crash markers, exposes navigation chrome, no horizontal overflow. Read-only. |
| `devicefarm:native-android-smoke` | `APPIUM_NODE` | Android phones | Debug shell APK launches, WebView boots `6529.io`, `mobile6529://navigate/...` deep links navigate the WebView. Read-only. |
| `devicefarm:native-android-fuzz` | `BUILTIN_FUZZ` | Android phones | 2500 random UI events per device (fixed seed `6529`) surface crashes/ANRs in the shell. |

Suite code lives in `tests/device-farm/` (self-contained npm package — see its
README). Device Farm test spec files live in `tests/device-farm/testspecs/`.

## Triggers and targets

- `workflow_dispatch` with `target` (`production` default, or `staging`) and
  `packs` (`all` default, `web`, `native`). The native pack always exercises
  production content because the shell hardcodes `https://6529.io`.
- Weekly schedule (Mondays 04:00 UTC): full pack against production.
- Post-release: `deploy-6529` may dispatch the workflow after production
  validation (`gh workflow run device-farm-qa.yml --ref main`) and record the
  run URL as release evidence. Non-gating unless the release is mobile-focused.

All packs are read-only against live environments: navigation and DOM reads
only, no authentication, no mutations — consistent with the
`readonlyMutationGuard` discipline in the Playwright packs.

## Cost model

Device Farm metered pricing is $0.17 per device-minute (first 1,000 minutes
free on new accounts). The default regime is sized deliberately small:

- weekly full pack ≈ 2 Android + 1 iOS web jobs (~10 min each) + native smoke
  and fuzz on 2 Android devices (~15 min each) ≈ 90 device-minutes ≈ $15/week.
- `jobTimeoutMinutes` caps runaway runs (30 min web/smoke, 20 min fuzz).

Increase cadence (e.g. nightly web smoke) only after the weekly signal proves
stable; unmetered slots ($250/device/month) only pay off past ~25 runs/week.

## One-time provisioning

1. **Project + device pools** — run with admin-ish AWS credentials:

   ```bash
   bash ops/scripts/devicefarm-bootstrap.sh
   ```

   Defaults: project `6529-mobile-qa`, pools `android-phones-smoke` (max 3)
   and `ios-phones-web-smoke` (max 2). The script is idempotent and
   *converging*: re-running it updates existing pools to the rules in the
   script, so pool composition is version-controlled here. Override names via
   env vars and mirror them in repository variables
   `DEVICEFARM_PROJECT_NAME`, `DEVICEFARM_ANDROID_POOL_NAME`,
   `DEVICEFARM_IOS_POOL_NAME` (the workflow resolves resources by name).

   Pool composition is a deliberate representative mix, not "any available
   phone" (an open rule tends to hand out two near-identical Pixels):

   | Pool | Devices | Why |
   | --- | --- | --- |
   | `android-phones-smoke` | Samsung Galaxy S24, Google Pixel 8, Samsung Galaxy A15 | One UI flagship (dominant real-world OEM skin), stock Android, and the mid-range/low-perf class that is the most common Android tier globally. |
   | `ios-phones-web-smoke` | iPhone 16, iPhone SE (2022) | Current mainstream iOS, plus the 4.7" small screen on the oldest supported Safari — the viewport that makes the horizontal-overflow check earn its keep. |

   Model rules pick whichever of the named devices are highly available at
   scheduling time (a busy model just shrinks that run's coverage). Recheck
   the model list against the fleet (`aws devicefarm list-devices`) roughly
   yearly, and calibrate against real visitor device analytics (CloudWatch
   RUM / Mixpanel user agents) when adjusting.

2. **CI IAM principal** — create a dedicated IAM user (or role) for the
   workflow with this policy (Device Farm resources exist only in us-west-2):

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "DeviceFarmQaRuns",
         "Effect": "Allow",
         "Action": [
           "devicefarm:ListProjects",
           "devicefarm:ListDevicePools",
           "devicefarm:ListUploads",
           "devicefarm:CreateUpload",
           "devicefarm:GetUpload",
           "devicefarm:DeleteUpload",
           "devicefarm:ScheduleRun",
           "devicefarm:GetRun",
           "devicefarm:StopRun",
           "devicefarm:ListJobs",
           "devicefarm:ListSuites",
           "devicefarm:ListTests",
           "devicefarm:ListArtifacts"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

   Scope `Resource` to the project/run ARNs printed by the bootstrap script if
   tighter scoping is desired.

3. **Repository secrets**:

   | Secret | Required for | Notes |
   | --- | --- | --- |
   | `DEVICEFARM_AWS_ACCESS_KEY_ID` / `DEVICEFARM_AWS_SECRET_ACCESS_KEY` | all packs | Credentials for the IAM principal above. Kept separate from the deploy credentials so Device Farm access never widens the deploy user. |
   | `MOBILE_REPO_TOKEN` | native pack | Fine-grained PAT with read-only `contents` access to `6529-Collections/6529-core-mobile`. |
   | `MOBILE_GOOGLE_SERVICES_JSON` | optional | Raw `google-services.json` for Firebase push in the QA build. The shell builds fine without it (the Gradle project applies the google-services plugin only when the file exists); push registration is simply inert. |

   Until the secrets exist, every job in the workflow skips with a `::notice`
   and the scheduled run stays green — provisioning can land after the code.

4. **Actions allowlist** — this repository runs the "allow selected actions"
   policy (GitHub-owned + Marketplace-verified + explicit patterns). The
   workflow's SHA-pinned third-party actions must appear as exact patterns in
   the allowlist or every run ends in `startup_failure` with zero jobs:

   ```
   aws-actions/aws-devicefarm-mobile-device-testing@<pinned SHA>
   sarisia/actions-status-discord@<pinned SHA>
   ```

   (Both are in place as of 2026-07-05; re-add the new SHA whenever the pin is
   bumped. Note the policy/CodeQL tension: CodeQL requires SHA pins while the
   allowlist previously only allowed `sarisia/actions-status-discord@v1`.)

### Test spec gotcha

The AWS docs render test-host selectors as `{{amazon_linux_2}}` — that is doc
templating, not syntax. Device Farm rejects the braces with
`TEST_SPEC_INVALID_YAML_FILE`; test spec files must use the bare tokens
(`android_test_host: amazon_linux_2`, `ios_test_host: macos_sequoia`).

## Reading results

- Each pack writes result + Device Farm console URL to the workflow run's
  step summary, and uploads the full Device Farm artifact set (videos, device
  logs, Appium logs, screenshots from `$DEVICEFARM_LOG_DIR`) as workflow
  artifacts (14-day retention).
- The `QA report` job fails the run when any pack fails, and scheduled
  failures ping Discord via the existing `DISCORD_WEBHOOK`.
- Deep inspection (per-device video, logcat, Appium server log) lives in the
  Device Farm console link — runs are named
  `<pack>_<github_run_id>_<attempt>`.

## Failure triage

| Symptom | Likely cause | Action |
| --- | --- | --- |
| All packs skipped with notices | Secrets not configured | Complete provisioning above. |
| `projectArn`/`devicePoolArn` lookup errors | Bootstrap not run, or names drifted from repo variables | Re-run bootstrap; align variables. |
| Web pack fails only on one platform | Real-device/browser-specific frontend regression | Reproduce with Playwright mobile projects first; real-device video is in the run artifacts. |
| Native smoke fails at WebView boot | Shell regression, production outage, or WebView debuggability | Check production health first; confirm the APK is a debug build (WebView contexts are only visible to Appium in debug builds). |
| Deep-link test fails | `useDeepLinkNavigation` regression in this repo or intent-filter change in the shell | Compare against `__tests__/app/openMobile.test.tsx` expectations. |
| Fuzz fails | Shell crash/ANR under monkey input | Pull the crash video + logcat from artifacts; file against `6529-core-mobile` if native. |

Flaky-signal policy mirrors the staging E2E rules in
`ops/skills/deploy-6529/SKILL.md`: rerun once with evidence, then harden the
test or investigate the app if the signal repeats.

## Evolving the regime

- Add spec files under `tests/device-farm/specs/` and wire them via the
  `test:*` scripts in `tests/device-farm/package.json`; the packaging step
  bundles everything automatically.
- New flows should stay read-only. If authenticated mobile flows become
  necessary, mint a dedicated staging test identity and target staging only —
  never reuse deploy or personal credentials on farm devices.
- iOS native support needs: Apple development certificate + ad-hoc/development
  provisioning for Device Farm devices, an `ios` build job (macOS runner), and
  an `APPIUM_NODE` run against the IPA. The suite and test specs are already
  platform-parameterized.
