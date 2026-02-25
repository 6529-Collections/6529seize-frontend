# Profile Tab Content

## Overview

This page tracks user-visible behavior inside each profile tab beyond routing
and navigation.

## Location in the Site

- Profile tabs under `/{user}` and `/{user}/<tab>`

## Entry Points

- Open any profile tab route directly.
- Switch tabs from the profile tab bar.

## Known Behavior

- Shared header behavior for all profile tabs is documented in
  [Profile Header Summary](../navigation/feature-header-summary.md).
- Brain tab behavior is documented in
  [Profile Brain Tab](feature-brain-tab.md).
- Identity-tab behavior that combines Rep and NIC is documented in
  [Profile Identity Tab](feature-identity-tab.md).
- Identity statement behavior is documented in
  [Profile Identity Statements](feature-identity-statements.md).
- Stats, xTDH, Subscriptions, Proxy, Groups, Waves, and Followers each have
  their own dedicated tab view.
- Stats tab behavior is documented in
  [Profile Stats Tab](feature-stats-tab.md).
- Subscriptions tab behavior is documented in
  [Profile Subscriptions Tab](feature-subscriptions-tab.md).
- Collected tab behavior is documented in
  [Profile Collected Tab](feature-collected-tab.md).
- xTDH tab behavior is documented in
  [xTDH Profile Tab](feature-xtdh-tab.md).
- The `xTDH` tab is currently labeled Beta.
- Tab availability can vary by runtime context (feature flags/device/country).

## Not Yet Documented

- TODO: Document proxy-management success/failure flows in the Proxy tab.
- TODO: Document groups membership and setup flows in the Groups tab.
- TODO: Document Waves tab behavior, entry requirements, and fallbacks.
- TODO: Document Followers tab states and interactions.

## Related Pages

- [Profiles Index](../README.md)
- [Profile Header Summary](../navigation/feature-header-summary.md)
- [Profile Brain Tab](feature-brain-tab.md)
- [Profile Identity Tab](feature-identity-tab.md)
- [Profile Identity Statements](feature-identity-statements.md)
- [Profile Tabs](../navigation/feature-tabs.md)
- [Profile Stats Tab](feature-stats-tab.md)
- [Profile Subscriptions Tab](feature-subscriptions-tab.md)
- [Profile Navigation Flow](../navigation/flow-navigation.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
