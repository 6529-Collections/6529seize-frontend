# Mobile Keyboard and Bottom Navigation Layout

## Overview

On mobile app clients (Android and iOS), the shared app shell adjusts bottom
spacing and hides bottom navigation when the on-screen keyboard is visible. This
removes dead space so composers, create-flow inputs, and chat fields stay near
the keyboard.

## Location in the Site

- Mobile app shell routes using the shared `AppLayout` wrapper
- Wave and message flows that expose chat or composer inputs
- Create-flow pages that use the shared composer container
- Any mobile app route where an input is focused

## Entry Points

- Open the mobile app and navigate to a route with a message, composer, or create
  flow input.
- Focus a text input in a chat or drop-composer field.
- Tap outside the input or dismiss the keyboard.

## User Journey

1. Keyboard is hidden.
2. The user focuses an input in the mobile app shell.
3. The app detects keyboard visibility on Android or iOS.
4. The bottom navigation hides and layout spacing removes fixed keyboard reserves.
5. The content area recalculates with reduced bottom spacing.
6. The user can compose without a large dead zone between input and the keyboard.
7. When the keyboard dismisses, spacing and bottom navigation return to normal.

## Common Scenarios

- While typing in wave chat:
  - The composer remains visible and reachable.
  - The dead space between composer input and keyboard is reduced.
- While typing in create-flow fields on iOS:
  - The composer container no longer leaves an extra bottom margin.
  - Input areas remain usable throughout keyboard transitions.
- While typing in other mobile app composer surfaces:
  - Layout contracts to the available space before the keyboard area.
  - Controls stay within the usable region of the screen.
- While the keyboard is closed:
  - Bottom navigation remains visible.
  - Existing safe-area spacing behavior remains in place.

## Edge Cases

- If the native keyboard listener is unavailable, app behavior falls back to static
  spacing.
- If focus and blur happen quickly, keyboard transitions are debounced so the UI
  settles before major reflow.
- On routes without active inputs, behavior stays in the non-keyboard state.
- Web and non-keyboard app routes do not trigger this mobile keyboard layout mode.

## Failure and Recovery

- If a keyboard event is delayed or missed, the app keeps the last valid layout and
  remains interactive.
- When route or component state changes and listeners are cleaned up, layout state
  is reset to the non-keyboard variant.

## Limitations / Notes

- The documented behavior is mobile-app specific.
- Visual timing depends on native keyboard event delivery and device animation
  characteristics.
- Safe-area inset spacing is restored after the keyboard closes.

## Related Pages

- [Navigation Index](README.md)
- [Wave Chat Scroll Behavior](../waves/chat/feature-scroll-behavior.md)
- [Wave Chat Typing Indicator](../waves/chat/feature-typing-indicator.md)
- [Wave Chat Index](../waves/chat/README.md)
- [Docs Home](../README.md)
