# Profiles Navigation

## Overview

This subarea owns profile URL navigation under `/{user}`.

It covers:

- canonical handle/wallet redirects and query carry-over
- supported tab routes (`/{user}`, `/{user}/brain`, `/{user}/collected`, `/{user}/xtdh`, `/{user}/stats`, `/{user}/subscriptions`, `/{user}/proxy`)
- hidden-tab fallback to the first visible tab
- legacy aliases (`/{user}/identity`, `/{user}/waves`, `/{user}/groups`, `/{user}/followers`) redirecting to `/{user}`
- shared header behavior and header edit entry points

Tab-specific behavior lives in the Profiles Tabs index (`docs/profiles/tabs/README.md`).

## Features

- [Profile Routes and Tab Visibility](feature-tabs.md)
- [Legacy Profile Route Redirects](feature-legacy-profile-route-redirects.md)
- [Profile Header Summary](feature-header-summary.md)
- [Profile Picture Editing](feature-profile-picture-editing.md)
- [Profile Banner Editing](feature-banner-editing.md)

## Flows

- [Profile Navigation Flow](flow-navigation.md)

## Troubleshooting

- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)

## Stubs

- None.

## Related Areas

- [Profiles Index](../README.md)
- [Profile Tabs Index](../tabs/README.md)
- [Navigation Index](../../navigation/README.md)
- [Shared Index](../../shared/README.md)
