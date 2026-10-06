# Wave Creation Description Step

## Overview

For standalone Chat waves, First post appears beside the name on the first
screen. Click Review wave, then Confirm and create. Rank, Approve, and
subwaves keep a Description step before their final read-only Overview.

## Location in the Site

- Full-page flow: `/waves/create`
- Desktop modal flow: `?create=wave` (same step sequence)
- Step label: `Description`
- Available for `Chat`, `Rank`, and `Approve`

## Step Paths

- Standalone `Chat`: `Start a chat wave` -> `Review`
- Chat subwave: `Setup` -> `Access` -> `Guidelines` -> `Description` -> `Overview`
- Scheduled `Rank`: `Setup` -> `Access` -> `Schedule` -> `Drops` -> `Voting` -> `Outcomes` ->
  `Guidelines` -> `Description` -> `Overview`
- `Perpetual Ranking`: `Setup` -> `Access` -> `Schedule` -> `Drops` -> `Voting` ->
  `Guidelines` -> `Description` -> `Overview`
- `Approve`: `Setup` -> `Access` -> `Schedule` -> `Drops` -> `Voting` -> `Outcomes` ->
  `Guidelines` -> `Description` -> `Overview`

## What You Can Add

- Body (`Drop a post`) up to `25,000` characters
- Optional title (`Add title`) up to `250` characters
- Media upload: `image/*`, `video/*`, `audio/*`, up to `8` files per picker
  selection
- Same editor features as wave drop composer:
  mentions, wave mentions, hashtag/NFT references, markdown, emoji, metadata,
  drag/paste media, and optional storm mode (`Break into storm`)
- Individual `@` mention suggestions use the draft wave's `Visibility`
  group. Public drafts search all profiles; private drafts suggest only profiles
  eligible for the selected visibility group.

## Submit Flow

1. Open `Description`.
2. Add the wave description drop (body, optional title, optional media).
3. Click `Next` to open the final Overview, then `Confirm and create`.
4. Pass auth checks if prompted:
   - no wallet: toast `Please connect your wallet`
   - invalid or expired auth: `Sign in to 6529` modal
5. If no admin group is set, create-wave tries to create and publish a personal
   admin group (`Only {handle}` / `Only Me`) before submit.
6. On success, create-wave opens the new route: `/waves/{waveId}`.
   Your wave is ready includes Copy wave link for inviting people.
   Desktop modal mode closes as route state changes away from `create=wave`.

## Edge Cases

- `Confirm and create` is disabled only while submit is in progress.
- Empty or whitespace-only content blocks review and shows a readable error
  associated with the focused editor. Media can serve as the first post.
  Pending inline image uploads must finish before reviewing.
- Title input stops accepting characters after `250`.
- If admin-group setup fails (for example no primary wallet or group API
  failure), submit stops on `Overview`.

## Failure and Recovery

- If auth is rejected or canceled, complete auth and click `Confirm and create` again.
- If wave create API submit fails, an error toast appears and current edits
  stay in place; retry from `Overview`.
- If media upload fails, return to First post or Description to correct it.
- Saved Drafts recovers text, title, references, and settings for the current
  wallet and profile on this device. Media and attachments must be added again.
  Older drafts contain settings only.
- If admin-group setup fails, fix wallet/group prerequisites and retry.

## Limitations / Notes

- The final `Overview` follows Description. Moving to it and back preserves
  the editor, title, media, and attachments within the open wizard.
- `Description` is always a core editor and has no optional-settings
  disclosure.
- `Description` has no standalone step-validation rules in create-step
  validation.
- `Confirm and create` submits prior step config and the description drop in one
  create-wave request.

## Related Pages

- [Final Overview](feature-final-overview-step.md)

- [Wave Creation Index](README.md)
- [Wave Create Modal Entry Points](feature-modal-entry-points.md)
- [Wave Creation Setup Step](feature-overview-step.md)
- [Wave Creation Guidelines Step](feature-rules-step.md)
- [Wave Creation Outcomes Setup](feature-outcomes-step.md)
- [Wave Drop Composer Metadata Submissions](../composer/feature-metadata-submissions.md)
- [Wave Participation Flow](../flow-wave-participation.md)
- [Docs Home](../../README.md)
