# pnpm and Socket Firewall Guide

## What changed

This repository now treats `pnpm` as the only supported project package
manager. The pinned version is declared in [`package.json`](/Users/ppan/Desktop/6529git/6529seize-frontend/package.json) through the `packageManager` field and is activated with Corepack.

Project dependency installs are expected to go through the repo wrapper, which
in turn runs Socket Firewall Free in wrapper mode.

The supported entrypoint is the repo-local `6529` command:

```bash
6529 install
6529 install:frozen
6529 install:prod
6529 dev
6529 build
6529 test
6529 lint
```

Plain `pnpm install` and direct package-manager script execution are intentionally rejected by the repo guard.

If you use the repo's `.envrc`, the local `bin/` directory is added to `PATH`
and you can use the shorthand wrapper:

```bash
6529 install
6529 install:frozen
6529 install:prod
6529 dev
6529 build
```

## Local setup

Bootstrap the toolchain once:

```bash
npm install --global corepack@latest sfw
corepack enable pnpm
corepack prepare pnpm@10.27.0 --activate
```

Install dependencies through the secure path:

```bash
6529 install
```

## Day-to-day commands

PM2 should launch the app through pnpm as well:

```bash
pm2 start ./bin/6529 --name=6529seize -- start
```

## Guardrails in this repo

- [`package.json`](/Users/ppan/Desktop/6529git/6529seize-frontend/package.json) pins `pnpm@10.27.0`.
- [`package.json`](/Users/ppan/Desktop/6529git/6529seize-frontend/package.json) has a `preinstall` guard that rejects `npm`, `yarn`, and insecure `pnpm install`.
- [`scripts/require-6529-command.cjs`](/Users/ppan/Desktop/6529git/6529seize-frontend/scripts/require-6529-command.cjs) rejects repo script execution unless it came through `6529`.
- [`scripts/assert-no-package-lock.cjs`](/Users/ppan/Desktop/6529git/6529seize-frontend/scripts/assert-no-package-lock.cjs) fails if `package-lock.json` reappears.
- Helper scripts, Playwright, worktree tooling, staging scripts, and PM2 docs now use pnpm.
- Production CI builds the Elastic Beanstalk bundle with pnpm and bundles `node_modules`, so EB does not fall back to its default `npm install` behavior.

## Elastic Beanstalk deployment model

The production workflow now:

1. Activates the pinned pnpm version with Corepack.
2. Installs dependencies through `sfw pnpm install --frozen-lockfile`.
3. Builds the app.
4. Prunes to production dependencies.
5. Packages the app together with the pnpm-generated `node_modules`.

At deploy time, Elastic Beanstalk only needs pnpm available for the start
command. [`Procfile`](/Users/ppan/Desktop/6529git/6529seize-frontend/Procfile)
uses `pnpm start`, and [`pnpm.config`](/Users/ppan/Desktop/6529git/6529seize-frontend/.ebextensions/pnpm.config) activates the pinned pnpm version with Corepack and verifies that bundled runtime dependencies are present.

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
