/**
 * Shared "touch-first" device classification.
 *
 * A device is touch-first when touch is its PRIMARY interaction model:
 * touch input exists AND there is no fine pointer (mouse/trackpad) AND no
 * hover-capable input. Phones and tablets are touch-first; hybrid devices
 * such as Windows touch-screen laptops (Surface) and touch monitors attached
 * to desktops are NOT — they must get the desktop experience.
 *
 * Every mobile/touch UI decision in the app must go through this module (or
 * the hooks built on it: useIsTouchDevice, useDeviceInfo) instead of checking
 * `navigator.maxTouchPoints`, `"ontouchstart" in window` or
 * `matchMedia("(pointer: coarse)")` directly — those are true on hybrid
 * laptops and misclassify them as mobile.
 */

type MatchMediaWindow = typeof globalThis & {
  matchMedia?: (query: string) => MediaQueryList;
};

const FINE_POINTER_QUERIES = [
  "(any-pointer: fine)",
  "(pointer: fine)",
] as const;

const HOVER_QUERIES = ["(any-hover: hover)", "(hover: hover)"] as const;

const COARSE_POINTER_QUERY = "(any-pointer: coarse)";

/** Media queries whose changes can flip the touch-first classification. */
const TOUCH_FIRST_MEDIA_QUERIES = [
  ...FINE_POINTER_QUERIES,
  ...HOVER_QUERIES,
  COARSE_POINTER_QUERY,
] as const;

const getMediaQueryList = (query: string): MediaQueryList | null => {
  const win = globalThis as MatchMediaWindow;
  if (typeof win.matchMedia !== "function") {
    return null;
  }
  try {
    return win.matchMedia(query);
  } catch {
    return null;
  }
};

const someQueryMatches = (queries: readonly string[]): boolean =>
  queries.some((query) => getMediaQueryList(query)?.matches ?? false);

/**
 * Behavioral fine-pointer evidence.
 *
 * Some Windows browsers mis-report pointer/hover capabilities — e.g. a
 * convertible whose media queries claim "no hover, coarse only" while the
 * user is actively driving a trackpad cursor. A genuine `pointerType:
 * "mouse"` event stream is ground truth that a fine, hover-capable pointer
 * exists: latch it, tag <body> with `data-fine-pointer` so CSS can
 * participate (see globals.css and the tailwind `desktop-hover`/`touch-only`
 * variants), and notify subscribers so hooks re-evaluate.
 *
 * "Genuine" is the hard part. Legacy Windows touch stacks (Windows 8 era)
 * synthesize mouse events from taps at the OS level — those are `isTrusted`
 * and typed "mouse", indistinguishable by trust alone. Latching on them
 * flips a pure touch device to desktop-hover UI, where every action lives
 * behind hover a finger cannot perform (shipped regression: wave reply /
 * three-dots unreachable on Win 8 touch hardware). The three guards below
 * exist to tell a real cursor glide apart from touch emulation.
 */
// Attribute (not a class) so tailwind's `tw-` prefix cannot rewrite it in
// variant selectors.
const FINE_POINTER_BODY_ATTRIBUTE = "data-fine-pointer";

// A single event is not proof: some tools emit stray synthetic mouse events
// on genuine touch devices, and jsdom/test events must never latch. Require
// a short stream of TRUSTED mouse moves — a real cursor glide.
const FINE_POINTER_EVIDENCE_THRESHOLD = 3;

// Guard 1 of 3 (see handleSentinelPointerEvent for the other two): mouse
// events arriving within this window after trusted touch input are treated
// as touch-derived and never counted. Synthesized compatibility events fire
// within milliseconds of the touch; 1.5s adds margin for slow legacy stacks
// while costing a genuine hybrid user at most a moment before their first
// post-touch trackpad glide can latch.
const TOUCH_SUPPRESSION_WINDOW_MS = 1500;

type SentinelPointerEvent = Event & {
  readonly pointerType?: string;
  readonly sourceCapabilities?: { readonly firesTouchEvents?: boolean } | null;
};

const capabilityChangeListeners = new Set<() => void>();

let finePointerObserved = false;
let pointerSentinelInstalled = false;
let trustedMouseMoveCount = 0;
let lastTrustedTouchAt = Number.NEGATIVE_INFINITY;

const notifyCapabilityChange = () => {
  for (const listener of capabilityChangeListeners) {
    listener();
  }
};

const discountTouchDerivedEvidence = () => {
  lastTrustedTouchAt = Date.now();
  trustedMouseMoveCount = 0;
};

const handleSentinelPointerEvent = (event: Event) => {
  if (!event.isTrusted) {
    return;
  }

  const pointerEvent = event as SentinelPointerEvent;
  if (pointerEvent.pointerType === "touch") {
    // Guard 2 of 3: touch input arms the suppression window AND resets the
    // evidence counter, so stray emulated mouse events from separate taps can
    // never accumulate to the threshold across the page lifetime — only an
    // uninterrupted cursor glide can.
    discountTouchDerivedEvidence();
    return;
  }
  if (pointerEvent.pointerType !== "mouse") {
    return;
  }
  if (pointerEvent.sourceCapabilities?.firesTouchEvents) {
    // Guard 3 of 3: Chromium flags compatibility mouse events synthesized
    // from touch via sourceCapabilities.firesTouchEvents (supported since
    // Chrome 49, which covers every Chromium old enough to run on Win 8).
    // Not a real cursor — treat exactly like touch input.
    discountTouchDerivedEvidence();
    return;
  }
  if (Date.now() - lastTrustedTouchAt < TOUCH_SUPPRESSION_WINDOW_MS) {
    return;
  }

  trustedMouseMoveCount += 1;
  if (trustedMouseMoveCount < FINE_POINTER_EVIDENCE_THRESHOLD) {
    return;
  }

  uninstallPointerSentinel();
  finePointerObserved = true;
  (
    globalThis as typeof globalThis & { document?: Document }
  ).document?.body?.setAttribute(FINE_POINTER_BODY_ATTRIBUTE, "true");
  notifyCapabilityChange();
};

const installPointerSentinel = () => {
  if (
    pointerSentinelInstalled ||
    finePointerObserved ||
    typeof globalThis.addEventListener !== "function"
  ) {
    return;
  }
  pointerSentinelInstalled = true;
  globalThis.addEventListener("pointermove", handleSentinelPointerEvent, {
    passive: true,
    capture: true,
  });
  // A plain tap produces no touch pointermove; watch pointerdown too so taps
  // arm the touch-suppression window before their synthesized mouse events.
  globalThis.addEventListener("pointerdown", handleSentinelPointerEvent, {
    passive: true,
    capture: true,
  });
};

const uninstallPointerSentinel = () => {
  if (!pointerSentinelInstalled) {
    return;
  }
  pointerSentinelInstalled = false;
  globalThis.removeEventListener("pointermove", handleSentinelPointerEvent, {
    capture: true,
  });
  globalThis.removeEventListener("pointerdown", handleSentinelPointerEvent, {
    capture: true,
  });
};

/** A mouse or trackpad (or similar precise pointer) is available. */
export const hasFinePointerCapability = (): boolean =>
  finePointerObserved || someQueryMatches(FINE_POINTER_QUERIES);

/** Some input can hover (mouse, trackpad, stylus with hover). */
export const hasHoverCapability = (): boolean =>
  finePointerObserved || someQueryMatches(HOVER_QUERIES);

/**
 * Touch input exists at all (says nothing about it being primary).
 * Note: intentionally NOT `"ontouchstart" in window` — some engines (and
 * jsdom) expose that handler without touch hardware.
 */
export const hasTouchCapability = (): boolean => {
  const nav = (globalThis as typeof globalThis & { navigator?: Navigator })
    .navigator as (Navigator & { msMaxTouchPoints?: number }) | undefined;
  const maxTouchPoints = nav?.maxTouchPoints ?? nav?.msMaxTouchPoints ?? 0;
  if (maxTouchPoints > 0) {
    return true;
  }
  return getMediaQueryList(COARSE_POINTER_QUERY)?.matches ?? false;
};

// "Android.*Mobile" keeps Android tablets (which omit "Mobile" from the UA)
// out of the phone fallback when client hints are unavailable.
const MOBILE_USER_AGENT_REGEX =
  /iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Android.*Mobile/i;

/**
 * Phone signal from client hints or the user agent. Client hints win when
 * present: Android tablets report `userAgentData.mobile === false`, so a
 * tablet with a trackpad still gets the desktop experience.
 */
const isMobileUserAgent = (): boolean => {
  const nav = (globalThis as typeof globalThis & { navigator?: Navigator })
    .navigator as
    | (Navigator & { userAgentData?: { mobile?: boolean } })
    | undefined;
  if (!nav) {
    return false;
  }
  const uaDataMobile = nav.userAgentData?.mobile;
  if (typeof uaDataMobile === "boolean") {
    return uaDataMobile;
  }
  return MOBILE_USER_AGENT_REGEX.test(nav.userAgent);
};

/**
 * True only for devices whose primary interaction is touch (phones/tablets).
 * Phones stay touch-first even when a paired mouse or hovering stylus adds a
 * fine pointer or hover capability; hybrids (touch laptops) are identified by
 * capabilities alone. `touchDetected` lets callers feed in an observed
 * `touchstart` for devices that hide their touch capability until first use.
 */
export const isTouchFirstEnvironment = (options?: {
  readonly touchDetected?: boolean;
}): boolean => {
  const touchCapable = (options?.touchDetected ?? false) || hasTouchCapability();
  if (!touchCapable) {
    return false;
  }
  if (isMobileUserAgent()) {
    return true;
  }
  return !hasFinePointerCapability() && !hasHoverCapability();
};

/**
 * Re-runs `onChange` whenever a capability media query flips (mouse plugged
 * in/out, convertible posture change) or behavioral fine-pointer evidence
 * arrives. Returns an unsubscribe function.
 */
export const subscribeToTouchFirstChanges = (
  onChange: () => void
): (() => void) => {
  installPointerSentinel();
  capabilityChangeListeners.add(onChange);

  const unsubscribers: Array<() => void> = [];

  for (const query of TOUCH_FIRST_MEDIA_QUERIES) {
    const mediaQueryList = getMediaQueryList(query);
    if (
      !mediaQueryList ||
      typeof mediaQueryList.addEventListener !== "function"
    ) {
      continue;
    }

    mediaQueryList.addEventListener("change", onChange);
    unsubscribers.push(() =>
      mediaQueryList.removeEventListener("change", onChange)
    );
  }

  return () => {
    capabilityChangeListeners.delete(onChange);
    if (capabilityChangeListeners.size === 0) {
      // No subscribers left — drop the global capture listener so genuine
      // touch devices don't pay a page-lifetime hot-path cost.
      uninstallPointerSentinel();
    }
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
};
