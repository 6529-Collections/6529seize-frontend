# Mobile lab

Phone-emulated load measurements of the live site, from stage 0 of the
mobile plan (measure and guard). They approximate a mid-range Android phone
loading 6529.io; they are not measurements of the app's WKWebView or Android
WebView on a real device.

## What it measures

- Chromium in Pixel 7 emulation, 4x CPU slowdown and DevTools "Fast 4G"
  (165 ms round trip, 8.1 Mbit/s down), signed out, `en-US`, UTC.
- For each page (`home` `/`, `waves` `/waves`, `meme` `/the-memes/1`,
  `museum` `/museum`): three cold loads in fresh browser contexts, one warm
  reload in the last context, then 60 seconds left open (idle requests).
- Per load: requests and transfer by type, JavaScript transferred and
  decoded, JavaScript requested before first paint, first paint, largest
  content, blocked time after first paint, JS heap, HTML size and its
  inline React Server Components data.

## Budgets (reported, not enforced)

| Budget                                                    | Limit              |
| --------------------------------------------------------- | ------------------ |
| JavaScript requested before first paint                   | under 300 KB       |
| First-load transfer on the start routes (`home`, `waves`) | under 1.5 MB       |
| Largest content                                           | under 2.5 s        |
| Idle requests                                             | under one a minute |

## Running it

```bash
6529 run lab:mobile --base https://6529.io --out-dir tmp/mobile-lab/prod
6529 run lab:mobile:summary tmp/mobile-lab/prod/results.json
```

Options for `lab:mobile`: `--base` (default `https://6529.io`), `--pages`
(comma-separated keys), `--cold` (3), `--warm` (1), `--idle` seconds (60),
`--cpu` slowdown (4), `--net` (`fast4g` or `slow4g`), `--coverage` (pages
that get an extra warm load with JavaScript coverage) and `--out-dir`.
For `https://staging.6529.io`, set `PLAYWRIGHT_STAGING_ACCESS_CODE` (or
`STAGING_AUTH`); the script sets the staging access cookie from it and never
prints it.

`lab:mobile:summary <results.json> --compare <earlier results.json>` adds a
before/after table.

The `Mobile lab` workflow (`.github/workflows/mobile-lab.yml`) runs after
every successful `Web Deploy - STAGING` and `Web Deploy - PROD` run and on
dispatch, and writes the summary to the job summary with the results as an
artifact. A hosted runner's CPU differs from a developer machine, so compare
numbers from the same kind of machine.

Automatic routing uses the deployment workflow's file path, so a production
run title such as `Production deploy <sha>` does not affect site selection.
Automatic and manual measurements share a concurrency group per target
(`staging` or `production`); an active measurement is never cancelled.

To take a fresh production measurement without redeploying, open **Actions →
Mobile lab → Run workflow**, select `main`, set `target` to `production`, and
leave `pages` at `home,waves,meme,museum` (or choose a subset). Once the trigger
fix is on `main`, this dispatch uses the corrected workflow and measures the
currently deployed site. The equivalent CLI command is:

```bash
gh workflow run mobile-lab.yml --repo 6529-Collections/6529seize-frontend \
  --ref main -f target=production -f pages=home,waves,meme,museum
```

Use a new dispatch to pick up workflow changes; rerunning an old failed run
uses its original workflow revision. Dispatching Mobile lab only measures and
reports; it does not deploy the site or enforce the budgets.
