# 6529SEIZE-FRONTEND

## Repo Helpers

This repo includes a `.envrc` for `direnv`.

It is only used for repo-local shell helpers. Right now it adds the repo `bin/` directory to your `PATH`, which makes commands like `ghruns` and `ghdeploy` available anywhere inside this repository.

It does not load `.env.local` and it does not set `NODE_ENV`.

### Setup direnv

1. Install `direnv` on your machine.
2. Enable the `direnv` shell hook.

For `zsh`, add this to `~/.zshrc`:

```bash
eval "$(direnv hook zsh)"
```

For `bash`, add this to `~/.bashrc`:

```bash
eval "$(direnv hook bash)"
```

Then reload your shell config, for example:

```bash
source ~/.zshrc
```

### Allow this repo

From the repo root, run:

```bash
direnv allow
```

If `.envrc` changes later, run:

```bash
direnv allow
```

again to approve the updated file.

### Verify

From the repo root, you should be able to run:

```bash
which ghruns
ghruns
```

`ghruns` is a shortcut for:

```bash
gh run list -R "6529-Collections/6529seize-frontend"
```

In an interactive terminal, `ghruns` opens a live dashboard instead of printing a one-time snapshot. It refreshes automatically every 5 seconds, keeps the same repo scope, and still accepts the usual `gh run list` filters like `--branch`, `--workflow`, `--status`, and `-L`.

`ghruns` controls:

- `Up` / `Down` moves through the recent runs
- `Enter` opens `gh run watch` for the highlighted run
- `r` refreshes immediately
- `q` quits

The dashboard falls back to plain `gh run list` output in non-interactive shells and when you use output-formatting flags like `--json`, `--jq`, or `--template`.

### Deploy Helper

`ghdeploy` only works from the repo root.

From the repo root, run:

```bash
ghdeploy
```

Before it triggers the production deploy workflow, it checks that:

- the current branch is not detached
- the working tree is fully clean, including no untracked files
- the current branch has an upstream
- the current branch is exactly in sync with its upstream after a fetch

If those checks pass, it asks:

```text
Are you sure you want to deploy <branch-name> to production?
```

If you confirm, it triggers the production workflow from `.github/workflows/build-upload-deploy-prod.yml` against your current branch.

PORT: 3000

### Documentation

User-facing documentation lives in [`docs/README.md`](docs/README.md).

### Install

```
npm i
```

### Build

```
npm run build
```

### Environment

To run the project you need a .env file.

[Sample .env file](https://github.com/6529-Collections/6529seize-frontend/tree/main/.env.sample)

### Pepe.wtf previews

The chat now renders cards for pepe.wtf assets, collections, artists and sets.
Environment variables (with defaults) allow you to tune caching and IPFS
gateway usage:

- `PEPE_CACHE_TTL_MINUTES` (default `10`)
- `PEPE_CACHE_MAX_ITEMS` (default `500`)
- `IPFS_GATEWAY` (default `https://ipfs.io/ipfs/`)

To test end-to-end:

1. Run `npm run dev`.
2. Paste any pepe.wtf link in chat, for example `https://pepe.wtf/asset/GOXPEPE`
   or `https://pepe.wtf/artists/Easy-B`, and confirm the preview renders with
   imagery and stats.
3. Re-run the same link and confirm the network response for
   `/api/pepe/resolve` includes the header `X-Cache: HIT`.

### Run

- Locally

```
npm run dev
```

- Production

```
npm run start
```

### RUN USING PM2

```
pm2 start npm --name=6529seize -- run start
```

## Directory Structure

All application routes now live under Next.js’s `app/` router.
The legacy `pages/` directory has been fully migrated, so create any new routes
inside `app/`.

Pages inside `app/` must define a `generateMetadata` function that returns the
result of `getAppMetadata`:

```ts
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "My Page" });
}
```

This ensures consistent SEO metadata across routes.
