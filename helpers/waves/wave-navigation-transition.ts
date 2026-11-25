import { PHONE_WAVES_LAYOUT_QUERY } from "@/constants/waves-layout";

// The app shell acknowledges the committed screen before the browser captures it.
// This keeps the outgoing list (including its scroll position) visible during the handoff.
export type WaveScreen = "list" | "feed" | "wave";

interface SwipeHandoff {
  readonly surface: HTMLElement;
  readonly distance: number;
  readonly width: number;
  readonly onFinish?: () => void;
}

export function isForwardWaveNavigation(
  screen: WaveScreen,
  previous: string | null | undefined
) {
  return screen === "wave" || (screen === "feed" && previous === "list");
}
let activeTransition: {
  readonly screen: WaveScreen;
  readonly committed: () => void;
  readonly skip: () => void;
  readonly contentReady: () => void;
} | null = null;
let navigatingWithoutAdditionalMotion = false;
let swipeHandoffPending = false;

/** The interactive gesture already animated the outgoing screen. */
export function navigateAfterWaveSwipe(navigate: () => void) {
  skipWaveNavigationTransition();
  navigateWithoutAdditionalMotion(navigate);
}

function navigateWithoutAdditionalMotion(navigate: () => void) {
  swipeHandoffPending = true;
  navigatingWithoutAdditionalMotion = true;
  try {
    navigate();
  } finally {
    navigatingWithoutAdditionalMotion = false;
  }
}

/** Tapped phone Back uses one snapshot of the header and channel together. */
export function runWaveChevronBackTransition(navigate: () => void) {
  if (!window.matchMedia(PHONE_WAVES_LAYOUT_QUERY).matches) {
    navigate();
    return;
  }
  runWaveNavigationTransition(
    "list",
    () => navigateWithoutAdditionalMotion(navigate),
    undefined,
    "chevron-back"
  );
}

export function consumeWaveSwipeHandoff() {
  // The destination consumes the handoff when it commits, however long routing takes.
  const pending = swipeHandoffPending;
  swipeHandoffPending = false;
  return pending;
}

export function commitWaveNavigationTransition(
  screen: WaveScreen | null
): boolean {
  if (!activeTransition) return false;
  if (screen !== activeTransition.screen) activeTransition.skip();
  else activeTransition.committed();
  return true;
}

/** Virtualized content acknowledges its measured visible rows, not just its shell. */
export function commitWaveNavigationContent(screen: WaveScreen) {
  if (activeTransition?.screen === screen) activeTransition.contentReady();
}

export function isWaveNavigationContentPending(screen: WaveScreen) {
  return (
    activeTransition?.screen === screen &&
    document.documentElement.dataset["waveNavigationContentPending"] !==
      undefined
  );
}

export function skipWaveNavigationTransition() {
  swipeHandoffPending = false;
  activeTransition?.skip();
}

export function runWaveNavigationTransition(
  screen: WaveScreen,
  navigate: () => void,
  swipe?: SwipeHandoff,
  presentation?: "chevron-back"
) {
  if (navigatingWithoutAdditionalMotion) {
    navigate();
    return false;
  }
  swipeHandoffPending = false;
  const screenSurface = document.querySelector<HTMLElement>(
    "[data-wave-navigation-screen]"
  );
  const surface =
    presentation === "chevron-back"
      ? (screenSurface?.closest<HTMLElement>("[data-wave-swipe-page]") ??
        document.querySelector<HTMLElement>("[data-phone-wave-page]"))
      : screenSurface;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (
    !surface ||
    surface.dataset["waveNavigationScreen"] === screen ||
    typeof document.startViewTransition !== "function" ||
    reducedMotion.matches
  ) {
    activeTransition?.skip();
    if (!swipe) navigate();
    return false;
  }

  activeTransition?.skip();
  const root = document.documentElement;
  let contentPending = screen === "feed";
  let shellCommitted = false;
  if (contentPending) root.dataset["waveNavigationContentPending"] = "true";
  else delete root.dataset["waveNavigationContentPending"];
  let commit = () => {};
  const committed = new Promise<void>((resolve) => {
    commit = resolve;
  });
  root.style.setProperty(
    "--wave-transition-height",
    `${surface.getBoundingClientRect().height}px`
  );
  surface.style.viewTransitionName = "wave-navigation";
  if (presentation) {
    root.dataset["waveNavigationTransition"] = presentation;
  } else {
    root.dataset["waveNavigationTransition"] = isForwardWaveNavigation(
      screen,
      surface.dataset["waveNavigationScreen"]
    )
      ? "forward"
      : "back";
  }
  if (swipe) {
    root.dataset["waveNavigationTransition"] = "swipe-back";
    root.style.setProperty(
      "--wave-swipe-remainder",
      `${Math.max(0, swipe.width - swipe.distance)}px`
    );
  }
  const clearSurface = () => {
    delete root.dataset["waveNavigationTransition"];
    delete root.dataset["waveNavigationContentPending"];
    surface.style.removeProperty("view-transition-name");
    root.style.removeProperty("--wave-transition-height");
    root.style.removeProperty("--wave-swipe-remainder");
  };
  let transition: ViewTransition;
  let stopped = false;
  let superseded = false;
  try {
    transition = document.startViewTransition(async () => {
      if (superseded) return;
      // Only the departing page moves. Keep the destination in the stationary
      // root capture instead of capturing its fixed/sticky children twice.
      if (presentation) surface.style.removeProperty("view-transition-name");
      // The browser has captured the finger's final position. Prepare the new
      // screen underneath that snapshot, rather than sliding into an empty shell.
      swipe?.surface.style.removeProperty("transform");
      swipe?.surface.style.removeProperty("will-change");
      if (swipe) navigateWithoutAdditionalMotion(navigate);
      else navigate();
      await committed;
    });
  } catch {
    // Motion is optional: an engine failure must not prevent navigation.
    clearSurface();
    if (!swipe) navigate();
    return false;
  }
  const skip = (cancelNavigation = true) => {
    superseded ||= cancelNavigation;
    if (stopped) return;
    stopped = true;
    commit();
    clearSurface();
    transition.skipTransition();
  };
  // A route interruption must never leave the app waiting for a screen that cannot commit.
  const skipMotion = () => skip(false);
  const cancelNavigation = () => skip();
  const timeout = window.setTimeout(skipMotion, 500);
  const contentReady = () => {
    contentPending = false;
    delete root.dataset["waveNavigationContentPending"];
    if (shellCommitted) window.clearTimeout(timeout);
  };
  const pending = {
    screen,
    committed: () => {
      // Finish the DOM update so the virtual list can run its normal layout
      // frames. Keep the opaque old snapshot still until visible cards are ready.
      shellCommitted = true;
      if (!contentPending) window.clearTimeout(timeout);
      commit();
    },
    contentReady,
    skip,
  };
  activeTransition = pending;
  reducedMotion.addEventListener("change", skipMotion, { once: true });
  if (presentation) {
    document.addEventListener("pointerdown", skipMotion, { capture: true });
    window.addEventListener("popstate", cancelNavigation);
    window.addEventListener("resize", skipMotion);
  }
  const cleanup = () => {
    stopped = true;
    window.clearTimeout(timeout);
    reducedMotion.removeEventListener("change", skipMotion);
    if (presentation) {
      document.removeEventListener("pointerdown", skipMotion, true);
      window.removeEventListener("popstate", cancelNavigation);
      window.removeEventListener("resize", skipMotion);
    }
    swipe?.onFinish?.();
    if (activeTransition !== pending) return;
    activeTransition = null;
    clearSurface();
  };
  // Skipping a transition rejects ready but still runs the navigation callback.
  void transition.ready.catch(() => {});
  void transition.finished.then(cleanup, cleanup);
  return true;
}
