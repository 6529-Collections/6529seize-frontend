# Mobile Keyboard and Bottom Navigation Layout

Parent: [Navigation Index](README.md)

## Overview

In native app mode on iOS and Android, opening the on-screen keyboard hides
the fixed bottom navigation and removes bottom-nav reserve space. This keeps
inputs and composers close to the keyboard and avoids blank space.

## Location in the Site

- Native app routes rendered through `AppLayout` (`isApp` context).
- Wave/message stream surfaces that use mobile nav-space calculations.
- Single-drop reply composer in app mode (Android padding change).
- Create-wave flow in app mode (iOS margin change).

## Entry Points

- Open the native app (not small-screen web fallback layout).
- Navigate to a route with a text input.
- Focus the input to open the keyboard.
- Dismiss the keyboard to return to normal layout.

## User Journey

1. User focuses an input on an app-shell route.
2. Keyboard visibility updates from native keyboard events.
3. Bottom navigation slides out and ignores taps.
4. Layout height recalculates without bottom-nav reserve space.
5. User types with composer/input controls kept in the visible area.
6. User closes keyboard; bottom navigation and normal spacing return unless
   another hide condition is active.

## Common Scenarios

- Wave or message composing: bottom navigation hides while typing and returns
  after keyboard close.
- Single-drop reply on Android: composer bottom safe-area padding becomes `0`
  while keyboard is open.
- Create Wave flow on iOS: extra bottom margin used in non-keyboard state is
  removed while typing.

## Edge Cases

- Android keyboard show/hide updates are debounced to reduce rapid flicker.
- If keyboard listeners are unavailable or fail, layout stays in non-keyboard
  state.
- This behavior does not apply to desktop web or small-screen web sidebar layout.

## Failure and Recovery

- If bottom navigation appears stuck hidden, close the keyboard first
  (`Done`/back key or blur input).
- If spacing looks stale after keyboard close, change route once and return.
- If stale spacing persists, refresh the current route.

## Limitations / Notes

- This page only covers keyboard-driven layout changes.
- Other bottom-nav hide conditions (`?drop` open, inline drop edit) are covered in
  [Mobile Bottom Navigation](feature-mobile-bottom-navigation.md).
- Behavior depends on native keyboard event delivery timing.

## Related Pages

- [Navigation Index](README.md)
- [Mobile Bottom Navigation](feature-mobile-bottom-navigation.md)
- [Navigation and Shell Controls Troubleshooting](troubleshooting-navigation-and-shell-controls.md)
- [Wave Creation Index](../waves/create/README.md)
- [Wave Chat Scroll Behavior](../waves/chat/feature-scroll-behavior.md)
- [Wave Chat Index](../waves/chat/README.md)
- [Docs Home](../README.md)
