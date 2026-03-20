# Profile Brain Tab Wave Sidebar

## Overview

The `Brain` tab can show a companion wave surface for the viewed profile:

- `Created Waves` on desktop and `Created` in the mobile strip
- `Most Active In` on desktop and `Active In` in the mobile strip

This surface lets users jump from a profile's Brain tab into waves the profile
created, or into the waves where that profile is most active.

## Location in the Site

- Route: `/{user}/brain`
- Desktop: right column beside the Brain feed
- Small screens: horizontal strip above the Brain feed

## Entry Points

- Open `/{user}/brain`.
- On small screens, select the created-waves overflow chip to open the full
  created-waves modal.

## User Journey

1. Open `/{user}/brain`.
2. If created-wave or most-active wave data is available, the companion surface
   appears beside or above the feed.
3. Desktop shows:
   - `Created Waves`: the first created wave plus a `Show N more` toggle when
     more created waves exist
   - `Most Active In`: up to three waves
4. Small screens show `Created` and `Active In` pill rows above the feed.
5. If more created waves exist on small screens, select the overflow chip to
   open `Waves by {profile}`.
6. Select any wave row or pill to open that wave:
   - standard wave: `/waves/{waveId}`
   - direct-message result: `/messages?wave={waveId}`
7. In the created-waves modal, scroll to load more created waves.

## Common Scenarios

- Loading states render skeleton rows or pills before data arrives.
- Wave rows show a wave picture when available, otherwise a wave or chat icon
  fallback.
- Private non-direct-message waves show a lock icon.
- Row metadata shows relative last-drop time plus total drop count; waves
  without drops show `No drops yet`.
- The created-waves modal shows `Loading waves...`, `Showing N wave(s)`,
  `No waves created yet.`, or an inline error message when loading fails.
- The created-waves modal title uses the profile handle when available, or a
  shortened wallet address otherwise.

## Edge Cases

- If both datasets resolve empty, the sidebar or strip is hidden entirely.
- `Created Waves` excludes direct-message threads.
- `Created Waves` resolves authored waves from the profile handle when
  available, then falls back to the resolved profile query or primary wallet.
- `Most Active In` is capped at three items in the inline surface.
- Desktop uses inline expansion for created waves; the mobile overflow chip is
  the Brain tab entry point into the full created-waves modal.

## Failure and Recovery

- If an inline sidebar request fails before any rows load, the affected section
  stays hidden; refresh the page to retry.
- If the created-waves modal request fails, it shows `Unable to load waves
  right now. Please try again.`; close and reopen the modal to retry.
- If the profile route itself cannot be resolved, users see the shared not-found
  screen:
  [Route Error and Not-Found Screens](../../shared/feature-route-error-and-not-found.md)

## Limitations / Notes

- Desktop inline created-waves view shows only one item until expanded, even
  when more authored waves exist.
- The mobile strip surfaces only the first created wave inline, plus up to
  three `Most Active In` items.
- The full modal lists created waves only; it does not provide a full-screen
  `Most Active In` list.

## Related Pages

- [Profiles Index](../README.md)
- [Profiles Tabs Index](README.md)
- [Profile Brain Tab](feature-brain-tab.md)
- [Profile Routes and Tab Visibility](../navigation/feature-tabs.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
- [Waves Index](../../waves/README.md)
