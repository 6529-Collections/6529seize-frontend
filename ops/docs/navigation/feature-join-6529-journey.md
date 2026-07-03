# Join 6529 Onboarding Hub

## Summary

`/join-6529` is a compact onboarding hub for new or returning users who need a
clear way into 6529 product areas. It is intentionally not a large marketing
homepage and does not track a required completion funnel.

## Page Structure

The page contains:

- A compact hero titled `Join 6529`.
- Primary entry paths for:
  - Waves at `/waves`.
  - NFT browsing at `/the-memes`.
  - The Memes subscriptions information at `/about/subscriptions`.
  - Wave creation at `/waves?create=wave`.
- A short "how joining works" flow explaining browse-first behavior, wallet
  connection, profile creation, and acting only when a specific product flow
  allows it.
- Focus sections for Waves, NFTs, and subscriptions.
- FAQ items for wallet, ETH, profile, and browsing questions.

## User Guidance

- Users can browse public surfaces before connecting a wallet.
- Wallet connection is presented as necessary for identity-sensitive actions,
  not as a prerequisite for reading.
- Profile creation is described as the step that unlocks many participation
  surfaces, including eligible Waves.
- NFT and mint language is careful: mint controls depend on active drops,
  phases, wallet state, supply, gas, and eligibility. The page does not promise
  guaranteed mints.
- Subscriptions are described as optional and distinct from general browsing or
  Wave participation.

## Related Actions

The hub links users to:

- `/waves` for public Wave discovery and participation.
- `/waves?create=wave` for web Wave creation.
- `/the-memes` for NFT/media browsing.
- `/the-memes/mint` from the NFTs focus section for the current mint route.
- `/about/subscriptions` for The Memes subscription guidance.

## Notes

The route uses route-local UI only. It does not change navigation, auth, wallet,
Wave creation, minting, or subscription logic.
