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

/** A mouse or trackpad (or similar precise pointer) is available. */
export const hasFinePointerCapability = (): boolean =>
  someQueryMatches(FINE_POINTER_QUERIES);

/** Some input can hover (mouse, trackpad, stylus with hover). */
export const hasHoverCapability = (): boolean =>
  someQueryMatches(HOVER_QUERIES);

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

const MOBILE_USER_AGENT_REGEX =
  /Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i;

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
 * in/out, convertible posture change). Returns an unsubscribe function.
 */
export const subscribeToTouchFirstChanges = (
  onChange: () => void
): (() => void) => {
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
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
};
