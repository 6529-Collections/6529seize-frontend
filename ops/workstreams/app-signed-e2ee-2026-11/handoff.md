# Signed and encrypted messages in the apps: release handoff

Release candidates remain open as of 2026-11-03. The staging evidence below
is from the original handoff; it does not establish that the latest PR heads
are deployed. Live GitHub and deployment state override this note.

## PRs and deploy order

Backend before frontend before testing the updated app builds.

1. Backend: 6529-Collections/6529seize-backend#2287 (`POST /device-grants`,
   app grants in `POST /e2ee/devices/login-grant`). Deploy `api` only. No
   migration.
2. Frontend: 6529-Collections/6529seize-frontend#4541 (this branch's app
   grants, author proof, desktop notifications and phone wake navigation),
   plus #4544 (the notice for unsupported browsers). The Capacitor shell
   loads the deployed website; app grants are separate from basic encrypted
   DMs, which are already available in production.
3. Mobile: 6529-Collections/6529-core-mobile#26, branch
   `claude/release-1.4`, is the single combined candidate. It includes the
   former #27 native checks and #28 iOS minimum change. Build and test the
   signed staging variant before the 1.4 store release. Minimum iOS is 16.4.
4. Desktop: 6529-Collections/6529-core#278, branch
   `claude/desktop-e2ee-signed`, still imports frontend `5c0ab01667`.
   Refresh the renderer from frontend `main` after #4541 merges, then test
   and build the final desktop candidate. Its imported history exceeds the
   DCO and review bots' diff-enumeration limits; this tooling limitation
   remains separate from application validation.

## Confirmed direction and remaining work

- The features are technically separate; the web combines their grants into
  one wallet signature. A combined grant and an enrolled encrypted device
  are separate states, so acceptance must check both.
- Keep the approved current live wallet wording. Before enabling production
  app grants, align any app-specific statement changes in the frontend
  (`lib/device-signing/app-grant.ts`), backend
  (`src/api-serverless/src/device-signing/app-device-grant.ts`) and shared
  test vectors. This follow-up does not turn production flags on.
- Production app grants use `NEXT_PUBLIC_FEATURE_APP_DEVICE_GRANTS` in
  `.github/workflows/production-build-artifact.yml` and the desktop live
  build (`scripts/desktop-build-target.cjs` in 6529-core). Staging has it on.
- Connection sharing must support encrypted messages and author proof on
  Mobile and Core without connecting a wallet there. Treat that setup work,
  encrypted-message in-app notification entries and a visible device-status
  indicator as remaining implementation; the existing app-grant flow does
  not establish that they are delivered.
- The iOS compatibility decision is implemented by mobile #26 (minimum
  16.4) and frontend #4544 (update notice). Signed messages still additionally
  require iOS 17's Ed25519 support; iOS 16.4 supports encrypted messages.
- The reported disconnected-wallet setup, repeated authentication update,
  activation inconsistencies and warning/banner layouts remain separate
  product fixes. PR synchronization alone does not resolve them.

## What was verified, and where

- Real devices on AWS Device Farm (production site and CSP; Safari is the
  WKWebView engine of that iOS version, Chrome stands in for Android System
  WebView). Probe: `tests/device-farm/specs/e2ee-capabilities.probe.spec.cjs`.
  - iOS 15.0.2, 15.2, 15.5 and 16.0.2: the site does not start; on 15.x
    WebAssembly instantiation is blocked by the CSP.
  - iOS 16.4 and 16.6.1: WebAssembly (the real OpenMLS module), IndexedDB,
    Web Locks and BroadcastChannel work; WebCrypto Ed25519 is missing, so no
    signed messages and no app grant (the E2EE card falls back to its own
    prompt).
  - iOS 17.6.1, 18.6.2, 26.6, Pixel 10 (Android 16) and Galaxy S25 (Android
    15), Chrome 156: everything works, including a stored Ed25519 key.
- 6529 Desktop (unpacked local Windows build of #278, driven with
  Playwright, fresh profiles, no wallet):
  - The served CSP has `'wasm-unsafe-eval'` and no `'unsafe-eval'`; Electron
    does not override it. `eval` throws `EvalError`; the OpenMLS wasm loads
    (hash matches the manifest) and instantiates.
  - IndexedDB and localStorage survive quit and relaunch. With port 6529
    held by another program the app used 3000 for that launch, kept 6529
    remembered, and returned to 6529 (and its stored data) once it was free.
  - `/messages/encrypted` signed out asks to connect a wallet (no 404).
  - A content-free "New encrypted message" notification shows with an empty
    icon; its click restores the minimized window and opens the chat path.
  - Core seed-wallet typed-data signature for an app-grant request is
    byte-identical to viem's (unit test); not signed end to end in the app.
  - Test-backend pages stop at the staging Team Login (no working staging
    key on the box), so route and click checks ran on the live build.
- 6529 Mobile in-app (former 6529-core-mobile#27, now included in #26; production site; runs
  https://github.com/6529-Collections/6529-core-mobile/actions/runs/41303643217
  and .../41305064977), iOS 26.5 and 16.4 simulators, Android 15 (WebView 124) and 16 (WebView 133) emulators: launch with the 6529Mobile user agent,
  CSP enforced, the real OpenMLS wasm instantiates, IndexedDB and a stored
  non-extractable key survive an app restart, Web Locks and BroadcastChannel
  work, cold-start links open `/messages/encrypted`. Ed25519 works in the iOS
  26.5 app (key survives restart); not on iOS 16.4 or WebViews before
  Chromium 137 (Chrome 156 on Device Farm passes).
  - Unsigned iOS builds cannot store CryptoKeys in IndexedDB (keychain error
    -34018), so E2EE and signed messages fail in unsigned simulator builds;
    signed builds (all store builds) are fine.
  - Links that arrive while the iOS app runs do nothing until the EULA is
    accepted (the EULA gate replaces the page, so the link handler is not
    mounted). Cold-start links work.
  - Android WebView before Chromium 130 parsed `mobile6529://navigate/...`
    with an empty host, so links while the app ran were ignored there; fixed
    in the frontend PR (`helpers/mobileAppLinks.ts`).
  - Staging could not be loaded in the shell: staging.6529.io redirects
    every path to `/access` without the staging access secret.
- Unit tests in all three repos, including shared app-grant vectors pinned
  identically in the backend and frontend.

Not verified: a real wallet signing an app grant (phone or desktop), push
wakes on a physical phone, a real WalletConnect wallet's typed-data prompt,
and the apps against staging. These need a person with a wallet and the
staging access secret; see "How to test".

## Staging

On staging since 2026-11-01 18:19 UTC (owner-approved; pushed by the
coordinator session):

- Backend `1a-staging` `0fde43531f`: the two signed #2287 commits replayed
  onto staging; `api` deploy run 41335897736.
- Frontend `1a-staging` `e5679b8322`: #4541 at `228f8fdd95` (with #4540);
  Web Deploy - STAGING run 41335981782. App grants are on there
  (`NEXT_PUBLIC_FEATURE_APP_DEVICE_GRANTS`).

Neither app could be pointed at staging from this machine: staging.6529.io
sends every path to `/access`, and the desktop test build stops at the
staging Team Login, without the staging access secret. Test the apps on
staging by hand (below) with that secret.

## How to test (staging)

Staging has app grants on. Use a throwaway wallet with a profile.

1. Phone: use mobile #26's `claude/release-1.4` branch. Run
   `npm run prepare:ios:staging`, open Xcode and select `mobileStaging6529`,
   then sign and run on a physical iPhone. For Android use
   `npm run prepare:android:staging` and the `stagingDebug` variant. Do not
   edit tracked `capacitor.config.json`; the schemes/flavors select staging.
   Pass the staging access gate. Desktop: a 6529-core test build
   (`BACKEND_TARGET=test`, needs `STAGING_API_KEY`), then the staging Team
   Login. Sign in.
2. Open a wave and select **Turn on** in the signed-messages notice. The
   wallet shows one typed-data request ("6529 Device Grant") with the
   statement above. Approve.
3. Post a drop. It shows **Signed by its author**; open **Signature** and
   check "Signed by its author" with your wallet. Preferences > Devices lists
   the app (for example "6529 app on iPhone").
4. For a profile whose app grant included the encrypted-messages key, open
   `/messages/encrypted`: the device is already on without another prompt.
   If the grant was signing-only, verify the separate encrypted setup.
   Start a chat with a second account on the website and exchange messages
   both ways.
5. Desktop only: with the window unfocused, have the other account send a
   message. A "New encrypted message" notification appears; selecting it
   opens that chat.
6. Revoke the app's grant in Devices. Encrypted messages stop on that app too.
7. Repeat steps 1 to 4 with a WalletConnect wallet on the phone.
