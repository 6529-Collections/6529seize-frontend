# Minting The Memes Guide

## Overview

- `/about/minting` is the task-first guide for minting The Memes.
- It directs users to regular minting, subscription minting, the current
  schedule, phase information, eligibility guidance, and troubleshooting.
- The guide does not initiate a transaction and does not define the allocation
  policy for a card. The live mint and its published Distribution Plan remain
  the source of truth for current card data.

## Location in the Site

- Route: `/about/minting`
- Navigation path: `About` → `Collections & Minting` → `Minting`

## Entry Points

- Open `/about/minting` directly.
- Open `About`, expand `Collections & Minting`, and select `Minting`.
- Use one of the guide's in-page links to jump to `Mint now`, `How minting
works`, `Eligibility`, or `Help and history`.

## User Journey

1. The user chooses between regular minting and subscription minting.
2. For regular minting, the user opens `/the-memes/mint` or the official
   standalone latest-mint page at `https://thememes.6529.io/`.
3. For subscription minting, the user can connect a profile or manage the
   current profile's subscription and open `/about/subscriptions` for the full
   explanation.
4. The user checks `/meme-calendar` or `@6529collections` for the current
   schedule.
5. The guide explains the possible Phase 0, Phase 1, Phase 2, and public phase
   sequence without hard-coding a current time or price.
6. The user opens the current mint and its Distribution Plan to check the
   destination wallet's eligibility for the active card and phase.
7. If minting fails, the user reviews the short troubleshooting checklist and
   retries from the live mint page.

## Common Scenarios

- **Mint the current card directly:** Select `Mint the latest Meme Card`,
  connect a wallet, select a destination wallet, review the active phase and
  total cost, and choose an edition count.
- **Set up remote minting:** Use the subscription action, then review the
  subscription guide. A subscription uses the same wallet eligibility as the
  regular flow and does not add an allowlist spot.
- **Check when a mint starts:** Open the mint calendar and review current
  announcements. The About page intentionally does not state a fixed weekly
  schedule.
- **Understand the phases:** Review the four phase cards, then use the live mint
  for the active phase and exact card-specific values.
- **Understand the older model:** Expand the February 2023 historical note. It
  is labelled as background and is not presented as current allocation policy.

## Edge Cases

- The subscription profile action changes with authentication state. It asks a
  signed-out user to connect and sends a signed-in profile to its subscription
  settings.
- On iOS outside the United States, the existing product visibility rule can
  hide the interactive subscription profile action. The explanatory guide and
  subscription reference link remain available.
- A card may not yet have published claim or Distribution Plan data. The live
  mint flow owns the associated loading, unavailable, and recovery states.
- A phase can end before a later phase begins. The live mint flow, not the
  About page, reports which phase is active or upcoming.

## Failure and Recovery

- If the user cannot mint, first confirm that a phase is active and that the
  connected wallet is the intended eligible wallet.
- Confirm that the wallet can cover the displayed token price, platform fee,
  and gas.
- If mint or eligibility data is unavailable, refresh and retry after the
  current services recover.
- For detailed transaction, allowlist, and receipt failures, use
  [The Memes Mint Flow](feature-mint-flow.md).

## Limitations / Notes

- The About guide is not a live claim-status surface. It does not promise a
  mint date, price, supply, or wallet allocation.
- Eligibility is card- and phase-specific. Holding an earlier Meme Card does
  not by itself guarantee eligibility for another card.
- The February 2023 text is deliberately bounded and dated historical context.
  Current allocation categories still require a card's published Distribution
  Plan or product-owner confirmation.
- The page's current message source is `en-US`; supported locales use the
  repository's normal English fallback until reviewed translations are added.

## Related Pages

- [The Memes Mint Flow](feature-mint-flow.md)
- [Standalone The Memes Mint Page](feature-standalone-mint-page.md)
- [Memes Minting Calendar](feature-minting-calendar.md)
- [Media Routes and Minting Troubleshooting](../troubleshooting-media-routes-and-minting.md)
- [Media Memes Index](README.md)
- [Docs Home](../../README.md)
