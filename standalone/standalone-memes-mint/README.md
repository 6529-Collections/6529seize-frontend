# Standalone The Memes mint (static export)

This folder builds a **single static mint page** (Next.js `output: "export"`) into `dist/`, suitable for S3 + CloudFront (or any static host).

From the **repository root**, use the npm scripts below (they run `build:env-schema` first, then `scripts/export-mint-page.cjs`). Deploy is manual: run the export script locally (or in CI you wire up yourself), then use `npm run export-mint-page:*:sync` when you want S3 + CloudFront.

## Prerequisites

- Node / npm (same as the main app)
- For deploy steps: [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) configured (`aws configure` or equivalent), with permission for `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket` on the target bucket, and `cloudfront:ListDistributions` + `cloudfront:CreateInvalidation` when using `--sync`

## Prod vs test

Defaults are aligned so **one hostname drives both** the baked-in app URL and the S3 bucket name:

| Mode   | S3 bucket (default)   | `BASE_ENDPOINT` baked into the build |
| ------ | --------------------- | ------------------------------------- |
| Prod   | `thememes.6529.io`    | `https://thememes.6529.io`            |
| Test   | `thememestest.6529.io`| `https://thememestest.6529.io`        |

`next.config.ts` reads `STANDALONE_BASE_ENDPOINT` during `next build`. The export script sets it to `https://<bucket>` so WalletConnect / AppKit `metadata.url` matches the site origin.

The standalone layout mounts a **document-level anchor interceptor**: any normal click on an `http(s)` link opens a **new tab** and never performs in-place navigation in the mint shell. Relative links and same-origin URLs (the mint host) are rewritten to **`https://6529.io`** (`STANDALONE_MAIN_SITE_BASE` in `standalone-memes-mint/src/next.config.ts`). **`BASE_ENDPOINT`** stays the mint origin for WalletConnect / metadata (`STANDALONE_BASE_ENDPOINT` / bucket URL). To opt out for a specific anchor, set `data-standalone-skip-intercept="true"`.

Override buckets only if needed:

- `STANDALONE_S3_BUCKET_PROD`
- `STANDALONE_S3_BUCKET_TEST`

## Versioning

Each export writes
`standalone/standalone-memes-mint/dist/version.json`.

The manifest is generated automatically from:

- `commit`: current `git rev-parse HEAD`
- `build`: if `https://<bucket>/version.json` already exists with the same commit, increment its build number; otherwise start at `1`

That lets you check the deployed standalone build directly via
`https://thememes.6529.io/version.json` or
`https://thememestest.6529.io/version.json`.

## npm scripts

| Command | Build target | S3 sync | CloudFront invalidation |
| ------- | ------------ | ------- | ------------------------ |
| `npm run export-mint-page` | Prod | No | No |
| `npm run export-mint-page:sync` | Prod | Yes | Yes: distribution id from `aws cloudfront list-distributions` with `--query` on `Aliases.Items` containing `thememes.6529.io` (same as bucket hostname) |
| `npm run export-mint-page:test` | Test | No | No |
| `npm run export-mint-page:test:sync` | Test | Yes | Same JMESPath lookup for `thememestest.6529.io` |

### Passing flags manually

npm only forwards script arguments after `--`:

```bash
npm run export-mint-page -- --test --sync
```

Same flags as the Node script: `--test`, `--sync`, `--help`.

## What `--sync` does

1. `aws s3 sync` from `standalone/standalone-memes-mint/dist/` to `s3://<bucket>/` with `--delete` (remote files not present locally are removed).
2. **CloudFront invalidation** `/*`: the script resolves the distribution id the same way as:

   ```bash
   aws cloudfront list-distributions \
     --query "DistributionList.Items[?Aliases.Items[?contains(@, 'thememestest.6529.io')]].Id" \
     --output text
   ```

   The hostname in `contains(...)` is the active bucket name (`thememes.6529.io` or `thememestest.6529.io`). Then it runs `aws cloudfront create-invalidation` for that id (your AWS CLI profile/credentials).

If lookup returns nothing (no alias match, IAM, or the distribution is past the first `list-distributions` page in a huge account), sync still succeeds and invalidation is skipped with a warning. IAM: `cloudfront:ListDistributions` and `cloudfront:CreateInvalidation`.

## Output location

- Build output: `standalone/standalone-memes-mint/dist/`
- Entry: `index.html` (trailing-slash routes)

## Public assets

Only files listed in `scripts/export-mint-page.cjs` (`STANDALONE_PUBLIC_FILES`) are copied from the repo `public/` into the standalone app before build. Add entries there if the mint UI references new root-level static files.

## Help

```bash
node standalone/standalone-memes-mint/scripts/export-mint-page.cjs --help
```
