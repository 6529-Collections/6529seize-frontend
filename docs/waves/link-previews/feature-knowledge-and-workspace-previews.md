# Wave Drop Knowledge and Workspace Previews

## Overview

Wave drop markdown renders supported knowledge/workspace URLs as dedicated cards
instead of generic metadata previews.
This page covers Google Workspace (Docs/Sheets/Slides) and Wikimedia targets.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Drop-card contexts using shared markdown preview renderer

## Entry Points

- Open/publish supported Google Workspace URLs on `docs.google.com`:
  - `/document/d/{fileId}`
  - `/spreadsheets/d/{fileId}`
  - `/presentation/d/{fileId}`
- Open/publish supported Wikimedia URLs:
  - `*.wikipedia.org`
  - `commons.wikimedia.org`
  - `upload.wikimedia.org`
  - `wikidata.org`
  - `w.wiki` short links

## User Journey

1. Open a thread with a supported Workspace or Wikimedia URL.
2. Renderer creates provider-specific loading card.
3. Card resolves to file/article/entity-specific layout.
4. Use provider actions to open source destination (Google/Wikimedia).

## Common Scenarios

- Google Docs/Sheets/Slides render dedicated product-aware cards.
- Docs/Slides cards can expose `Download PDF` actions when available.
- Google cards can show thumbnail previews with product-badge fallback.
- Wikimedia cards can resolve article/disambiguation/Commons/Wikidata layouts.
- Wikimedia cards can include language/context chips and source links.
- If previews are hidden for a drop, supported links remain plain until previews are
  re-enabled.

## Edge Cases

- Google URLs outside supported `.../d/{fileId}` patterns use non-specialized
  handling.
- Unsupported Wikimedia namespaces/targets can degrade to unavailable state.
- Sparse upstream metadata can still render partial cards.

## Failure and Recovery

- Access-restricted Google files can display permission warnings while preserving
  direct-open actions.
- If Workspace/Wikimedia parsing fails, renderer falls back to generic preview or
  plain-link behavior.
- If preview fetch fails, users still retain original clickable links.

## Limitations / Notes

- Specialized cards activate only for supported URL families.
- Live preview behavior depends on provider permissions and response formats.

## Related Pages

- [Wave Drop External Link Previews](feature-external-link-previews.md)
- [Wave Drop Social Platform Previews](feature-social-platform-previews.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
