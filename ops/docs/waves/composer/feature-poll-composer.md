# Wave Poll Composer

## Overview

Eligible wave administrators can attach a poll to a chat post. A poll requires
a question, at least two unique options, and a future closing time before it
can be posted.

## Location in the Site

- Wave thread composer: `/waves/{waveId}`
- The poll action appears only for eligible wave administrators in chat mode.
- Poll and Storm modes cannot be active together.

## User Journey

1. Open the composer actions and choose **Poll**.
2. Enter the poll question in the composer field labeled **Ask a poll
   question**.
3. Choose whether voters can select one option or more than one option.
4. Enter at least two unique options.
5. Choose a future closing time and, when needed, restrict responses or make
   the poll anonymous.
6. Post the poll. The Post action stays unavailable while the question or poll
   settings are invalid.

## Validation and Recovery

- Opening a poll keeps the required question field neutral. It shows **Add a
  poll question.** if the field loses focus while empty or if the other poll
  settings become valid and the missing question is the only remaining block.
  The message stays aligned directly below the question field.
- Empty option rows show **Enter at least 2 options.**
- Duplicate options, overlong options, and non-future closing times show a
  specific message next to the poll fields.
- Fixing the invalid field clears its message and restores the Post action
  when the rest of the composer is valid.
- The close control in the poll header removes the draft poll. While a poll is
  open, the separate toolbar Poll control is hidden so there is one removal
  affordance.

## Related Pages

- [Wave Composer Index](README.md)
- [First-Message Wave Guidelines](feature-first-message-guidelines.md)
- [Wave Chat Content Tabs](../chat/feature-content-tabs.md)
