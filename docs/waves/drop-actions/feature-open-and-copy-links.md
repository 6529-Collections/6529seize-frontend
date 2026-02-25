# Wave Drop Open and Copy Links

Parent: [Waves Index](../README.md)

## Overview

Wave drop actions provide two different link behaviors:

- `Open drop` opens the selected drop inside the current thread context.
- `Copy link` copies a shareable URL that targets a specific drop serial in its
  wave or DM thread.
- The single-drop view uses a shared overlay where drop details stay visible while
  discussion mode can be shown or hidden inline.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Desktop wave-drop action controls
- Mobile long-press drop action menu
- Quoted-drop cards inside wave drop content
- App-shell single-drop overlay (full-viewport panel with top action header)

## Entry Points

- Open a wave or direct-message thread and use drop action controls.
- Use `Open drop` from desktop actions or the mobile drop menu.
- Use `Copy link` from desktop actions or the mobile drop menu.
- Click a quoted drop in a message body.

## User Journey

1. Open a thread and locate a drop.
2. Choose one of these actions:
   - `Open drop`: opens drop details in the current route context by setting a
     `drop` query parameter.
   - `Copy link`: copies an absolute URL targeting that drop's serial number.
3. Share or open the copied URL:
   - Wave thread links target `/waves/{waveId}?serialNo={serialNo}`.
   - Direct-message links target `/messages?wave={waveId}&serialNo={serialNo}`.
4. When a thread opens with `serialNo`, the chat jumps/highlights the target.
5. After the jump is initialized, serial-target query parameters are cleared
   from the URL so normal thread browsing can continue.
6. In app-shell contexts, opening a drop presents a full-viewport single-drop
  panel:
   - On desktop: the drop remains on the left and discussion can be toggled into
     a right-side pane.
   - On mobile: the drop remains full-screen and discussion opens in a slide-over
     panel from the right.
   - In both forms, the top controls include `Close` and `Show Chat` / `Hide Chat`.

## Common Scenarios

- Opening a drop keeps users in the current wave/DM thread and overlays the
  selected drop details.
- In app-shell routes, opened drop details use a full-screen black-backed
  overlay so underlying thread content is not interactive until close.
- Single-drop header controls are safe-area-aware on small screens, so `Close`
  and chat toggle actions remain reachable below device notches/status bars.
- Closing an opened drop removes the `drop` query parameter and returns users
  to the same thread view.
- Copying a link to a non-DM wave uses the canonical `/waves/{waveId}` route
  plus `serialNo`.
- Copying a link to a DM wave uses `/messages` with both `wave` and `serialNo`.
- Clicking a quote from the same thread jumps to the quoted serial in-place.
- Clicking a quote from another thread routes to that thread and targets the
  quoted serial.
- Quote links using either `/waves/{waveId}?serialNo={serialNo}` or
  `/waves?wave={waveId}&serialNo={serialNo}` resolve to the same serial-target
  jump behavior.
- In-thread links where `drop` or `serialNo` points to the currently opened drop
  render as a normal anchor instead of opening a nested drop card.
- Temporary drops disable `Copy link` and show an unavailable state.
- Action controls are isolated from surrounding drop-click behavior: tapping or
  clicking `Copy link`, open, or preview links performs only that action and
  does not also trigger parent drop navigation.

## Edge Cases

- `Open drop` is not shown for chat-type drops.
- `Open drop` preserves other active query parameters while replacing the
  current `drop` value.
- On desktop, discussion starts hidden by default and can be opened from
  `Show Chat`; once open, it appears in a dedicated right pane without changing
  the underlying route.
- On mobile, single-drop chat opens in its own slide-over panel above the drop
  panel, and background scrolling is blocked until it is closed.
- While the small-screen single-drop chat panel is open, background page
  scrolling is blocked until that panel is closed.
- Serial-target jumps can load additional pages before the target becomes
  visible.
- If a same-origin shared link carries both `drop` and `serialNo`, the
  `drop` target takes precedence and renders as a drop preview/open flow rather
  than a quote jump card.
- Links that include a `drop` query parameter are handled by the drop flow, not
  the quote parser, so they do not recurse into nested quote-chain rendering.
- If a same-origin quote link would revisit a drop already in the current
  quote-preview chain (including `serialNo` self-references), quote-card
  rendering is skipped to avoid recursive nesting, and the link remains a
  standard URL in the message body.
- Serial links that include trailing slashes in query values (for example
  `serialNo=10/`) are normalized and still jump to the intended drop.
- Desktop copy actions can still resolve DM routing when DM context is known
  from the current stream state, even if direct-message metadata is incomplete
  on the drop payload.

## Failure and Recovery

- If clipboard access is blocked or denied, copy feedback is not guaranteed to
  appear; users can retry after browser permission/context issues are resolved.
- If drop details fail to load after `Open drop`, users remain in the thread
  and can retry opening the drop.
- If serial-target jumping stalls, the temporary scrolling overlay clears and
  normal scrolling remains available.
- If a target serial cannot be resolved immediately, users stay in the thread
  and can continue navigating manually.
- If a linked drop becomes self-referential, cyclic, or otherwise not supported
  as a rendered card, the link remains a normal link and users can still open it
  directly.

## Limitations / Notes

- `Open drop` (`drop` query) and copied links (`serialNo` query) are separate
  mechanisms with different behavior.
- Timeline text selection copy is a separate behavior from `Copy link`.
- `Copy link` is only available for non-temporary drops.
- Copied links target thread position; they do not force a persistent
  single-drop panel state.
- Quote-jump cards only apply to same-origin links with valid wave and serial
  values.

## Related Pages

- [Waves Index](../README.md)
- [Wave Chat Scroll Behavior](../chat/feature-scroll-behavior.md)
- [Wave Drop Content Display](feature-content-display.md)
- [Wave Drop Selection Copy](feature-selection-copy.md)
- [Wave Drop Reactions and Rating Actions](feature-reactions-and-ratings.md)
- [Legacy Route Redirects](../../shared/feature-legacy-route-redirects.md)
- [Docs Home](../../README.md)
