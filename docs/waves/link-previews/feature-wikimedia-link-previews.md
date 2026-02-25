# Wave Drop Wikimedia Link Previews

## Overview

Wave drop markdown renders supported Wikimedia links as dedicated Wikimedia
cards instead of generic metadata previews. Depending on the target, the card
can render article, disambiguation, Commons file, or Wikidata layouts.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Any drop-card context that uses the shared wave markdown renderer

## Entry Points

- Open or publish a drop with a supported Wikimedia URL, including:
  - language Wikipedia pages (`*.wikipedia.org`)
  - Wikimedia Commons pages/files (`commons.wikimedia.org`,
    `upload.wikimedia.org`)
  - Wikidata entities (`wikidata.org`)
  - Wikimedia short links (`w.wiki`)
- Re-enable previews when previews are hidden for a drop.

## User Journey

1. Open a thread with a supported Wikimedia URL.
2. The link renders a Wikimedia loading card.
3. The card resolves into the matched type (article, disambiguation, Commons
   file, or Wikidata entity).
4. Use the source action links to open the canonical Wikimedia destination.

## Common Scenarios

- Article cards show title, description/extract, language badge, and optional
  thumbnail or coordinate context.
- Disambiguation cards show a shortlist of related page options.
- Commons file cards show image/media context with license and attribution
  details when available.
- Wikidata cards show description, key facts, and related sitelinks.

## Edge Cases

- Section anchors on supported pages can appear as section chips in the card.
- Unsupported namespaces or unresolved targets can degrade to an unavailable
  card state.
- If previews are hidden for a drop, Wikimedia links stay plain until previews
  are shown again.

## Failure and Recovery

- While data loads, users see a skeleton placeholder.
- If preview fetch fails, users see an `Unable to load preview` state with a
  direct Wikimedia fallback path.
- If target data cannot be resolved, users see `Preview unavailable` with the
  original link still usable.

## Limitations / Notes

- Dedicated cards activate only for supported Wikimedia host families.
- Card content depends on publicly available Wikimedia metadata and API
  responses.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop External Link Previews](feature-external-link-previews.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Docs Home](../../README.md)
