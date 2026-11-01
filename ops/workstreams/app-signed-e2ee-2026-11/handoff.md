# Signed and encrypted messages in the apps: release handoff

Status on 2026-11-01: review-ready PRs; nothing merged to `main`, nothing in
production. For prxt6529 to ship. Live GitHub state overrides this note.

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
3. Desktop: the 6529-core PR (branch `claude/desktop-e2ee-signed`): renderer
   `pull-web`, build flags, stable local port. Re-pull the renderer from
   frontend `main` after step 2 merges, then build the desktop release.
4. Mobile shell: the 6529-core-mobile PR is a CI check only; no store build
   is needed for this feature.

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
  Safari 16.4: class static blocks fail with `SyntaxError: Unexpected token
'{'`), yet the app's minimum iOS is 15.0. iOS 15 also refuses WebAssembly
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
- In-app (the real shells): see the mobile and desktop PRs for simulator,
  emulator and Electron evidence.
- Unit tests in all three repos, including shared app-grant vectors pinned
  identically in the backend and frontend.

Not verified: a real wallet signing an app grant on a physical phone, push
wakes on a physical phone, and a real WalletConnect wallet's typed-data
prompt. These need a person with a wallet; see "How to test".

## How to test (staging)

Staging has app grants on. Use a throwaway wallet with a profile.

1. Phone app pointed at staging, or the desktop app built against the test
   backend. Sign in.
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
