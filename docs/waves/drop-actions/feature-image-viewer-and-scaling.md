# Wave Drop Image Viewer and Scaling

## Overview

Image attachments follow inline card rendering in timeline views, but single-drop
contexts request larger scaled variants for clearer artwork viewing.
Opening an attachment launches a modal image viewer with zoom/fullscreen/open-source
controls.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Single-drop detail surfaces and competition artwork panels.

## Entry Points

- Open a thread with image attachments in drop cards.
- Open single-drop detail view from timeline cards.
- Open artwork-focused panels in competition contexts.

## User Journey

1. Open a thread and locate a drop with image media.
2. Timeline cards load standard scaled image sources for feed performance.
3. Open drop detail or artwork detail panel for clearer media rendering.
4. Single-drop/detail contexts request larger scaled image variants.
5. Open an attachment to launch the modal viewer and use zoom/fullscreen/source
   controls.

## Common Scenarios

- Attachments show loading placeholders while source images resolve.
- Touch devices keep placeholder treatment static to protect gesture scrolling;
  non-touch layouts can show animated pulse placeholders.
- Single-drop detail surfaces favor higher-resolution scaled image variants.
- Modal viewer supports opening source media in a new browser tab.

## Edge Cases

- If fullscreen is entered from the modal, fullscreen targets the modal image, not
  the background timeline card.
- If attachment loads slowly, timeline layout remains stable while placeholder state
  is visible.

## Failure and Recovery

- If a higher-resolution scaled URL is unavailable or fails, viewer falls back to
  the original attachment media URL.
- If modal launch fails due to transient UI state, users can retry from the same
  attachment.

## Limitations / Notes

- Higher-resolution scaling is applied in detail contexts, not default timeline rows.
- Fullscreen behavior depends on browser fullscreen support and permissions.

## Related Pages

- [Wave Drop Content Display](feature-content-display.md)
- [Wave Drop Media Download](feature-media-download.md)
- [Wave Drop Reply Preview Rows](feature-reply-preview-rows.md)
- [Media Index](../../media/README.md)
