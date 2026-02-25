# Loading Status Indicators

Parent: [Shared Index](README.md)

## Overview

Loading status indicators show users that a request is still in progress and
provide an announcement that screen readers can read without interrupting
current speech.

## Location in the Site

- Profile drop feeds while data is loading or paginating.
- Notifications and wave-outcome lists while requests are pending.
- Other list and panel routes that show the shared spinner loader.

## Entry Points

- Open a route that fetches list content from the server.
- Scroll a paginated list that requests older/newer data.
- Trigger a refresh that temporarily clears or replaces list content.

## User Journey

1. User opens a page or action that needs async data.
2. A spinner appears, usually with context text such as `Loading drops...`.
3. Screen readers receive a polite status announcement for the same loading
   state.
4. When data resolves, the spinner disappears and content/empty/error state
   takes over.

## Common Scenarios

- Initial page hydration shows a centered loading spinner and text.
- Infinite-scroll fetches show loading text such as `Loading more drops...`.
- Notifications initial load uses centered `Loading notifications...` when no
  recent rows are available yet.
- Notifications can keep existing rows visible during background refreshes,
  including cause-filter transitions, without replacing the list with a
  full-page spinner.
- Notifications older-page fetch uses inline
  `Loading older notifications...` near the top of the list.

## Edge Cases

- If visible loading text is intentionally blank, the spinner can render without
  a caption while still keeping a screen-reader loading announcement.
- If a feature provides separate screen-reader copy, assistive technology hears
  that copy even when the visible caption is different.

## Failure and Recovery

- The shared loading indicator does not display failure reason text by itself.
- If a request fails, each owning feature decides whether to show empty state,
  retry behavior, or a feature-specific error view.
- Users can typically retry by refreshing the route or re-triggering the action
  that started the request.

## Limitations / Notes

- Spinner indicators are indeterminate; they do not show percent completion.
- Announcements are polite status updates, not assertive alerts.

## Related Pages

- [Docs Home](../README.md)
- [Profile Brain Tab](../profiles/feature-profile-brain-tab.md)
- [Notifications Feed](../notifications/feature-notifications-feed.md)
- [Wave Chat Scroll Behavior](../waves/chat/feature-scroll-behavior.md)
- [NFT Activity Feed](../realtime/feature-nft-activity-feed.md)
