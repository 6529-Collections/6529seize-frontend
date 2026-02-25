# Profile Identity Statements

## Overview

The `Identity` tab lets a profile publish identity statements and manage how
those statements are shown on the profile.

## Location in the Site

- Route: `/{user}/identity`
- Primary sections:
  - `Consolidated Addresses`
  - `Social Media Accounts`
  - `NFT Accounts`
  - `Contact`
  - `Social Media Verification Posts`

## Entry Points

- Open `/{user}/identity` directly.
- Switch to `Identity` from another profile tab.
- Follow a shared profile link that lands on the identity route.

## User Journey

1. Open a profile on `/{user}/identity`.
2. Review consolidated addresses and existing statements grouped by category.
3. If you are editing your own eligible profile, select `Add`.
4. Choose a statement group, then choose the specific statement type.
   - For `NFT Accounts`, choose from marketplace profiles like `SuperRare`, `Foundation`,
     `OpenSea`, `Art Blocks`, `OnCyber`, `The Line`, `Manifold`, and `Transient`.
5. Enter a value and select `Save`.
6. Use row actions to open (for URL-capable types), copy, or delete statements.

## Common Scenarios

- Read-only profile viewing:
  - Statement lists are visible.
  - Add/delete actions are hidden.
- Profile owner management:
  - Add one statement at a time from the add modal.
  - New NFT account options now include `Manifold` and `Transient` entries, with URL placeholders
    prefilled as `https://manifold.xyz/` and `https://transient.xyz/`.
  - Save to append the statement to its category list.
- URL statement input normalization:
  - If a pasted or typed value starts with repeated `http://` or `https://`
    prefixes, the field keeps a single prefix.
  - The resulting single prefix follows the last repeated protocol in the
    input.
- Statement row actions:
  - `Open` appears for URL-capable statement types, including marketplace types like
    `Manifold` and `Transient`.
  - `Copy` temporarily swaps value text to `Copied!` before restoring.

## Edge Cases

- The add button is available only when all of these are true:
  - you are viewing your own profile
  - no proxy profile is active
  - the profile has a handle
- For non-link statement types (for example `Discord`, `Telegram`, `Email`),
  no `Open` action is shown.
- While using IME composition, the input is not rewritten mid-composition; URL
  prefix normalization applies after composition events finish.
- Empty categories show explicit per-section empty messages (for example `No
  Contact added yet`).

## Failure and Recovery

- Statement loading shows skeleton placeholders until data resolves.
- If statement fetch fails, sections can appear as empty lists without a
  dedicated error panel. Refresh to retry.
- Save/delete actions require successful authentication confirmation.
- If save fails, an error toast is shown and the add modal remains open so the
  user can retry.
- If delete fails, an error toast is shown and the statement remains in place.

## Limitations / Notes

- All statements are optional.
- All statements are fully and permanently public.
- Seize does not connect to social media accounts or verify posts.
- The community rates statement accuracy.

## Related Pages

- [Profiles Index](../README.md)
- [Profile Tabs](../navigation/feature-tabs.md)
- [Profile Tab Content](feature-tab-content.md)
- [Profile Navigation Flow](../navigation/flow-navigation.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
