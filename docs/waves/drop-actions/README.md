# Wave Drop Actions

## Overview

Use this subarea for actions on posted drops in wave and direct-message
threads.

### Route coverage

- `/waves/{waveId}`
- `/messages?wave={waveId}`
- Single-drop overlay in current thread route via `?drop={dropId}`

### Ownership

- Owns posted-drop action controls: voting, reactions, boosting, curation,
  open/copy, media download, and mark-as-unread.
- Owns action-entry behavior across desktop `More` menus and touch action menus.
- Owns in-thread drop presentation behaviors tied to actions: content display,
  reply preview rows, quote-link cards, image viewer/scaling, and selection copy.
- Reply composer behavior after selecting `Reply` is owned by
  `Wave Composer`.
- Provider-specific link preview rendering and per-link preview toggles are
  owned by `Wave Link Previews`.

## Features

### Voting, ranking, and curation

- [Wave Drop Vote Slider](feature-vote-slider.md)
- [Wave Drop Vote Summary and Modal](feature-vote-summary-and-modal.md)
- [Wave Drop Reactions and Rating Actions](feature-reactions-and-ratings.md)
- [Wave Drop Boosting](feature-drop-boosting.md)
- [Wave Drop Curation](feature-drop-curation.md)

### Reading, media, and link actions

- [Wave Drop Content Display](feature-content-display.md)
- [Wave Drop Reply Preview Rows](feature-reply-preview-rows.md)
- [Wave Drop Image Viewer and Scaling](feature-image-viewer-and-scaling.md)
- [Wave Drop Open and Copy Links](feature-open-and-copy-links.md)
- [Wave Drop Quote Link Cards](feature-quote-link-cards.md)
- [Wave Drop Selection Copy](feature-selection-copy.md)
- [Wave Drop Media Download](feature-media-download.md)

### Menus and thread-state actions

- [Wave Drop Touch Menu](feature-touch-drop-menu.md)
- [Wave Drop Mark as Unread](feature-mark-as-unread.md)
- [Wave Drop Artist Preview Modal](feature-artist-preview-modal.md)

### Connected behavior (owned in other areas)

- [Wave Drop Edit Mention Preservation](../composer/feature-edit-mention-preservation.md)
- [Wave Drop Link Preview Toggle](../link-previews/feature-link-preview-toggle.md)

## Flows

- [Wave Participation Flow](../flow-wave-participation.md): canonical end-to-end
  wave navigation and interaction flow.

## Troubleshooting

- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md):
  route, jump, and posting recovery guidance.

## Stubs

- None.

## Related Areas

- [Waves Index](../README.md)
- [Wave Chat Index](../chat/README.md)
- [Wave Composer Index](../composer/README.md)
- [Link Previews Index](../link-previews/README.md)
