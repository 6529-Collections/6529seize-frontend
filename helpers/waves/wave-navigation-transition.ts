import { Capacitor } from "@capacitor/core";
import { PHONE_WAVES_LAYOUT_QUERY } from "@/constants/waves-layout";
import { runPhoneNavigationMotion } from "@/lib/motion/phone-navigation-registry";
import { spring } from "framer-motion";
import { MOTION_SPRINGS } from "@/lib/motion/springs";

// The app shell acknowledges the committed screen before the browser captures it.
// This keeps the outgoing list (including its scroll position) visible during the handoff.
export type WaveScreen = "list" | "feed" | "wave";
type TransitionTarget =
  | WaveScreen
  | { readonly pathname: string; readonly direction?: "forward" };

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

function getPhoneMotionDirection(target: TransitionTarget): "forward" | "back" {
  if (typeof target !== "string") return target.direction ?? "back";
  if (target === "wave") return "forward";
  const opensFeed =
    target === "feed" &&
    globalThis.location.pathname === "/waves" &&
    !new URLSearchParams(globalThis.location.search).has("wave");
  return opensFeed ? "forward" : "back";
}

export function usesFadeOnlyWaveEntry(screen: WaveScreen) {
  return screen === "wave" && Capacitor.getPlatform() === "ios";
}

let activeTransition: {
  readonly target: TransitionTarget;
  readonly sourcePathname: string;
  readonly committed: () => void;
  readonly skip: () => void;
  readonly contentReady: () => void;
} | null = null;
let navigatingWithoutAdditionalMotion = false;
let swipeHandoffPending = false;

function setConversationSpring(root: HTMLElement) {
  // Clip the near-invisible spring tail so browser snapshots are released promptly.
  const generator = spring({
    ...MOTION_SPRINGS.spatial.default,
    keyframes: [0, 1],
  });
  const samples = [0];
  let time = 0;
  do {
    time += 16;
    samples.push(Math.min(1, Math.max(0, generator.next(time).value)));
  } while (samples.at(-1)! < 0.999 && time < 1000);
  samples[samples.length - 1] = 1;
  root.style.setProperty("--wave-navigation-duration", `${time}ms`);
  root.style.setProperty(
    "--wave-navigation-easing",
    `linear(${samples.join(",")})`
  );
}

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

/** Tapped phone Back slides the full page over the supplied destination. */
export function runPhoneChevronBackTransition(
  pathname: string,
  navigate: () => void
) {
  runPhoneConversationTransition({ pathname }, navigate);
}

/** Opening a phone conversation pairs with its full-page Back slide. */
export function runPhoneConversationEntryTransition(
  pathname: string,
  navigate: () => void
) {
  runPhoneConversationTransition({ pathname, direction: "forward" }, navigate);
}

function runPhoneConversationTransition(
  target: Exclude<TransitionTarget, WaveScreen>,
  navigate: () => void
) {
  if (!window.matchMedia(PHONE_WAVES_LAYOUT_QUERY).matches) {
    navigate();
    return;
  }
  runWaveNavigationTransition(target, () =>
    navigateWithoutAdditionalMotion(navigate)
  );
}

export function consumeWaveSwipeHandoff() {
  // The destination consumes the handoff when it commits, however long routing takes.
  const pending = swipeHandoffPending;
  swipeHandoffPending = false;
  return pending;
}

export function commitWaveNavigationTransition(
  screen: WaveScreen | null,
  pathname?: string
): boolean {
  if (!activeTransition) return false;
  const { target } = activeTransition;
  const reachedTarget =
    typeof target === "string"
      ? screen === target
      : pathname === target.pathname;
  // Responsive hydration can acknowledge the outgoing page before capture runs.
  if (
    !reachedTarget &&
    typeof target !== "string" &&
    pathname === activeTransition.sourcePathname
  )
    return false;
  if (!reachedTarget) activeTransition.skip();
  else activeTransition.committed();
  return true;
}

/** The virtualized Feed reports when its rows are ready. Chevron exits only wait for the route. */
export function commitWaveNavigationContent(screen: WaveScreen) {
  if (activeTransition?.target === screen) activeTransition.contentReady();
}

export function isWaveNavigationContentPending(screen: WaveScreen) {
  return (
    activeTransition?.target === screen &&
    document.documentElement.dataset["waveNavigationContentPending"] !==
      undefined
  );
}

export function skipWaveNavigationTransition() {
  swipeHandoffPending = false;
  activeTransition?.skip();
}

function getTransitionPresentation(
  target: TransitionTarget,
  previous: string | undefined
) {
  if (typeof target !== "string")
    return target.direction === "forward"
      ? "conversation-entry"
      : "chevron-back";
  if (usesFadeOnlyWaveEntry(target)) return "wave-entry";
  return isForwardWaveNavigation(target, previous) ? "forward" : "back";
}

export function runWaveNavigationTransition(
  target: TransitionTarget,
  navigate: () => void,
  swipe?: SwipeHandoff
) {
  if (navigatingWithoutAdditionalMotion) {
    navigate();
    return false;
  }
  if (
    !swipe &&
    runPhoneNavigationMotion(getPhoneMotionDirection(target), () =>
      navigateWithoutAdditionalMotion(navigate)
    )
  )
    return true;
  swipeHandoffPending = false;
  const capturesWholePage = typeof target !== "string";
  const enteringConversation =
    typeof target !== "string" && target.direction === "forward";
  const surface = document.querySelector<HTMLElement>(
    capturesWholePage
      ? "[data-wave-swipe-page], [data-phone-wave-page]"
      : "[data-wave-navigation-screen]"
  );
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (
    !surface ||
    surface.dataset["waveNavigationScreen"] === target ||
    typeof document.startViewTransition !== "function"
  ) {
    activeTransition?.skip();
    if (!swipe) navigate();
    return false;
  }

  activeTransition?.skip();
  const root = document.documentElement;
  const sourcePathname = globalThis.location.pathname;
  if (capturesWholePage) setConversationSpring(root);
  let contentPending = target === "feed";
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
  let namedSurface = surface;
  if (!enteringConversation)
    surface.style.viewTransitionName = "wave-navigation";
  root.dataset["waveNavigationTransition"] = getTransitionPresentation(
    target,
    surface.dataset["waveNavigationScreen"]
  );
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
    namedSurface.style.removeProperty("view-transition-name");
    root.style.removeProperty("--wave-transition-height");
    root.style.removeProperty("--wave-swipe-remainder");
    root.style.removeProperty("--wave-navigation-duration");
    root.style.removeProperty("--wave-navigation-easing");
  };
  let transition: ViewTransition;
  let stopped = false;
  let superseded = false;
  try {
    transition = document.startViewTransition(async () => {
      if (superseded) return;
      // The old page is captured. Keep the destination in the stationary root
      // snapshot so its header and content stay visible together in WebKit.
      if (capturesWholePage && !enteringConversation)
        surface.style.removeProperty("view-transition-name");
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
  const viewportWidth = window.innerWidth;
  const stopForWidthChange = () => {
    if (window.innerWidth !== viewportWidth) skipMotion();
  };
  const timeout = window.setTimeout(skipMotion, 500);
  const contentReady = () => {
    contentPending = false;
    delete root.dataset["waveNavigationContentPending"];
    if (shellCommitted) window.clearTimeout(timeout);
  };
  const pending = {
    target,
    sourcePathname,
    committed: () => {
      if (enteringConversation && !stopped) {
        namedSurface =
          document.querySelector<HTMLElement>(
            "[data-wave-swipe-page], [data-phone-wave-page]"
          ) ?? surface;
        namedSurface.style.viewTransitionName = "wave-navigation";
      }
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
  if (capturesWholePage) {
    document.addEventListener("pointerdown", skipMotion, { capture: true });
    window.addEventListener("popstate", cancelNavigation);
    window.addEventListener("resize", stopForWidthChange);
  }
  const cleanup = () => {
    stopped = true;
    window.clearTimeout(timeout);
    reducedMotion.removeEventListener("change", skipMotion);
    if (capturesWholePage) {
      document.removeEventListener("pointerdown", skipMotion, true);
      window.removeEventListener("popstate", cancelNavigation);
      window.removeEventListener("resize", stopForWidthChange);
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
