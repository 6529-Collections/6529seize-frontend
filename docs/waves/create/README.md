# Wave and Direct Message Creation

## Overview

Use this area to create:

- new waves (`Chat` and `Rank`)
- new direct messages

`Approve` appears in the wave-type selector but is disabled.

## Features

### Route and Mode Coverage

- Desktop wave create mode (`create=wave`) can open on:
  `/discover`, `/waves`, `/waves/{waveId}`, `/messages`, or
  `/messages?wave={waveId}`.
- Desktop wave-create controls are available on:
  - `/discover` list header (`Create Wave`)
  - `/waves` and `/waves/{waveId}` left-sidebar `Waves` section (`+`)
  - `/waves` empty-content placeholder (`Create Wave`)
- Desktop `/messages` routes support wave-create mode by URL only
  (`?create=wave`).
- Desktop direct-message mode (`create=dm`) is supported on `/discover`,
  `/messages`, and `/messages?wave={waveId}`.
- App create routes:
  - wave: `/waves/create`
  - direct message: `/messages/create`
- Success routes:
  - wave: `/waves/{waveId}`
  - direct message: `/messages?wave={waveId}`
- On desktop, closing create mode removes only `create` and keeps all other
  route/query context.

### Wave Creation Journey

- Entry points: [Wave Create Modal Entry Points](feature-modal-entry-points.md)
- Step pages:
  1. [Wave Creation Overview Step](feature-overview-step.md)
  2. [Wave Creation Group Access and Permissions](feature-groups-step.md)
  3. [Wave Creation Dates and Timeline](feature-dates-step.md) (`Rank` only)
  4. [Wave Creation Drop Settings](feature-drops-step.md) (`Rank` only)
  5. [Wave Creation Voting Configuration](feature-voting-step.md) (`Rank`
     only)
  6. [Wave Creation Outcomes Step](feature-outcomes-step.md) (`Rank` only)
  7. [Wave Creation Description Step](feature-description-step.md)
- Step path by wave type:
  - `Chat`: `Overview -> Groups -> Description`
  - `Rank`: `Overview -> Groups -> Dates -> Drops -> Voting -> Outcomes -> Description`

### Direct-Message Journey

- [Direct Message Creation](feature-direct-message-creation.md): identity
  search, recipient selection, and thread creation.

### Access and Availability

- Create forms render only when a connected profile is available.
- If profile context is missing, create entry points are hidden and create
  forms do not render.

## Flows

- [Wave Participation Flow](../flow-wave-participation.md): end-to-end wave
  discovery, thread participation, and sharing flow.

## Troubleshooting

- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md):
  route, jump, and posting recovery guidance.

## Stubs

- None.

## Related Areas

- [Waves Index](../README.md)
- [Navigation Index](../../navigation/README.md)
- [Groups Index](../../groups/README.md)
