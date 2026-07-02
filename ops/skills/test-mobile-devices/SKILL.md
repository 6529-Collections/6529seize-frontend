---
name: test-mobile-devices
description: Plan, run, and report 6529 frontend QA on native mobile shells using iOS Simulator and real iPhone workflows. Use when a frontend change needs simulator runtime evidence, real-device runtime evidence, Appium/XCUITest, XcodeBuildMCP simulator control, Capacitor/native-wrapper behavior, mobile shell routing, or native evidence reporting. Do not use for ordinary responsive web checks unless comparing browser simulation with real native proof.
---

# Test Mobile Devices

## Scope

Use this skill to collect and report native mobile evidence for the 6529
frontend. Version 1 covers iOS Simulator and real iPhone flows through the
sibling mobile shell repo.

Reserve structure for Android later, but do not run or document Android as
supported evidence until a dedicated Android workflow exists.

Push-enabled native testing is explicitly out of scope for this skill. Keep
local native workflows no-push unless the user separately asks for a
push-enabled production-style mobile setup.

## Required Context

1. Read the frontend repo `AGENTS.md` and obey the command policy.
2. Confirm the sibling mobile shell repo is available. Strongly recommend the
   local path shape `/Users/<name>/6529-core-mobile`.
3. Confirm the sibling mobile repo is on branch `codex/mobile-dev-workflows`.
   If the repo or branch is unavailable, stop and report blocked.
4. Read the sibling mobile repo `AGENTS.md` and `docs/mobile-workflows.md`
   before running native shell commands.
5. Use the frontend repo's documented wrapper for frontend commands. In this
   repo, project commands go through `6529`.

Do not hardcode a real username, local absolute path, LAN IP, Apple team ID,
UDID, bundle ID, or private environment value in reusable instructions, PR
text, committed files, or public reports.

## Evidence Tiers

Label evidence precisely:

- `browser-simulation`: Playwright projects such as `capacitor-ios-sim`,
  `capacitor-android-sim`, or `electron-shell-sim`. This catches native-branch
  logic but does not prove a real native shell.
- `package-prerequisites`: `test:native-evidence:package-prereqs` style checks.
  This proves repo/tooling prerequisites, not runtime behavior.
- `simulator-runtime`: the iOS native shell launched in Simulator and controlled
  with simulator UI tools.
- `real-device-runtime`: the iOS native shell installed/launched on a physical
  iPhone and controlled with Appium/XCUITest.

Never claim real-device or packaged-native evidence from browser simulation
alone.

## Frontend Simulation Checks

Use these when the change is native-adjacent but real runtime proof is not
requested or is blocked:

- `6529 run test:e2e:native-sim`
- `6529 run test:e2e:native-shell-readonly`
- `6529 run test:native-evidence`

These commands are not read-only shell commands under the user's command policy.
Ask before running them when required by the active instructions.

## iOS Simulator Workflow

Use this for simulator runtime evidence.

1. Start the frontend dev server using the frontend repo's documented command.
   Capture the actual printed port; do not assume a port.
2. In the sibling mobile repo, confirm branch `codex/mobile-dev-workflows`.
3. Launch the simulator AI workflow from the sibling mobile repo:

   ```bash
   MOBILE_PORT="$FRONTEND_PORT" npm run ios:sim:ai
   ```

4. Prefer XcodeBuildMCP/Codex simulator UI tools for simulator control.
5. Capture a screenshot or UI snapshot before interacting.
6. Perform one small tap or swipe that exercises the touched surface.
7. Record the route, frontend port source, command shape, screenshot/UI proof,
   and any console/native failure signals.

Simulator local mode defaults to `localhost`. Only use a non-localhost simulator
host when the sibling mobile docs or the user's environment require it.

## Real iPhone Workflow

Use this for physical-device runtime evidence.

1. Connect and unlock the iPhone.
2. Ensure Developer Mode and UI Automation are enabled.
3. Keep the Mac and phone on the same network for local frontend testing.
4. Start the frontend dev server using the frontend repo's documented command.
   Capture the actual printed port.
5. Determine the Mac LAN IP reachable by the phone. Do not use `localhost` or
   `127.0.0.1` for a real phone.
6. Confirm the frontend allows the phone-origin request. In this repo,
   `config/nextConfig.ts` reads `NEXT_ALLOWED_DEV_ORIGINS` into
   `allowedDevOrigins`.
7. In the sibling mobile repo, confirm branch `codex/mobile-dev-workflows`.
8. Ensure local-only mobile values are supplied through shell env or ignored
   mobile env files:
   - `IOS_DEVICE_ID`
   - `IOS_DEVELOPMENT_TEAM`
   - `IOS_BUNDLE_ID`
   - `MOBILE_HOST`
   - `MOBILE_PORT`
   - `MOBILE_PUSH_MODE=disabled`
9. Launch the real-device AI workflow from the sibling mobile repo:

   ```bash
   MOBILE_HOST="$MAC_LAN_IP" MOBILE_PORT="$FRONTEND_PORT" npm run ios:device:ai
   ```

10. Attach Appium/XCUITest using the same device id and bundle id.
11. Capture a real phone screenshot.
12. Capture page source and verify app bundle/content signals.
13. Perform one small tap or swipe that exercises the touched surface.

If the app opens blank, check `MOBILE_HOST`, `MOBILE_PORT`, and
`allowedDevOrigins` before investigating app code.

## Evidence Artifacts

Store local screenshots, page source snippets, and short logs under ignored
paths such as:

```text
test-results/mobile-device-qa/<timestamp>/
```

Never commit these artifacts. Report redacted summaries instead of raw local
paths or sensitive identifiers.

For release or deployment evidence, use only approved artifact storage when the
release process explicitly requires it. Do not invent durable storage or commit
generated evidence files.

## Report Format

Close out with:

- Evidence tier.
- Device or simulator class, without private IDs.
- Frontend target source, with host/IP redacted when needed.
- Command shape, with private env values redacted.
- Screenshot/UI snapshot status.
- Page-source status for real-device Appium runs.
- Gesture or tap performed.
- Failures, blockers, and what was not checked.

Example:

```md
Evidence tier: real-device-runtime
Surface: real iPhone via Appium/XCUITest
Target: local frontend through Mac LAN host, redacted
Proof: screenshot captured, page source showed app bundle/content, one tap succeeded
Artifacts: local-only ignored test-results/mobile-device-qa/...; not committed
```
