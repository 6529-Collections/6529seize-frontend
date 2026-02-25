# Wave Drop Google Workspace Link Previews

## Overview

Wave drop markdown renders supported Google Workspace file links as dedicated
Google Docs, Sheets, or Slides cards. These cards show workspace-specific
actions instead of a generic metadata preview.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Any drop-card context that uses the shared wave markdown renderer

## Entry Points

- Open or publish a drop containing a supported `docs.google.com` URL in one of
  these file families:
  - `/document/d/{fileId}/...`
  - `/spreadsheets/d/{fileId}/...`
  - `/presentation/d/{fileId}/...`
- Re-enable previews for a drop where previews are hidden.

## User Journey

1. Open a thread with a supported Google Workspace link.
2. The link resolves into a Docs, Sheets, or Slides card.
3. Review file title and thumbnail (or a product badge fallback).
4. Use `Open in Google ...` to open the file directly.
5. Toggle `View live preview` to expand or collapse the inline preview frame.

## Common Scenarios

- Docs and Slides cards can expose a `Download PDF` action.
- Sheets cards use file-aware preview links and may expose published embed
  behavior when the sheet is shared in a publishable format.
- Repeated previews typically resolve faster during an active session because
  preview responses are cached briefly.

## Edge Cases

- Google URLs outside supported `docs.google.com/.../d/{fileId}` patterns use
  non-specialized link handling.
- If thumbnail loading fails, the card stays functional and shows a product
  badge placeholder.
- If previews are hidden for a drop, Google Workspace links stay plain until
  previews are shown again.

## Failure and Recovery

- If access appears restricted, the card warns that permission may be required
  and still keeps the direct open action.
- If specialized preview parsing fails, the renderer falls back to generic link
  preview or plain-link behavior so the link remains usable.
- Live preview can be closed with the card toggle or `Escape`.

## Limitations / Notes

- Specialized cards only apply to Google Docs/Sheets/Slides file URLs.
- Live preview availability depends on file permissions and Google response
  behavior.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop External Link Previews](feature-external-link-previews.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Docs Home](../../README.md)
