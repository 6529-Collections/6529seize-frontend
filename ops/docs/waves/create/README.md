# Wave and Direct Message Creation

## Overview

For independently managed competitions in a shared wave, see
[Competitions](../competitions/README.md).

Use this area to create:

- new chat waves and subwaves
- new direct messages

## Features

### Route and Mode Coverage

- Desktop wave create mode (`create=wave`) can open on:
  `/waves`, `/waves/{waveId}`, `/messages`, or
  `/messages/{waveId}`.
- Use `/waves?create=wave` as the direct web link for creating a Wave.
- Desktop wave-create controls are available on:
  - `/waves` and `/waves/{waveId}` Waves panel (`Create wave`; plus icon when collapsed)
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
  1. [Wave Creation Setup Step](feature-overview-step.md)
  2. [Wave Creation Group Access and Permissions](feature-groups-step.md)
  3. [Wave Creation Guidelines Step](feature-rules-step.md)
  4. [Wave Creation Description Step](feature-description-step.md)
  5. [Final Overview](feature-final-overview-step.md)
- Standalone waves use `Start a chat wave -> Review`; access, picture, and guidelines are optional settings on the first screen. Subwaves retain the guided sequence.
- Add Rank or Approve competitions afterward through [competition setup](../competitions/feature-manage-competitions.md). Each competition owns its schedule, entries, votes, outcomes and appearance.

The default path keeps the decisions most creators need visible. Less common
customization is available from expandable sections named for their contents,
such as `Vote limits and behavior`. An expandable section shows `Customized`
when saved or restored values differ from the defaults and opens as
`Needs attention` when a hidden field fails validation.

Competition submission requirements are configured in competition setup.

### Direct-Message Journey

- [Direct Message Creation](feature-direct-message-creation.md): identity
  search, recipient selection, and thread creation.

### Access and Availability

- Create forms render only when the connected identity has a profile handle.
- Signed-out entry explains Connect to create a wave and preserves the create URL.
- Without a profile handle, Create Wave entry points open a compact profile
  setup dialog with `Go to Identity`; completing setup returns to standalone
  wave creation, or to the parent wave when creating a subwave.

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
