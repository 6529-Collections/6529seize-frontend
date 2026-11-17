# Waves gesture investigation

## Scope and current behavior

- Current main already uses `useHorizontalSwipe` for rightward native-app
  conversation navigation and leftward reply/timestamp reveal. The older
  32 px edge-only hook is no longer the implementation.
- Standard waves and legacy direct messages use `BrainMobile`; encrypted
  conversations use `E2eeConversationView`. Both native navigation consumers use
  `useWaveListSwipeBack`. Mobile web retains reply, timestamp and long-press
  interactions without app-managed rightward navigation. Desktop mouse selection
  and reply controls remain separate.
- Touch recognition reads `clientX`, `clientY`, `identifier`, touch counts and
  elapsed time. It does not read contact radius, pressure or force. Coordinates
  are CSS viewport coordinates. The outer 20 px on either screen edge stay
  reserved for native/browser navigation.

## Confirmed defects and bounded fix

The original navigation recognizer required 1.5 times as much horizontal as
vertical movement before claiming a touch. Trusted Chromium touch replay showed
that an initially rightward thumb arc (13 px right, 10 px down, then progressively
rightward) became a browser scroll before recognition. Both simulated native
platforms failed with the original ratio and passed the same paths with 1.2.
This establishes a browser-level missed-gesture mechanism, not a measurement of
this user's natural thumb path.

| Relative movement trace, CSS px | Original 1.5 navigation ratio | New 1.2 navigation ratio |
| --- | --- | --- |
| (13,10), (24,15), (48,21), (78,29), (110,34), release | Missed on both browser-simulated native platforms | Navigates at 360 and 430 CSS px |
| (4,-24), (8,-48), (110,-52), release | Vertical; no navigation | Vertical; no navigation |
| (10,13), then progressively rightward | Browser can own the scroll | Still scrolling; deliberately not stolen |
| Non-cancelable move to (130,0) | Could navigate despite browser ownership | Cancelled |

Only native-app swipe-back uses the 1.2 intent ratio, accepting initial angles up
to about 40 degrees from horizontal rather than 34. Reply keeps its 1.5 ratio.
This is a bounded six-degree change for the reported action, rather than lowering
every threshold. Vertical-first rejection, horizontal activation at 12 px,
navigation distance 100 px, reply distance 96 px, and navigation flick minimum
24 px at 0.5 px/ms remain unchanged. No activation region was widened. A
non-cancelable move ends the app gesture, preserving browser scrolling.

An initial attempt to defer ambiguous diagonals with symmetric axis cones passed
synthetic tests but failed trusted browser touch. It was removed. This is why
synthetic coordinate tests alone are insufficient evidence for this symptom.

A separate regression confirmed that disabling navigation while the outgoing
180 ms settle was pending did not cancel its queued Back action. Cleanup now
also follows `enabled`, as well as scope and unmount. Disabling during an
active drag clears feedback immediately: it cannot start another settle after
layout cleanup. Stale completion cannot navigate or leave a reused surface
translated. The active-drag disable regression reproduced this cleanup-order
race before the immediate-clear guard was added.

## Motion and performance

The existing direct DOM transform feedback, one animation frame per burst of
touch moves, 160 ms cancellation settle, 180 ms completion settle, reduced-motion
path and duplicate-transition suppression remain. No dependency, React state
or listener was added to the recognizer. Its existing unit
contract checks move coalescing and no React re-render during a drag.

Reply distance, release timing, timestamp reveal, composer focus, visible action
sheet Reply, Back, target exclusions, selection, multi-touch and long-press
ownership remain covered by the affected tests. Draft persistence, history and
scroll restoration code are unchanged.

## Validation ledger

- Regression reproduction: browser thumb paths failed on both native simulations
  with the original ratio. Synthetic regressions also reproduced browser-owned
  movement committing and disabled navigation retaining a queued Back action.
- After: 100 tests across seven affected gesture, encrypted-message and transition
  suites passed.
- Changed-line lint passed. React Doctor reported 100/100 with no issues.
- Trusted Chromium touch coverage adds curved starts and vertical-first paths
  at 360 and 430 CSS px for both simulated native platforms. It remains in the
  registered native-competition sandbox pack, selected by App PR CI for both
  recognizer and navigation hook changes. The complete pack passed 11 applicable
  cases (11 project-inapplicable skips).
- Staging API QA login succeeded through the agent-login skill with an existing
  dedicated account. The staging-backed Waves list rendered with the
  authenticated QA account. Screenshots were captured locally.
- The no-push test app was built, installed and exercised on a physical iPhone
  over Wi-Fi, using the staging API and a dedicated QA account. Direct Xcode
  Wi-Fi automation supplied real-device screenshots, native page source and
  OS-injected touches without a privileged tunnel.
- Physical standard-wave checks passed: the curved path above, straight drags,
  short fast flicks and initial jitter navigate; short slow drags, pauses,
  reversals, vertical-first scrolling and a second finger do not navigate.
  Leftward reply opens its preview, Cancel reply dismisses it, and visible Back
  remains available. With the keyboard open, curved Back works and an unsent
  draft survives leaving and reopening the conversation. Only the QA draft was
  then cleared; no content or reactions were published.
- Physical checks cover the standard-wave runtime at 430 CSS px. Legacy and
  encrypted DM destinations retain unit coverage; their physical runtimes were
  not exercised. Android remains browser-simulated. OS-injected gestures on a
  real phone establish runtime behavior, but do not measure this user's natural
  thumb path or subjective comfort. The checklist below remains useful for that
  final ergonomic assessment.

## Additional gestures: recommendations only

1. **Wave-list pin shortcut — later.** A short left swipe on the body of a
   Waves-list row could reveal its existing Pin/Unpin action; committing would
   still require tapping the action. This helps frequent one-handed list
   management without changing conversation navigation. Keep the existing
   named pin button and show the action on the first drag for discoverability.
   Exclude expand controls and links, lock vertical scrolling first, and preserve
   system edges. Risk is opening a tray accidentally rather than pinning a wave;
   keyboard/screen-reader users keep the button. Moderate implementation cost
   because virtualized/reordered rows and pin-limit errors must be covered.
2. **Image preview dismissal — later, only while unzoomed.** A downward drag from
   a dedicated handle could dismiss the existing full-screen image preview.
   It would make the Close action reachable one-handed. Keep Close and Escape,
   introduce a visible handle, require vertical intent and return short drags
   to rest. Never apply it while zoomed, pinching or panning. Moderate-to-high
   cost because zoom ownership and accidental dismissal need real-device QA.
3. **Avoid horizontal swipes to switch conversation sections.** Chat already
   assigns left to reply/timestamp and right to Back in native views. Adding tab
   switching over the same content would compete with both and make intent
   unpredictable. Keep the existing section controls and horizontal tab-row
   scrolling; the conflict outweighs a small reduction in taps.
4. **Avoid notification swipe-to-mark-read in the current inbox.** Opening the
   inbox already marks notifications read, and opening a row acknowledges its
   IDs. A separate swipe would add state and accidental activation without a
   useful new shortcut. Keep the current row and read controls.

## Physical-device checklist

On the updated native app, compare deliberate straight swipes with natural
left-hand-thumb curves, starting in reachable interior content and outside the
reserved system edge. Repeat in a standard wave, legacy DM and encrypted DM.
Check short flicks, pauses and reversals, then vertical scrolling and a diagonal
scroll that bends right. Only the intended horizontal gestures should navigate.
Repeat with an unsent draft and keyboard open; verify cancellation keeps the
draft, reply still feels the same, Back/Reply controls work, and media, selection,
long press, overlays and horizontal carousels retain their own interactions.
