# Native Profile Overlay Navigation

Native app navigation preserves the active `/waves` or `/messages` screen when a
profile route is opened from those hosts. The implementation uses scoped App
Router intercepting routes under `app/waves/@nativeOverlay` and
`app/messages/@nativeOverlay`, so direct profile URLs still render through the
normal `app/[user]` route tree.

The overlay delegates to the existing profile route modules in
`app/_native-overlay/profileOverlay.tsx`. Profile root, profile tabs, legacy
profile redirects, and CMS paths all keep their original route behavior,
including path and query parameters. The overlay component lives in
`components/native-navigation/NativeRouteOverlay.tsx`.

Runtime behavior:

- The preserved stack is intentionally one overlay deep. Same-origin links
  clicked inside the overlay use `router.replace`, so Back closes the overlay
  to the original waves/messages position instead of walking nested profile
  pages.
- Edge swipes from either horizontal edge call `router.back()` once the gesture
  is mostly horizontal and passes the close threshold.
- Non-native web clients that hit the intercepted route immediately replace to
  the canonical URL, avoiding a mixed waves/messages plus profile render.

To extend this to another preserved host, add a parallel `@nativeOverlay` slot
to that host layout and reuse the same root and catch-all intercepted profile
route shims. Do not add per-link logic for profile links.
