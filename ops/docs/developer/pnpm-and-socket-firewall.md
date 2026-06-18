# pnpm and Socket Firewall Guide

## What changed

This repository now treats `pnpm` as the only supported project package
manager. The pinned version is declared in [`package.json`](../../../package.json)
through the `packageManager` field and is activated with Corepack.

Project dependency installs are expected to go through the repo wrapper, which
in turn runs Socket Firewall Free in wrapper mode.

The supported entrypoint is the repo-local `6529` command:

```bash
6529 bootstrap
6529 install
6529 install:frozen
6529 install:prod
6529 update
6529 update:all
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
normal local setup. It removes the old managed global shim if one exists,
ensures Socket Firewall is installed with the real npm binary, activates the
repo-pinned pnpm version through Corepack, and adds a repo-scoped shell hook so
`6529` only resolves while you are inside this repository tree. Open a new
shell after running it, or activate it immediately in the current shell:

```bash
source <(./bin/6529 bootstrap --print-export)
```

Then install dependencies:

```bash
6529 install
```

To apply audit fixes, use the same secure wrapper path:

```bash
6529 update
```

For an intentional broader pnpm update, use:

```bash
6529 update:all
```

After bootstrap, prefer the bare `6529` command for day-to-day work while you
are inside this repository. Outside the repo, `6529` should remain unavailable.
The repo-local `./bin/6529` entrypoint is still appropriate for cases like
fresh-clone staging and the PM2 entrypoint below.

For staging refreshes from a fresh clone, use the repo-local wrapper path
explicitly:

```bash
./bin/6529 staging
```

## Day-to-day commands

For a local production-style start from the repo root:

```bash
6529 run start
```

For staging PM2, launch through bash so PM2 does not try to execute the shell
wrapper as JavaScript:

```bash
pm2 start bash --name=6529seize -- -lc 'cd /path/to/repo && ./bin/6529 run start:standalone'
```

If pnpm reports ignored install/build scripts, use:

```bash
6529 approve-builds
```

## GitHub workflow helpers

This repository also includes helper commands in `bin/` for GitHub Actions and
production deploy operations. If the repo `.envrc` is allowed, `bin/` is added
to `PATH` while you are inside this repository.

### `ghruns`

`ghruns` lists recent GitHub Actions runs for this repository:

```bash
ghruns
```

It is scoped to:

```bash
gh run list -R "6529-Collections/6529seize-frontend"
```

In an interactive terminal, `ghruns` opens a live dashboard. It refreshes every
5 seconds, keeps the same repository scope, and accepts the usual
`gh run list` filters such as `--branch`, `--workflow`, `--status`, and `-L`.

Dashboard controls:

- `Up` / `Down` moves through recent runs.
- `Enter` opens `gh run watch` for the highlighted run.
- `r` refreshes immediately.
- `q` quits.

The helper falls back to plain `gh run list` output in non-interactive shells
and when output-formatting flags such as `--json`, `--jq`, or `--template` are
used.

### `ghdeploy`

`ghdeploy` triggers the production deploy workflow for the current branch:

```bash
ghdeploy
```

Run it from the repository root. Before triggering
`.github/workflows/build-upload-deploy-prod.yml`, it checks that:

- the current branch is not detached
- the working tree is fully clean, including no untracked files
- the current branch has an upstream
- the current branch is exactly in sync with its upstream after a fetch

If those checks pass, it asks for confirmation before running the production
workflow against the current branch.

## Guardrails in this repo

- [`package.json`](../../../package.json) pins `pnpm@10.33.0`.
- [`package.json`](../../../package.json) has a `preinstall` guard that rejects `npm`, `yarn`, and insecure `pnpm install`.
- [`scripts/require-6529-command.cjs`](../../../scripts/require-6529-command.cjs) rejects repo script execution unless it came through `6529`.
- [`scripts/assert-no-package-lock.cjs`](../../../scripts/assert-no-package-lock.cjs) fails if `package-lock.json` reappears.
- Helper scripts, Playwright, worktree tooling, staging scripts, and PM2 docs now use pnpm.
- Production CI builds the Elastic Beanstalk bundle with pnpm, uploads
  `/_next/static` assets to S3/CloudFront, and packages a standalone runtime
  bundle for Elastic Beanstalk.

## Elastic Beanstalk deployment model

The production workflow now:

1. Installs the repo-pinned pnpm version in CI.
2. Installs dependencies through `sfw pnpm install --frozen-lockfile`.
   In CI, the workflow passes the Socket action's absolute `firewall-path-binary`
   output as `SFW_BIN` so the secure install wrapper does not rely on PATH lookup.
3. Builds the app.
4. Packages `package.zip` from the standalone build output, including:
   `.next/standalone`, `.next/static`, `public/`, `Procfile`,
   `.ebextensions/`, and `.platform/`.
5. Uploads `target/_next/static` and `package.zip` to S3 under the build
   version path.

At deploy time, [`runtime-bundle.config`](../../../.ebextensions/runtime-bundle.config)
restores the real `package.json`, verifies the standalone runtime bundle, and
Elastic Beanstalk starts the app through the top-level `Procfile`, which runs
`PORT=3001 HOSTNAME=0.0.0.0 node server.js`.

[`01-bypass-eb-npm-install.sh`](../../../.platform/hooks/prebuild/01-bypass-eb-npm-install.sh)
is part of that model. It temporarily swaps in a tiny placeholder
`package.json` so Elastic Beanstalk's default Node platform install step
becomes a no-op. The real `package.json` is restored later in the deploy by
[`runtime-bundle.config`](../../../.ebextensions/runtime-bundle.config).

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
- shipping the standalone runtime bundle directly instead of reconstructing
  runtime dependencies on Elastic Beanstalk

## When Enterprise is needed

Use Socket Firewall Enterprise if you need any of the following:

- centrally managed policy with API-backed configuration
- support for private/custom registries
- configurable behavior for warnings vs blocking
- service/proxy mode so traffic is forced through a managed Socket-controlled path
- org-wide enforcement that does not rely on every user remembering to type `sfw`
