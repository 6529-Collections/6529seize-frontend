# Artist Artwork Alerts

## Overview

Use **Profile actions → Artwork alerts** on an artist’s profile to be notified
when they submit new artwork to **The Memes – Main Stage**. The menu shows
**On** with a check mark when enabled, or **Off**. This preference is separate from following the artist in your feed.

## Location in the Site

- Another identity’s profile, inside **Profile actions** beside **Follow**.
- New alerts appear in [Notifications](feature-notifications-feed.md), where the
  **Artwork alerts** filter shows these rows.

## Entry Points

Open the artist’s profile from a submission, search result, or profile link.

## User Journey

1. Sign in with your own profile and open the artist’s profile.
2. Open **Profile actions** and select **Artwork alerts**. Wait for the saved-state confirmation.
3. New Main Stage submissions by that artist can appear in Notifications.
4. Open the artwork title in the notification to view the specific submission.
5. Open **Profile actions** and select **Artwork alerts** again to turn future alerts off.

## Common Scenarios

- You can enable alerts without following. Following, unfollowing, enabling
  alerts, and disabling alerts each leave the other preference unchanged.
- Existing followers start with artwork alerts off.
- Enabling alerts does not send notifications for older submissions.
- Untitled submissions use **untitled artwork** as the notification link.
- Your saved choice remains after reopening the profile. Each connected profile
  has its own preferences.

## Edge Cases

- Signed-out viewers can start sign-in from the control, then select it again to
  opt in. Proxy profiles cannot manage artwork alerts.
- Only Main Stage submissions qualify. Chat, other competitions, proposals,
  curation, comments, votes, reactions, and edits do not trigger artwork alerts.
- A new dedicated resubmission can qualify as a new entry; retrying the same
  submission does not create duplicate alerts.
- Anonymous entries never trigger artist-specific alerts, including when an
  entry later reveals its artist.
- Private-wave access, artist and wave mutes, blocks, and moderation still
  apply. An unavailable or withdrawn submission may disappear from notifications.
- A blocked artist cannot be newly enabled; existing alerts can be turned off.

## Failure and Recovery

The control is disabled while loading or saving. If loading fails, select
**Retry artwork alerts**. If saving fails, an error appears and the saved state
is checked again before another toggle is offered.

## Limitations / Notes

Profile notification preferences still apply, including **Essential only** and
**Direct messages and wave activity**. App push additionally requires device
permission and the existing **Wave Invites** push setting. Turning off artwork
alerts stops future delivery; it does not change Follow or erase notification
history.

## Related Pages

- [Notifications](README.md)
- [Profile Header Summary](../profiles/navigation/feature-header-summary.md)
- [Profile Privacy and Notification Preferences](feature-profile-preferences.md)
- [Mobile Push Notifications](feature-mobile-push-notifications.md)
