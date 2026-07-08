# Join 6529 Journey

## Summary

`/join-6529` is a product-native onboarding hub for new and returning users. It
explains why someone would join 6529, gives a short path through wallet/profile
setup and Waves, then keeps participation, collection, and subscription minting
as later optional paths.

## User State

The page reads the active wallet, wallet authentication, and connected profile
to choose a lightweight onboarding state.

- No active wallet: the current action connects a wallet.
- Active wallet without valid auth: the current action requests wallet auth.
- Authenticated wallet without profile: the current action opens profile setup.
- Profiles with a connected profile are treated as logged in and are directed
  back to public Waves at `/waves` so the complete state keeps the journey
  focused on exploration.

The Join page does not add a separate progress API endpoint. It intentionally
keeps progress lightweight and avoids collection, drop, or subscription data
fetches for this onboarding surface.

## Progress

The journey shows five visible steps:

1. Connect a wallet.
2. Set up your profile.
3. Join a Wave.
4. Participate.
5. Collect.

The Collect step includes minting active drops, buying on secondary markets, and
setting up subscription minting for future Meme Cards. Logged-out visitors see
the marketing timeline without progress chrome and the first step highlighted as
the next action. Connected or logged-in users see progress state for the same
timeline.

## Related Actions

The compact focus area links users to:

- The Memes Main Stage Wave at
  `/waves/b6128077-ea78-4dd9-b381-52c4eadb2077?divider=1167698`.
- Public Waves at `/waves`.
- Subscription minting through the current profile's `/{user}/subscriptions`
  route when a profile or wallet identity is available, with
  `/open-data/meme-subscriptions` as the logged-out information fallback.
- Delegation at `/delegation/delegation-center`.
- Public Waves for asking `@help6529`.

## Notes

The route is available at `/join-6529`; `/join` redirects there for compatibility.

Join 6529 copy is source-complete in `en-US`. Other supported locales currently
fall back to `en-US` for this surface until full translations are added.
