// The app shell acknowledges the committed screen before the browser captures it.
// This keeps the outgoing list (including its scroll position) visible during the handoff.
type WaveScreen = "list" | "wave";
let activeTransition: {
  readonly screen: WaveScreen;
  readonly committed: () => void;
  readonly skip: () => void;
} | null = null;

export function commitWaveNavigationTransition(
  screen: WaveScreen | null
): boolean {
  if (!activeTransition) return false;
  if (screen === activeTransition.screen) activeTransition.committed();
  else activeTransition.skip();
  return true;
}

export function skipWaveNavigationTransition() {
  activeTransition?.skip();
}

export function runWaveNavigationTransition(
  screen: WaveScreen,
  navigate: () => void
) {
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
    navigate();
    return;
  }

  activeTransition?.skip();
  const root = document.documentElement;
  let commit = () => {};
  const committed = new Promise<void>((resolve) => {
    commit = resolve;
  });
  root.style.setProperty(
    "--wave-transition-height",
    `${surface.getBoundingClientRect().height}px`
  );
  surface.style.viewTransitionName = "wave-navigation";
  root.dataset["waveNavigationTransition"] =
    screen === "wave" ? "forward" : "back";
  const clearSurface = () => {
    delete root.dataset["waveNavigationTransition"];
    surface.style.removeProperty("view-transition-name");
    root.style.removeProperty("--wave-transition-height");
  };
  let transition: ViewTransition;
  try {
    transition = document.startViewTransition(async () => {
      navigate();
      await committed;
    });
  } catch {
    // Motion is optional: an engine failure must not prevent navigation.
    clearSurface();
    navigate();
    return;
  }
  let stopped = false;
  const skip = () => {
    if (stopped) return;
    stopped = true;
    commit();
    transition.skipTransition();
  };
  // A route interruption must never leave the app waiting for a screen that cannot commit.
  const timeout = window.setTimeout(skip, 500);
  const pending = {
    screen,
    committed: () => {
      window.clearTimeout(timeout);
      commit();
    },
    skip,
  };
  activeTransition = pending;
  reducedMotion.addEventListener("change", skip, { once: true });
  const cleanup = () => {
    stopped = true;
    window.clearTimeout(timeout);
    reducedMotion.removeEventListener("change", skip);
    if (activeTransition !== pending) return;
    activeTransition = null;
    clearSurface();
  };
  // Skipping a transition rejects ready but still runs the navigation callback.
  void transition.ready.catch(() => {});
  void transition.finished.then(cleanup, cleanup);
}
