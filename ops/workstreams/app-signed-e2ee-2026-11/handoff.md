# Signed and encrypted messages in the apps: release handoff

Status on 2026-11-01: review-ready PRs, deployed to staging; nothing merged to
`main`, nothing in production. For prxt6529 to ship. Live GitHub state
overrides this note.

## PRs and deploy order

Ship in this order. Backend before frontend before app builds.

1. Backend: 6529-Collections/6529seize-backend#2287 (`POST /device-grants`,
   app grants in `POST /e2ee/devices/login-grant`). Deploy `api` only. No
   migration.
2. Frontend: 6529-Collections/6529seize-frontend#4540 (website combined
   turn-on), then this workstream's frontend PR (branch
   `claude/app-signed-e2ee`). It contains #4540's commits; merge #4540 first.
   The Capacitor shell loads 6529.io, so phones get the change with the web
   deploy.
3. Desktop: 6529-Collections/6529-core#278 (branch
   `claude/desktop-e2ee-signed`): renderer pull at frontend `5c0ab01667`,
   build flags, stable local port, notification click, typed-data signing
   for the Core seed wallet and the browser connector. Re-pull the renderer
   from frontend `main` after step 2 merges, then build the desktop release.
   Its DCO check fails only because the DCO app stops reading at 250 commits
   (the PR has 885 through the subtree pull); DCO is not required there.
4. Mobile shell: 6529-Collections/6529-core-mobile#27 adds a CI check that
   runs the real shell in the iOS Simulator and Android emulators. It changes
   nothing that ships; no store build is needed for this feature.

## Owner decisions still open

- **App grant wording** (draft, not approved). Signing only: "Turn on signed
  messages on this device until 16 Apr 2027. This device will sign your
  posts, edits, deletes and reactions so anyone can verify they came from your
  wallet. It can't move funds, change your handle, add devices or act as an
  admin. No transaction, no gas, no token approvals. (Device key ...)". With
  encrypted messages it adds "It will also encrypt (send) and decrypt (read)
  your end-to-end encrypted messages, which 6529.io cannot read." and names
  both keys. Edit `renderAppGrantStatementDraft1` in the frontend
  (`lib/device-signing/app-grant.ts`) and the backend
  (`src/api-serverless/src/device-signing/app-device-grant.ts`) together and
  refresh the shared vectors in both test files.
- **Turning app grants on in production** after approval: set
  `NEXT_PUBLIC_FEATURE_APP_DEVICE_GRANTS: "true"` in
  `.github/workflows/production-build-artifact.yml` and in the desktop live
  build (`scripts/desktop-build-target.cjs` in 6529-core). Staging already has
  it.
- **iOS 15.0 to 16.3.** The current site never starts there (Next 16 targets
  Safari 16.4: class static blocks fail with a `SyntaxError`), yet the app's
  minimum iOS is 15.0. iOS 15 also refuses WebAssembly
  under the CSP. Either transpile the site for older Safari or raise the
  app's minimum and show an update notice. Not changed by these PRs.

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
- 6529 Mobile in-app (6529-core-mobile#27, production site; runs
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

1. Phone: a debug build of 6529 Mobile with `server.url` set to
   `https://staging.6529.io` (the shell ships with 6529.io; the CI check in
   6529-core-mobile#27 shows how to patch it for a test build), then pass
   the staging access gate. Desktop: a 6529-core test build (`BACKEND_TARGET
test`, needs `STAGING_API_KEY`), then the staging Team Login. Sign in.
2. Open a wave and select **Turn on** in the signed-messages notice. The
   wallet shows one typed-data request ("6529 Device Grant") with the
   statement above. Approve.
3. Post a drop. It shows **Signed by its author**; open **Signature** and
   check "Signed by its author" with your wallet. Preferences > Devices lists
   the app (for example "6529 app on iPhone").
4. Open `/messages/encrypted`. The device is already on (no second prompt).
   Start a chat with a second account on the website and exchange messages
   both ways.
5. Desktop only: with the window unfocused, have the other account send a
   message. A "New encrypted message" notification appears; selecting it
   opens that chat.
6. Revoke the app's grant in Devices. Encrypted messages stop on that app too.
7. Repeat steps 1 to 4 with a WalletConnect wallet on the phone.
