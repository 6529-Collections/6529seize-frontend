# Wave Chat

## Overview

Use this subarea for in-thread behavior in wave and direct-message threads.

## Route Coverage

- `/waves/{waveId}`
- `/messages?wave={waveId}`

## Query Coverage

- `serialNo={n}` opens or jumps to a target drop.
- `divider={n}` sets an unread boundary for initial thread setup.
- After jump setup completes, chat removes `serialNo` and `divider` from the URL.

## Ownership

- Owns thread scroll and bottom-pinning behavior.
- Owns serial jump behavior from links, search, and sidebar actions.
- Owns unread divider rendering and unread jump controls.
- Owns typing-indicator behavior.
- Owns thread composer availability and unavailable-state panel behavior.
- Composer input formatting and submission details are owned by Wave Composer docs.
- Drop action menus and link actions are owned by Wave Drop Actions docs.

## Features

- [Wave Chat Scroll Behavior](feature-scroll-behavior.md): latest pinning, history
  loading, and pending-message controls.
- [Wave Chat Serial Jump Navigation](feature-serial-jump-navigation.md):
  serial-target links and in-thread jump recovery.
- [Wave Chat Unread Divider and Jump Controls](feature-unread-divider-and-controls.md):
  `New Messages` divider and unread-jump controls.
- [Wave Chat Typing Indicator](feature-typing-indicator.md): live typing labels and
  timeout behavior.
- [Wave Chat Composer Availability](feature-chat-composer-availability.md): when
  composer renders versus unavailable-state panels.

## Flows

- [Wave Participation Flow](../flow-wave-participation.md): end-to-end wave and direct-message
  journey.

## Troubleshooting

- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md):
  route, jump, and posting recovery guidance.

## Stubs

- None.

## Related Areas

- [Waves Index](../README.md)
- [Wave Composer Index](../composer/README.md)
- [Wave Drop Actions Index](../drop-actions/README.md)
- [Wave Sidebars Index](../sidebars/README.md)
- [Realtime Index](../../realtime/README.md)
- [Navigation Index](../../navigation/README.md)
