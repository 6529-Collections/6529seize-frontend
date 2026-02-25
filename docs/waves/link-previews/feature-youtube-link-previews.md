# Wave Drop YouTube Link Previews

## Overview

Wave drop markdown renders supported YouTube links as inline preview cards
instead of plain URL text. The preview card shows a thumbnail, video title, and
channel name, with a play action that swaps the thumbnail for an inline player.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Any drop-card context that uses the shared wave markdown renderer

## Entry Points

- Open a drop that contains a supported YouTube URL.
- Paste a supported YouTube URL in a drop and view it after publishing.
- Open shared drop links that include a YouTube URL in markdown content.

## User Journey

1. Open a wave or direct-message thread with a YouTube URL in drop text.
2. The URL renders as a preview card frame while metadata loads.
3. The card updates to show thumbnail, title, and channel once metadata is
   available.
4. Select the preview card play action to load the inline YouTube player.
5. Continue reading the thread with playback inside the same drop card.

## Common Scenarios

- Supported URLs render previews for common formats such as
  `https://youtu.be/{id}`, `https://www.youtube.com/watch?v={id}`,
  `https://www.youtube.com/shorts/{id}`, `https://www.youtube.com/live/{id}`,
  `https://www.youtube.com/embed/{id}`, and
  `https://www.youtube-nocookie.com/embed/{id}` (including YouTube subdomains
  such as `music.youtube.com`).
- Playlist context is preserved when present through `list` and `index`
  parameters.
- In chat contexts that show drop link actions, those actions remain available
  next to the preview card.

## Edge Cases

- Invalid or unsupported YouTube paths stay as regular links instead of preview
  cards.
- Multiple supported YouTube links in the same drop each render their own
  preview card.
- If link previews are hidden for a drop, YouTube URLs render as plain links
  until previews are shown again.

## Failure and Recovery

- While preview data is loading, users see a placeholder card.
- If preview loading fails, the card falls back to an external link state with
  a failure message.
- If preview data is unavailable, the card falls back to an external link state
  that still lets users open the original URL.
- If inline player content cannot be safely embedded, users still get the
  fallback external link and can continue playback on YouTube.

## Limitations / Notes

- Inline playback starts only after explicit user interaction on the preview.
- Preview availability depends on YouTube metadata responses and network
  conditions.
- This page covers drop markdown rendering in wave-style chat contexts, not
  standalone media pages.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop Twitter/X Link Previews](feature-twitter-link-previews.md)
- [Wave Drop External Link Previews](feature-external-link-previews.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Wave Chat Scroll Behavior](../chat/feature-scroll-behavior.md)
- [Docs Home](../../README.md)
