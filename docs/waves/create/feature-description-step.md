# Wave Creation Description Step

## Overview

`Description` is the last user-reachable step in wave creation.
You write the first wave drop here, then click `Complete`.

## Location in the Site

- Full-page flow: `/waves/create`
- Desktop modal flow: `?create=wave` (same step sequence)
- Step label: `Description`
- Available for `Chat` and `Rank`
- `Approve` exists in code paths but is disabled in the type picker

## Step Paths

- `Chat`: `Overview` -> `Groups` -> `Description`
- `Rank`: `Overview` -> `Groups` -> `Dates` -> `Drops` -> `Voting` ->
  `Outcomes` -> `Description`

## What You Can Add

- Body (`Drop a post`) up to `25,000` characters
- Optional title (`Add title`) up to `250` characters
- Media upload: `image/*`, `video/*`, `audio/*`, up to `8` files per picker
  selection
- Same editor features as wave drop composer:
  mentions, wave mentions, hashtag/NFT references, markdown, emoji, metadata,
  drag/paste media, and optional storm mode (`Break into storm`)

## Submit Flow

1. Open `Description`.
2. Add the wave description drop (body, optional title, optional media).
3. Click `Complete`.
4. Pass auth checks if prompted:
   - no wallet: toast `Please connect your wallet`
   - invalid or expired auth: `Sign Authentication Request` modal
5. If no admin group is set, create-wave tries to create and publish a personal
   admin group (`Only {handle}` / `Only Me`) before submit.
6. On success, create-wave opens the new route: `/waves/{waveId}`.
   Desktop modal mode closes as route state changes away from `create=wave`.

## Edge Cases

- `Complete` is disabled only while submit is in progress.
- Empty description content blocks submit and shows the editor content error
  state.
- Title input stops accepting characters after `250`.
- If admin-group setup fails (for example no primary wallet or group API
  failure), submit stops on `Description`.

## Failure and Recovery

- If auth is rejected or canceled, complete auth and click `Complete` again.
- If wave create API submit fails, an error toast appears and current edits
  stay in place; retry from `Description`.
- If media upload fails before API submit, this flow can remain in a loading
  state without a dedicated upload toast; recover by refreshing or reopening
  create-wave, then retry submit.
- If admin-group setup fails, fix wallet/group prerequisites and retry.

## Limitations / Notes

- No separate review step exists after `Description`.
- `Description` has no standalone step-validation rules in create-step
  validation.
- `Complete` submits prior step config and the description drop in one
  create-wave request.

## Related Pages

- [Wave Creation Index](README.md)
- [Wave Create Modal Entry Points](feature-modal-entry-points.md)
- [Wave Creation Overview Step](feature-overview-step.md)
- [Wave Creation Outcomes Setup](feature-outcomes-step.md)
- [Wave Drop Composer Metadata Submissions](../composer/feature-metadata-submissions.md)
- [Wave Participation Flow](../flow-wave-participation.md)
- [Docs Home](../../README.md)
