# Artist Artwork Alerts

## Overview

Use **Profile actions → Artwork alerts** on an artist’s profile to be notified
when they submit new artwork to **The Memes – Main Stage**. The menu shows
**On** with a check mark when enabled, or **Off**. This preference is separate from following the artist in your feed.

## Location in the Site

- Another identity’s profile, inside **Profile actions** beside **Follow**.
- New alerts appear in [Notifications](feature-notifications-feed.md), where the
  **Artwork alerts** filter shows these rows.
- The desktop notification panel also shows the artist, artwork title and decision.
  Select the row to open the specific submission in the single-artwork viewer.

For signed-in viewers, the control appears for profiles with an artist activity badge: active Main Stage
submissions, Main Stage wins, or earlier Meme artist credits. If you already have
alerts on, it stays available even without the badge so you can turn them off.
Turning them off then hides the control until the profile has an artist badge again.

## Entry Points

Open the artist’s profile from a submission, search result, or profile link.

## User Journey

1. Sign in with your own profile and open the artist’s profile.
2. Open **Profile actions** and wait for the saved **On** or **Off** state to load. Select **Artwork alerts** and wait for confirmation.
3. New Main Stage submissions by that artist can appear in Notifications.
4. Open the artwork title in the full feed, or the notification panel row, to open the single-artwork viewer directly. Closing the viewer returns to its decision.
5. Open **Profile actions** and select **Artwork alerts** again to turn future alerts off.

## Common Scenarios

- You can enable alerts without following. Following, unfollowing, enabling
  alerts, and disabling alerts each leave the other preference unchanged.
- Existing followers start with artwork alerts off.
- Enabling alerts does not send notifications for older submissions.
- App push alerts also open the single-artwork viewer directly.
- Untitled submissions use **untitled artwork** as the notification link.
- Alerts show an artwork thumbnail in the notification panel and full feed.
  Video and other media use the artist's preview image when available. If there
  is no image or it cannot load, a bell appears instead.
- Your saved choice remains after reopening the profile. Each connected profile
  has its own preferences.

## Edge Cases

- The control appears only after your own-profile session is verified. It stays
  hidden while sign-in is unresolved, when signed out, and when using a proxy.
  An unknown preference is never shown as **Off**. Sign in through the account
  menu first, then reopen **Profile actions** to load your saved choice.
- Only Main Stage submissions qualify. Chat, other decisions, proposals,
  curation, comments, votes, reactions, and edits do not trigger artwork alerts.
- A new dedicated resubmission can qualify as a new entry; retrying the same
  submission does not create duplicate alerts.
- Anonymous entries never trigger artist-specific alerts, including when an
  entry later reveals its artist.
- Private-wave access, artist and wave mutes, blocks, and moderation still
  apply. An unavailable or withdrawn submission may disappear from notifications.
- A blocked artist cannot be newly enabled; existing alerts can be turned off.

## Failure and Recovery

When available, the control is disabled while loading or saving. If loading fails, select
**Artwork alerts** with **Try again**. If saving fails, an error appears and the saved state
is checked again before another toggle is offered. On profiles without an artist
badge, the control appears only once an enabled preference is known; if the
initial request fails, close and reopen **Profile actions** to retry. If there is no actions menu, reopen the profile.

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
