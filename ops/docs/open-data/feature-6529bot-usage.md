# 6529bot Usage

Parent: [Open Data Index](README.md)

## Overview

`/open-data/6529bot` shows public usage aggregates for the central
`6529reviewbot` GitHub App.

The page fetches the public usage summary from the bot backend on the server
side. Browser clients receive rendered aggregate data only.

## Location in the Site

- Route: `/open-data/6529bot`
- Hub route: `/open-data`
- Sidebar path: `Tools -> Open Data -> 6529bot Usage`

## Data Source

Set these server-side environment variables for deployments that should show
live data:

```text
REVIEWBOT_USAGE_API_BASE_URL=https://reviewbot.6529.io
REVIEWBOT_USAGE_API_PUBLIC_SUMMARY_PATH=/api/public/usage/summary
```

`REVIEWBOT_USAGE_API_PUBLIC_SUMMARY_PATH` is optional. It defaults to the
production bot API path.

## Public Data Contract

The bot backend returns:

- totals for review runs, estimated spend, token usage, and budget skips;
- unique PR count, average spend per review run, and average spend per PR;
- cost analysis for budget skip rate, average tokens per review run, average
  tokens per PR, and the highest-cost visible repository, provider/model, and
  review kind;
- daily aggregates;
- repository aggregates;
- provider/model aggregates;
- review-kind aggregates.

Private or non-allowlisted repository names are collapsed by the bot backend
before the frontend receives the response.

## Empty And Error States

If the bot API base URL is missing, invalid, unavailable, or returns an
unexpected response shape, the route renders an unavailable state. This keeps
local development, previews, and production deploys resilient while the bot API
is being rolled out.

## Security Notes

- The browser never receives Aurora configuration, AWS credentials, GitHub App
  secrets, or provider keys.
- `6529.io` does not query Aurora directly.
- Admin-level usage data belongs behind the existing `6529.io` auth system and
  is handled by the direct-only `/tools/6529bot/admin` route.

## Related Pages

- [Open Data Hub](feature-open-data-hub.md)
- [Open Data Hub to Dataset Routes](flow-open-data-hub-to-download-routes.md)
- [Open Data Routes and Download States](troubleshooting-open-data-routes-and-downloads.md)
- [6529bot Admin](../api-tool/feature-6529bot-admin.md)
