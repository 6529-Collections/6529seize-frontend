# Brain Wave List Name Tooltips

## Overview

Brain and DM wave-list rows keep names discoverable in both expanded and
collapsed sidebar states. In collapsed mode, rows are icon-first and show wave
or DM names in hover tooltips. In expanded mode, names stay inline and only use
a tooltip when the text is truncated.

## Location in the Site

- Desktop Brain sidebar on `/` and `/{user}`.
- Desktop messages layouts that reuse the same Brain/DM wave list.
- Applies to both pinned and unpinned wave entries.

## Entry Points

- Open any route that shows the desktop Brain sidebar wave list.
- Collapse the sidebar to icon-only mode.
- Hover a wave/DM avatar entry.
- In expanded mode, hover a truncated wave name.

## User Journey

1. Open the wave list in expanded sidebar mode.
2. Read wave names inline; if a name is truncated, hover it to see full text.
3. Collapse the sidebar.
4. Hover an avatar entry to read its wave/DM name in a tooltip.
5. Select the entry to open that wave thread.

## Common Scenarios

- In collapsed mode, users distinguish similar avatars by hovering to read names.
- Long names in expanded mode can still be read through truncation tooltips.
- DM rows follow the same tooltip behavior as non-DM wave rows.
- Pinned and regular rows expose tooltips consistently.

## Edge Cases

- Non-hover-capable devices do not show these hover tooltips.
- Expanded-mode rows with short names that fit do not render a tooltip.
- Active-row highlighting and unread badges do not block tooltip display on
  hover-capable devices.
- Tooltip content follows the same formatted wave name shown in the list.

## Failure and Recovery

- If hover is unavailable on the current device, users can expand the sidebar
  to read inline names.
- If viewport changes alter truncation, tooltip eligibility is recalculated
  after resize.
- If a row is missing unread/`Last drop` metadata, name tooltip behavior still
  works independently.

## Limitations / Notes

- Collapsed mode keeps entries icon-only; tooltip hover is the name-discovery
  path in that state.
- Tooltip behavior is hover-driven and does not replace inline labels.
- Tooltip content uses formatted wave names, including shortened address
  formatting used in DM-style labels.

## Related Pages

- [Waves Index](../README.md)
- [Brain Wave List Last Drop Indicator](feature-brain-list-last-drop-indicator.md)
- [Sidebar Navigation](../../navigation/feature-sidebar-navigation.md)
- [Wave Chat Scroll Behavior](../chat/feature-scroll-behavior.md)
- [Docs Home](../../README.md)
