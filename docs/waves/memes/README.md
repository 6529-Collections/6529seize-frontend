# Memes

## Overview

Use this area for Memes-wave artwork submission and for the submission metadata
shown on memes single-drop views after submit.

## Route and Surface Coverage

- Wave thread route: `/waves/{waveId}`
- Desktop memes header action (non-compact header mode):
  `Submit Work to The Memes` (label can vary with deadline state; compact
  desktop widths can use shorter labels such as `Submit Work`)
- Mobile leaderboard header action: `Drop`
- Mobile chat view: floating submit button (`+`, top-right)
- Memes single-drop route: `/waves/{waveId}?drop={dropId}` with post-submit
  metadata sections

## Ownership

This area owns:

- modal workflow (`Agreement -> Artwork -> Additional Information -> Preview`)
- artwork source selection (`Upload File` or `Interactive HTML`)
- submit/retry states (`uploading`, `signing`, `processing`, `success`,
  `error`)
- Additional Information validation and single-drop rendering (`Technical details`,
  `Preview Image`, `Promo Video`, `Additional Media`, `About the Artist`,
  `Artwork Commentary`)

This area does not own:

- drop-entry eligibility, submission windows, or per-user submission limits.
  These are owned by Wave Leaderboard Drop Entry and Eligibility.

## Features

- [Memes Submission Workflow](feature-memes-submission.md): agreement/artwork
  steps, upload vs interactive source selection, and validation gates.
- [Memes Additional Information Fields](feature-memes-additional-info-fields.md):
  payment, airdrop, allowlist, supplemental media/commentary requirements, and
  single-drop detail rendering.
- [Memes Preview and Submit States](feature-memes-preview-and-submit-states.md):
  preview behavior plus upload/sign/process success and retry states.

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
- [Wave Leaderboard Drop Entry and Eligibility](../leaderboard/feature-drop-entry-and-eligibility.md)
- [Media Index](../../media/README.md)
- [Drop Actions](../drop-actions/README.md)
- [Docs Home](../../README.md)
