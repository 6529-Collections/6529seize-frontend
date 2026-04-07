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
6529 run dev
6529 run build
6529 approve-builds
6529 staging
6529 run test
6529 run lint
```

Plain `pnpm install` and direct package-manager script execution are intentionally rejected by the repo guard. Use `6529 run <script>` for package.json scripts.

If you use the repo's `.envrc`, the local `bin/` directory is added to `PATH`
so the `6529` shorthand commands above work directly inside the repository.

## Local setup

Run these once on a fresh clone:

```bash
./bin/6529 bootstrap
```

`./bin/6529 bootstrap` is usually the only time you need the explicit path for
normal local setup. It installs a global `6529` shim, ensures Socket Firewall
is installed with the real npm binary, activates the repo-pinned pnpm version
through Corepack, and adds the needed paths to your shell's PATH. Open a new
shell after running it, or activate it immediately in the current shell:

```bash
source <(./bin/6529 bootstrap --print-export)
```

Then install dependencies:

```bash
6529 install
```

After bootstrap, prefer the bare `6529` command for day-to-day work. The
repo-local `./bin/6529` entrypoint is still appropriate for cases like
fresh-clone staging and the PM2 entrypoint below.

For staging refreshes from a fresh clone, use the repo-local wrapper path
explicitly:

```bash
./bin/6529 staging
```

## Day-to-day commands

PM2 should launch the app through the repo wrapper:

```bash
pm2 start ./bin/6529 --name=6529seize -- run start
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
- Production CI builds the Elastic Beanstalk bundle with pnpm, uploads
  `/_next/static` assets to S3/CloudFront, and packages the application bundle
  for Elastic Beanstalk while EB installs runtime dependencies with the pinned
  pnpm version on-instance.

## Elastic Beanstalk deployment model

The production workflow now:

1. Installs the repo-pinned pnpm version in CI.
2. Installs dependencies through `sfw pnpm install --frozen-lockfile`.
   In CI, the workflow passes the Socket action's absolute `firewall-path-binary`
   output as `SFW_BIN` so the secure install wrapper does not rely on PATH lookup.
3. Builds the app.
4. Packages `package.zip` from the repo build output, including the built
   `.next/` tree needed at runtime, `public/`, and Elastic Beanstalk config.
5. Uploads `target/_next/static` and `package.zip` to S3 under the build
   version path.

At deploy time, [`runtime-bundle.config`](../../.ebextensions/runtime-bundle.config)
restores the real `package.json`, activates the pinned pnpm version, installs
production dependencies, verifies the runtime bundle, and then Elastic
Beanstalk starts the app through `node scripts/start-next.cjs`.

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
- making CI the build authority for the deployed app bundle
- preserving the built `.next/` runtime files while keeping dependency
  installation pinned and explicit on Elastic Beanstalk

## When Enterprise is needed

Use Socket Firewall Enterprise if you need any of the following:

- centrally managed policy with API-backed configuration
- support for private/custom registries
- configurable behavior for warnings vs blocking
- service/proxy mode so traffic is forced through a managed Socket-controlled path
- org-wide enforcement that does not rely on every user remembering to type `sfw`
