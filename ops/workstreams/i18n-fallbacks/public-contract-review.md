# Public Contract Review

Status verified against current source on 2026-08-11.

## Current fallback

The reusable review shell, feedback composer, feedback ledger, lifecycle
statuses, validation and connection states, source-range controls, integrity
announcements, accessible names, and keyboard skip actions route interface copy
through `publicReview.*` message keys. The current route resolves those messages
with `DEFAULT_LOCALE`; supported `en-GB`, `fr-FR`, `es-ES`, and `de-DE` locales
fall back to `en-US`.

The current Overview, Artwork Lifecycle, For Artists, Who Can Do What, Metadata,
Scripts, and Dependencies, Where Development Stands, and Community Review
improvements follow the same boundary. Their headings, status labels, list
labels, links, reviewer questions, and plain-language editorial builders are
message-backed, but the review routes do not yet select a request locale and
their source copy exists only in `en-US`.

The immutable Stream editorial Markdown is also maintained as source-locale
English and does not yet have translated content snapshots.

## User impact

Non-source-locale users can use the complete review and feedback workflow, but
see English interface and editorial copy until reviewed translations exist.

## Source evidence

- `components/public-review/`
- `lib/public-review/streamReviewDefinition.ts`
- `services/api/public-review/`
- `content/public-reviews/6529-stream/versions/`

## Completion criteria

- Resolve the shell, composer, and ledger from the request or selected
  supported locale.
- Add reviewed `publicReview.*` entries to each supported locale dictionary.
- Define and implement an explicit locale/version strategy for immutable
  editorial snapshots.
- Verify responsive wrapping, metadata, navigation, evidence labels, feedback
  fields, ledger filters, number/date formatting, heading anchors, accessible
  names, and live announcements.

Owner/follow-up: frontend public-review localization follow-up.

Do not remove this record merely because the English source messages have been
moved out of components.
