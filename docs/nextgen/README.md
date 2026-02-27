# NextGen

## Overview

- Use this area for the `/nextgen` route family.
- Core browsing routes: `/nextgen` and `/nextgen/{collections|artists|about}`.
- Collection routes: `/nextgen/collection/{collection}`,
  `/nextgen/collection/{collection}/{overview|about|provenance|trait-sets}`,
  `/nextgen/collection/{collection}/art`,
  `/nextgen/collection/{collection}/mint`, and
  `/nextgen/collection/{collection}/distribution-plan`.
- Token routes: `/nextgen/token/{token}` and
  `/nextgen/token/{token}/{provenance|display-center|rarity}`.
- Admin route: `/nextgen/manager` (wallet and role-gated actions).
- Each linked page below owns one user-facing behavior slice.

## Features

- [NextGen Home Views and Navigation](feature-nextgen-home-views-and-navigation.md):
  `/nextgen` featured view, tab views, and fallback behavior for unknown views.
- [NextGen Collection Routes and Art Browser](feature-nextgen-collection-routes-and-art-browser.md):
  collection overview tabs, `/art`, and `/trait-sets` route behavior.
- [NextGen Collection Slideshow](feature-collection-slideshow.md):
  slideshow behavior on featured and collection surfaces.
- [NextGen Mint and Distribution Plan](feature-nextgen-mint-and-distribution-plan.md):
  mint and distribution-plan routes, actions, and states.
- [NextGen Token Media Rendering](feature-token-media-rendering.md):
  token media views, token-route tabs, and media fallback behavior.
- [NextGen Admin Console Access and Actions](feature-nextgen-admin-console.md):
  wallet connect state, `focus` workspace routing, and permission-based action
  visibility on `/nextgen/manager`.

## Flows

- [NextGen Collection and Token Media Flow](flow-nextgen-collection-and-token-media.md):
  end-to-end path from featured discovery to collection and token actions.

## Troubleshooting

- [NextGen Slideshow and Token Media Troubleshooting](troubleshooting-nextgen-slideshow-and-token-media.md):
  recovery steps for slideshow loading, token media, and token-route view issues.
- [NextGen Routes, Mint, and Admin Troubleshooting](troubleshooting-nextgen-routes-mint-and-admin.md):
  recovery for route resolution, mint/distribution actions, and admin access.

## Stubs

- None.

## Related Areas

- [Docs Home](../README.md)
- [Navigation Index](../navigation/README.md)
- [Media Index](../media/README.md)
- [Realtime Index](../realtime/README.md)
- [Delegation Index](../delegation/README.md)
