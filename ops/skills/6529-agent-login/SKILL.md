---
name: 6529-agent-login
description: Manage local 6529 browser-agent test logins for this repo without committing wallet secrets. Use when Codex needs to claim or create a local test wallet, log a local 6529 dev-server browser session in or out, switch between seeded QA accounts, or inject 6529 wallet auth state for Playwright, Chrome, or the Codex in-app Browser.
---

# 6529 Agent Login

## Overview

Use this skill to log browser agents into a local 6529 frontend without adding
wallet code to the app. The helper script keeps test wallet keys outside the
repo by default, performs the normal session-v2 API login, and emits either a
Playwright storage-state file, browser JavaScript, or a JSON payload for the
development-only `/tools/agent-login` bridge route.

Do not use this for production accounts unless the user explicitly provides a
dedicated test key. Do not commit account pool files, private keys, emitted JSON
payloads, storage-state files, cookies, access tokens, or generated login
scripts.

## Helper

From the repository root, use:

```bash
node ops/skills/6529-agent-login/scripts/agent-login.mjs <command>
```

The helper defaults to:

- account pool: `~/.codex/6529-agent-login/accounts.json`
- repo env source: current working directory, or `--repo /path/to/6529seize-frontend`
- API endpoint: `API_ENDPOINT` from repo `.env`, or `--api https://...`
- local browser origin for storage-state output: `BASE_ENDPOINT`, or `http://localhost:3001`

The helper resolves `ethers` from the repo's `node_modules`; pass `--repo` when
running outside the frontend repo.

Use `--state /path/to/accounts.json` only for a developer-local account pool.
Never point `--state` at a tracked file.

## Account Pool

List accounts:

```bash
node ops/skills/6529-agent-login/scripts/agent-login.mjs list
```

Create a throwaway wallet:

```bash
node ops/skills/6529-agent-login/scripts/agent-login.mjs create --id agent-a --label "Agent A"
```

Import a seeded test account:

```bash
node ops/skills/6529-agent-login/scripts/agent-login.mjs import --id seeded-a --private-key 0x...
```

Claim an account for one thread:

```bash
node ops/skills/6529-agent-login/scripts/agent-login.mjs claim --client-id thread-a --id seeded-a
```

Use a stable `--client-id` per Codex thread. This makes parallel threads avoid
claiming the same account.

## Browser Login

Start or locate a local 6529 dev server first. Then run:

```bash
node ops/skills/6529-agent-login/scripts/agent-login.mjs login \
  --client-id thread-a \
  --id seeded-a \
  --base-url http://localhost:3001 \
  --format storage-state \
  > /tmp/6529-agent-storage-state.json
```

Use that file as a Playwright browser context storage state. It writes:

- `wallet-auth` cookie
- `6529-wallet-accounts`
- `6529-wallet-active-address`
- `6529-wallet-address`
- `6529-agent-login-active-address`
- role keys when present

It follows the storage shape used by `services/auth/auth.utils.ts`.

For an already-open browser page that supports page JavaScript with real
`localStorage` and `document.cookie`, emit a script instead:

```bash
node ops/skills/6529-agent-login/scripts/agent-login.mjs login \
  --client-id thread-a \
  --id seeded-a \
  --format browser-script \
  > /tmp/6529-agent-login.js
```

Evaluate the generated script in the page and reload. This works with normal
Playwright or Chrome automation contexts that expose browser storage APIs.

## Codex In-App Browser Login

The Codex in-app Browser cannot directly evaluate scripts that write
`localStorage` and `document.cookie`. When the local repo includes the
development-only bridge route, use `http://localhost:3001/tools/agent-login`
instead.

Generate a JSON payload:

```bash
node ops/skills/6529-agent-login/scripts/agent-login.mjs login \
  --client-id thread-a \
  --id seeded-a \
  --format json \
  > /tmp/6529-agent-login.json
```

Open `/tools/agent-login` in the in-app Browser, paste the JSON into the
`Login payload` textarea, and click `Apply`. The page writes the same wallet
auth cookie and localStorage keys as the helper's browser script, marks the
active account as agent-owned for the local bridge, then redirects home. Return
to `/tools/agent-login` to see the active short wallet address or click
`Logout`.

Throwaway wallets authenticate but may not have a 6529 profile or role, so some
profile-only UI can still ask for setup or signing. Use seeded accounts with
profiles for normal logged-in product QA.

For production or staging 6529 APIs, the helper automatically sends the
first-party `Origin` header required by wallet auth. Override with `--origin`
only when a different API requires it.

## Logout

Generate and evaluate a logout script, then reload:

```bash
node ops/skills/6529-agent-login/scripts/agent-login.mjs logout \
  --format browser-script \
  > /tmp/6529-agent-logout.js
```

For the in-app Browser, open `/tools/agent-login` and click `Logout`.

## Switching Accounts

Switch by logging in with another claimed account and evaluating the new browser
script:

```bash
node ops/skills/6529-agent-login/scripts/agent-login.mjs login \
  --client-id thread-a \
  --id seeded-b \
  --format browser-script \
  > /tmp/6529-agent-login.js
```

Reload after injection so React Query and auth providers restart from the new
active wallet state.

## Local Secret Storage

The shared skill and helper live in the repo. Wallet material does not.

Preferred local account pool:

```text
~/.codex/6529-agent-login/accounts.json
```

This path survives worktree changes and branch switches while staying outside
Git. If a developer chooses a repo-local account pool for temporary work, keep
it under `.codex/` or pass `--state`, and confirm it is ignored before adding
files.

## Limits

This bypasses the wallet connect modal. It is good for app QA after login. It is
not a test of MetaMask, Reown/AppKit wallet selection, or signature modal UX.
