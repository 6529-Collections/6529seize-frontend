# Wave Chat Android Keyboard Layout Adjustment

## Overview

On Android app clients, wave chat layouts adjust automatically when the on-screen keyboard opens.

The chat content area and input area cooperate to keep the composer reachable and avoid large dead space below the latest messages while preserving a stable footer area when the keyboard is hidden.

## Location in the Site

- Wave chat timeline pages: `/waves/{waveId}` and chat-style wave routes
- Message feeds with mobile app context (Android)
- Single-drop chat surfaces that use the shared mobile chat composer layout

## Entry Points

- Open any wave or direct-message thread in the Android app.
- Focus the composer input at the bottom of the chat.
- Open a single-drop chat view where replies are composed inline.

## User Journey

1. Open a wave chat and read messages with the composer visible.
2. While the keyboard is closed, chat uses reserved bottom space so the composer and mobile nav remain comfortably separated from messages.
3. Focus a composer field.
4. The keyboard event updates the chat layout:
   - The reserved bottom space is removed for Android.
   - The chat viewport height is reduced to match the available space.
   - The active input area remains usable and stays within the visible region.
5. Dismiss the keyboard.
6. The reserved space is reintroduced and the chat returns to its normal compact layout.

## Common Scenarios

- Keyboard open in Android app:
  - The chat does not keep the normal static footer reserve.
  - Messages do not appear behind a fixed blank gap at the bottom.
  - The composer remains reachable while staying in context with chat history.
- Keyboard closed in Android app:
  - Extra bottom spacing is kept so the composer and input actions stay visible above fixed controls.
- Android single-drop chat:
  - Composer bottom padding is `0px` while the keyboard is open.
  - The layout uses the device safe-area inset when the keyboard is hidden.
- Keyboard state transitions are debounced:
  - Very fast focus/blur sequences are smoothed into a stable visual transition.

## Edge Cases

- On Android devices without a working Capacitor keyboard listener, the app keeps the static Android spacing behavior.
- If keyboard height data is delayed, chat layout may hold the previous height briefly while listeners settle.
- The dynamic adjustment applies only to the app context on Android; desktop web and non-app Android fallback to non-keyboard-specific behavior.
- Single-drop chat preserves its chat container structure, only changing bottom padding around the composer.

## Failure and Recovery

- If keyboard events stop arriving while typing, the chat remains functional with the last known adjustment.
- If the keyboard transitions fail while a component unmounts, listeners are removed and layout state resets to a non-keyboard variant.

## Limitations / Notes

- The documented behavior here is Android-app specific.
- iOS and desktop web chat views use different keyboard and safe-area handling.
- The keyboard behavior is tied to native keyboard events and may vary slightly with device-specific keyboard animations.

## Related Pages

- [Wave Chat Index](./README.md)
- [Wave Chat Scroll Behavior](feature-scroll-behavior.md)
- [Wave Chat Typing Indicator](feature-typing-indicator.md)
