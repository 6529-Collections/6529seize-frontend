# Open Data

Open Data is the tools section for downloadable dataset pages used for
community/community-report style analysis.

## Overview

- `/open-data` is a hub that routes users to current data download pages.
- Network Metrics, Rememes, Team, Royalties, and Meme Subscriptions are grouped
  here.

## Features

- [Open Data Hub](feature-open-data-hub.md)
- [Consolidated Network Metrics Downloads](feature-network-metrics-downloads.md)
- [Team Downloads](feature-team-downloads.md)
- [Meme Subscriptions](feature-meme-subscriptions.md)
- [Royalties Uploads](feature-royalties-uploads.md)
- [Rememes](feature-rememes-uploads.md)

## Flows

- Open `/open-data` and choose the target card to reach the matching route.
- Open a specific route directly for quick return (`/open-data/network-metrics`,
  `/open-data/meme-subscriptions`, `/open-data/rememes`, `/open-data/team`,
  `/open-data/royalties`).

## Troubleshooting

- Error messages appear inline as `Failed to load community downloads. Please try
  again.` when fetches fail.
- Empty or missing content uses the shared `Nothing here yet` state.
- Pagination is shown only when export count is above one page.

## Related Areas

- [Docs Home](../README.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Network Index](../network/README.md)
