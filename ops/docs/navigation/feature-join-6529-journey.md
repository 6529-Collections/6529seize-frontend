# Join 6529 Journey

## Summary

`/join-6529` is a state-aware onboarding and acquisition route. It gives users
a short journey through the minimum useful setup path instead of a static block
of instructions.

## User State

The page reads the active wallet, wallet authentication, connected profile,
profile image, and recent profile drops.

- No active wallet: the current action connects a wallet.
- Active wallet without valid auth: the current action requests wallet auth.
- Authenticated wallet without profile: the current action opens profile setup.
- Profile without profile image: the profile-image step remains incomplete, but
  it appears after the Waves/message steps and does not block them.
- Profile that opens Waves from the current journey action: the public Waves
  entry step is marked complete from a route-aware client navigation.
- Profile with recent public Wave drop: the first public message step is marked
  complete and the public Waves entry step is also satisfied.
- Established profiles with existing 6529 activity, such as wave creator state,
  REP/CIC/TDH/xTDH, level, or submission/winner history, are treated as having
  already entered Waves and sent a first public message so old users are not
  shown beginner-only pending steps.

The first public message check queries recent drops for the connected profile
identity and counts drops in public Waves only when the returned drop author
matches the connected profile. If that check fails, the page keeps the message
step open and leaves the rest of the guide available.

## Progress

The journey shows five visible steps:

1. Connect wallet.
2. Create profile.
3. Enter public Waves.
4. Send first public message.
5. Add profile image.

Progress is a simple completed count over those five steps. The profile-image
step is not a gate, but it is still incomplete until the user uploads an image.

## Related Actions

The "Things to do next" area links users to:

- Public Waves at `/waves`.
- Create Wave on web at `/waves?create=wave`.
- Profile subscriptions when a profile is available, otherwise
  `/open-data/meme-subscriptions`.
- Delegation Center at `/delegation/delegation-center`.

## Notes

The route is intentionally not wired into the main side navigation yet. It can
be visited directly while the navigation placement is decided separately.
