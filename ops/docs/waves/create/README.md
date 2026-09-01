# Wave and Direct Message Creation

## Overview

Use this area to create:

- new waves (`Chat`, `Rank`, and `Approve`)
- new direct messages

## Features

### Route and Mode Coverage

- Desktop wave create mode (`create=wave`) can open on:
  `/waves`, `/waves/{waveId}`, `/messages`, or
  `/messages/{waveId}`.
- Use `/waves?create=wave` as the direct web link for creating a Wave.
- Desktop wave-create controls are available on:
  - `/waves` and `/waves/{waveId}` left-sidebar `Waves` section (`+`)
  - `/waves` empty-content placeholder (`Create Wave`)
- Desktop `/messages` routes support wave-create mode by URL only
  (`?create=wave`).
- Desktop direct-message mode (`create=dm`) is supported on `/messages` and
  `/messages/{waveId}`.
- App create routes:
  - wave: `/waves/create`
  - direct message: `/messages/create`
- Success routes:
  - wave: `/waves/{waveId}`
  - direct message: `/messages/{waveId}`
- On desktop, closing create mode removes only `create` and keeps all other
  route/query context.

### Wave Creation Journey

- Entry points: [Wave Create Modal Entry Points](feature-modal-entry-points.md)
- Step pages:
  1. [Wave Creation Overview Step](feature-overview-step.md)
  2. [Wave Creation Group Access and Permissions](feature-groups-step.md)
  3. [Wave Creation Schedule](feature-dates-step.md) (`Rank` and
     `Approve`)
  4. [Wave Creation Drop Settings](feature-drops-step.md) (`Rank` and
     `Approve`)
  5. [Wave Creation Rules Step](feature-rules-step.md)
  6. [Wave Creation Voting Configuration](feature-voting-step.md) (`Rank` and
     `Approve`)
  7. [Wave Creation Outcomes Step](feature-outcomes-step.md) (`Rank` and
     `Approve`)
  8. [Wave Creation Description Step](feature-description-step.md)
- Step path by wave type:
  - `Chat`: `Overview -> Groups -> Rules -> Description`
  - Scheduled `Rank`: `Overview -> Groups -> Schedule -> Drops -> Rules -> Voting -> Outcomes -> Description`
  - `Perpetual Ranking`: `Overview -> Groups -> Schedule -> Drops -> Rules -> Voting -> Description`
  - `Approve`: `Overview -> Groups -> Schedule -> Drops -> Rules -> Voting -> Outcomes -> Description`

The default path keeps the decisions most creators need visible. Less common
customization is available from expandable sections named for their contents,
such as `Submission requirements` or `Vote limits and behavior`. A section
shows `Customized` when saved or restored values differ from the defaults and
opens as `Needs attention` when a hidden field fails validation.

### Direct-Message Journey

- [Direct Message Creation](feature-direct-message-creation.md): identity
  search, recipient selection, and thread creation.

### Access and Availability

- Create forms render only when the connected identity has a profile handle.
- Without a profile handle, Create Wave entry points open a compact profile
  setup dialog with `Go to Identity` and `Not now`; the multi-step form does not
  render.

## Flows

- [Wave Participation Flow](../flow-wave-participation.md): end-to-end wave
  entry, thread participation, and sharing flow.

## Troubleshooting

- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md):
  route, jump, and posting recovery guidance.

## Stubs

- None.

## Related Areas

- [Waves Index](../README.md)
- [Navigation Index](../../navigation/README.md)
