# Android Keyboard and Bottom Navigation Layout

## Overview

On Android app clients, the shared app shell adjusts bottom spacing and bottom
navigation when the on-screen keyboard opens. This removes unused gaps so the
composer and editable fields stay near the keyboard instead of separated by fixed
blank space.

## Location in the Site

- Android app shell routes using the shared `AppLayout` wrapper
- Wave and message flows that expose chat/composer inputs
- Any Android app route where a mobile input is focused

## Entry Points

- Open the Android app and navigate to a route with a message or composer input.
- Focus a text input in a chat or drop-composer field.
- Tap outside the input or dismiss the keyboard.

## User Journey

1. Keyboard is hidden.
2. The user focuses an input in the mobile app shell.
3. The app detects keyboard visibility.
4. The bottom navigation animates away and layout spacing removes the keyboard
   reserve so content remains usable.
5. The user can compose without a large dead zone between input and keyboard.
6. When the keyboard dismisses, spacing and bottom navigation return to normal.

## Common Scenarios

- While typing in a wave chat:
  - The composer remains visible and reachable.
  - The dead space that previously appeared between composer input and the
    keyboard is removed.
- While typing in other Android app composer surfaces:
  - The layout contracts to the available space before the keyboard area.
  - Composer controls stay within the usable region of the screen.
- While the keyboard is closed:
  - Bottom navigation remains visible.
  - The app keeps the existing safe-area behavior for non-keyboard space.

## Edge Cases

- If the native keyboard listener is unavailable, Android app behavior falls back to
  static spacing.
- If focus and blur happen quickly, keyboard transitions are debounced so the UI
  settles before major reflow.
- On routes without active inputs, behavior stays at the non-keyboard state.
- iOS and non-app Android web contexts do not get the Android-specific bottom-nav
  hiding behavior.

## Failure and Recovery

- If a keyboard event is delayed or missed, the app keeps the last valid layout and
  continues to remain interactive.
- When route or component state changes and listeners are cleaned up, layout state
  is reset to the non-keyboard variant.

## Limitations / Notes

- The documented behavior is Android-app specific.
- Visual timing depends on native keyboard event delivery and device animation
  characteristics.
- Safe-area inset spacing is restored after the keyboard closes.

## Related Pages

- [Navigation Index](README.md)
- [Wave Chat Scroll Behavior](../waves/chat/feature-scroll-behavior.md)
- [Wave Chat Typing Indicator](../waves/chat/feature-typing-indicator.md)
- [Wave Chat Index](../waves/chat/README.md)
- [Docs Home](../README.md)
