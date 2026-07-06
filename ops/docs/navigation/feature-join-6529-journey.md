# Join 6529 Journey

## Summary

`/join-6529` is a product-native onboarding hub for new and returning users. It
explains why someone would join 6529, gives a short path through wallet/profile
setup and Waves, then keeps NFT collection and subscription actions as later
optional steps.

## User State

The page reads the active wallet, wallet authentication, connected profile,
profile image, recent profile drops, Meme Card balances, and upcoming Meme Card
subscription choices.

- No active wallet: the current action connects a wallet.
- Active wallet without valid auth: the current action requests wallet auth.
- Authenticated wallet without profile: the current action opens profile setup.
- Profile without profile image: the profile-image step remains incomplete, but
  it appears after the Waves/message steps and does not block them.
- Profile that opens Waves from the current journey action: the public Waves
  entry step is marked complete from a route-aware client navigation.
- Profile with recent public Wave drop: the first public message step is marked
  complete and the public Waves entry step is also satisfied.
- Established profiles with Wave participation signals, such as wave creator
  state, profile Wave state, or submission/winner history, are treated as
  having already entered Waves and sent a first public message so old users are
  not shown beginner-only pending steps.
- Profiles with Meme Card balances are marked complete for the collection step.
- Profiles with active upcoming Meme Card subscription choices are marked
  complete for the subscription step.
- Profiles that complete the basic setup are directed back to public Waves at
  `/waves` so the complete state keeps the journey focused on exploration.

The first public message check queries recent drops for the connected profile
identity and counts drops in public Waves only when the returned drop author
matches the connected profile. The collection and subscription checks reuse the
existing profile collection and subscription endpoints; there is no separate
Join-progress API endpoint.

## Progress

The journey shows six visible steps:

1. Connect a wallet.
2. Set up your profile.
3. Join a Wave.
4. Participate.
5. Collect.
6. Subscribe.

Logged-out visitors see the marketing timeline without progress chrome. Once a
wallet is connected, the timeline shows a progress bar and per-step badges for
done, next step, and to-do states. The profile-image check remains part of the
current-action panel, but it is not one of the six marketing timeline steps.

## Related Actions

The compact focus area links users to:

- Public Waves at `/waves`.
- The Memes collection at `/the-memes`.
- Profile subscriptions when a profile is available, otherwise the public
  subscription information route.

## Notes

The route is available at `/join-6529`; `/join` redirects there for compatibility.

Join 6529 copy is source-complete in `en-US`. Other supported locales currently
fall back to `en-US` for this surface until full translations are added.
