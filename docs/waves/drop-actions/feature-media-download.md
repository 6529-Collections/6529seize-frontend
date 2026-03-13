# Wave Drop Media Download

## Overview

Wave drop actions include a media download option in the desktop `More` menu
when a drop has a downloadable media attachment.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Desktop drop action bar: `More` menu on each drop card

## Entry Points

- Open a wave or direct-message thread.
- Hover a drop to reveal actions.
- Select `More` (three-dot button) and look for `Download media`.

## User Journey

1. Open a drop with media in a wave or direct-message thread.
2. Open the drop `More` menu.
3. Select `Download media`.
4. The browser starts downloading the media file using the filename parsed from
   the media URL.
5. If a download is still running when the action is available, selecting it
   again cancels the current transfer.

## Common Scenarios

- Drops with media show `Download media` in the `More` menu.
- Drops without media do not show a download action.
- Download is started directly from the drop without opening the full media
  detail view.

## Edge Cases

- The action is derived from the first media item on the first drop part.
  Additional attachments in the same drop do not get separate download entries.
- If the media URL does not contain a parseable file name and extension, the
  download action is hidden.
- Temporary or text-only drops usually do not show the action because they
  typically do not provide a downloadable media URL.

## Failure and Recovery

- If download start is blocked by the browser/network, the UI does not show a
  dedicated inline error in the drop action menu.
- If a transfer is active, users can retry by reopening `More` and selecting
  the download action again (which cancels/restarts based on current state).

## Limitations / Notes

- This action is currently documented for the desktop drop `More` menu.
- The non-hover long-press menu does not expose a matching `Download media`
  action.
- Download naming depends on the media URL path format.

## Related Pages

- [Waves Index](../README.md)
- [Wave Chat Scroll Behavior](../chat/feature-scroll-behavior.md)
- [Media Index](../../media/README.md)
- [Docs Home](../../README.md)
