# Public Contract Review

Status verified against current source on 2026-07-26.

## Current fallback

The reusable review shell routes short interface copy through message keys, but
the current route resolves those messages with `DEFAULT_LOCALE`. The versioned
Stream editorial Markdown is maintained as source-locale English and does not
yet have translated content snapshots.

## Source evidence

- `components/public-review/`
- `lib/public-review/streamReviewDefinition.ts`
- `content/public-reviews/6529-stream/versions/`

## Completion criteria

- Resolve the shell from the request or selected supported locale.
- Add supported-locale messages for all review-shell keys.
- Define and implement an explicit locale/version strategy for immutable
  editorial snapshots.
- Verify localized metadata, page navigation, evidence labels, number
  formatting, heading anchors, and accessible names.

Do not remove this record merely because the English source messages have been
moved out of components.
