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
let navigatingFromSwipe = false;
let swipeHandoffPending = false;

/** The interactive gesture already animated the outgoing screen. */
export function navigateAfterWaveSwipe(navigate: () => void) {
  skipWaveNavigationTransition();
  navigateFromSwipe(navigate);
}

function navigateFromSwipe(navigate: () => void) {
  swipeHandoffPending = true;
  navigatingFromSwipe = true;
  try {
    navigate();
  } finally {
    navigatingFromSwipe = false;
  }
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
  swipe?: SwipeHandoff
) {
  if (navigatingFromSwipe) {
    navigate();
    return false;
  }
  swipeHandoffPending = false;
  const surface = document.querySelector<HTMLElement>(
    "[data-wave-navigation-screen]"
  );
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (
    !surface ||
    surface.dataset["waveNavigationScreen"] === screen ||
    typeof document.startViewTransition !== "function" ||
    reducedMotion.matches
  ) {
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
  root.dataset["waveNavigationTransition"] = isForwardWaveNavigation(
    screen,
    surface.dataset["waveNavigationScreen"]
  )
    ? "forward"
    : "back";
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
      // The browser has captured the finger's final position. Prepare the new
      // screen underneath that snapshot, rather than sliding into an empty shell.
      swipe?.surface.style.removeProperty("transform");
      swipe?.surface.style.removeProperty("will-change");
      if (swipe) navigateFromSwipe(navigate);
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
    transition.skipTransition();
  };
  // A route interruption must never leave the app waiting for a screen that cannot commit.
  const skipMotion = () => skip(false);
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
  const cleanup = () => {
    stopped = true;
    window.clearTimeout(timeout);
    reducedMotion.removeEventListener("change", skipMotion);
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
