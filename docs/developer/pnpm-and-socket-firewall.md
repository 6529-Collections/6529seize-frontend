# pnpm and Socket Firewall Guide

## What changed

This repository now treats `pnpm` as the only supported project package
manager. The pinned version is declared in [`package.json`](../../package.json)
through the `packageManager` field and is activated with Corepack.

Project dependency installs are expected to go through the repo wrapper, which
in turn runs Socket Firewall Free in wrapper mode.

The supported entrypoint is the repo-local `6529` command:

```bash
6529 bootstrap
6529 install
6529 install:frozen
6529 install:prod
6529 dev
6529 build
6529 approve-builds
6529 staging
6529 test
6529 lint
```

Plain `pnpm install` and direct package-manager script execution are intentionally rejected by the repo guard.

If you use the repo's `.envrc`, the local `bin/` directory is added to `PATH`
so the `6529` shorthand commands above work directly inside the repository.

## Local setup

Run these once on a fresh clone:

```bash
npm install --global sfw
corepack enable pnpm
corepack prepare pnpm@10.33.0 --activate
./bin/6529 bootstrap
```

`./bin/6529 bootstrap` is the only time you ever type the explicit path. It
installs a global `6529` shim and adds it to your shell's PATH. Open a new
shell after running it, or activate it immediately in the current shell:

```bash
source <(./bin/6529 bootstrap --print-export)
```

Then install dependencies:

```bash
6529 install
```

From this point on, always use the bare `6529` command — never `./bin/6529`.

For staging refreshes from a fresh clone, use the repo-local wrapper path
explicitly:

```bash
./bin/6529 staging
```

## Day-to-day commands

PM2 should launch the app through the repo wrapper:

```bash
pm2 start ./bin/6529 --name=6529seize -- start
```

If pnpm reports ignored install/build scripts, use:

```bash
6529 approve-builds
```

## Guardrails in this repo

- [`package.json`](../../package.json) pins `pnpm@10.33.0`.
- [`package.json`](../../package.json) has a `preinstall` guard that rejects `npm`, `yarn`, and insecure `pnpm install`.
- [`scripts/require-6529-command.cjs`](../../scripts/require-6529-command.cjs) rejects repo script execution unless it came through `6529`.
- [`scripts/assert-no-package-lock.cjs`](../../scripts/assert-no-package-lock.cjs) fails if `package-lock.json` reappears.
- Helper scripts, Playwright, worktree tooling, staging scripts, and PM2 docs now use pnpm.
- Production CI builds the Elastic Beanstalk bundle with pnpm and bundles `node_modules`, so EB does not fall back to its default `npm install` behavior.

## Elastic Beanstalk deployment model

The production workflow now:

1. Installs the repo-pinned pnpm version in CI.
2. Installs dependencies through `sfw pnpm install --frozen-lockfile`.
   In CI, the workflow passes the Socket action's absolute `firewall-path-binary`
   output as `SFW_BIN` so the secure install wrapper does not rely on PATH lookup.
3. Builds the app.
4. Prunes to production dependencies.
5. Packages the app together with the pnpm-generated `node_modules`.

At deploy time, Elastic Beanstalk starts the already-built app directly through
[`scripts/start-next.cjs`](../../scripts/start-next.cjs). The deployment bundle
includes `node_modules`, and
[`runtime-bundle.config`](../../.ebextensions/runtime-bundle.config) verifies
that the runtime bundle is present on the instance.

## Socket Firewall Free limitations

Socket Firewall Free is still wrapper mode. That means:

- It only protects commands that are actually prefixed with `sfw`.
- It blocks confirmed malware, but AI-flagged packages may only warn.
- It does not provide true centralized enforcement by itself.
- It does not support private/custom registries in Free mode.
- It cannot block already-cached artifacts when no network request is made.

Because of those limits, the strongest enforcement in this repo comes from:

- standardizing commands on `pnpm`
- rejecting `npm`/`yarn` installs
- making CI the production install authority
- bundling runtime dependencies into the EB artifact

## When Enterprise is needed

Use Socket Firewall Enterprise if you need any of the following:

- centrally managed policy with API-backed configuration
- support for private/custom registries
- configurable behavior for warnings vs blocking
- service/proxy mode so traffic is forced through a managed Socket-controlled path
- org-wide enforcement that does not rely on every user remembering to type `sfw`
