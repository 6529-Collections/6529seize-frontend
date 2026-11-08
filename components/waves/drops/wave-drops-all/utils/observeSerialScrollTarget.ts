export interface SerialScrollAnchor {
  readonly target: HTMLDivElement;
  readonly isActive: () => boolean;
  readonly release: () => void;
}

// A scroll counts as settled once no scroll event has arrived for this long.
const SCROLL_SETTLE_MS = 120;
const READER_INPUT_EVENTS = ["wheel", "touchstart", "pointerdown", "keydown"];

/**
 * Keeps the serial row in view until reader input, following it across
 * LIGHT/FULL React key changes.
 *
 * The IntersectionObserver reports the row crossing the view's edge. A layout
 * change can also carry the row from one side of the view to the other within
 * one frame, for example when placeholder rows hydrate to a smaller height
 * while a jump is still scrolling; the row is out of view before and after,
 * so no crossing is reported. The anchor therefore re-checks the row whenever
 * the list content resizes and whenever a scroll settles.
 */
export const observeSerialScrollTarget = ({
  container,
  target,
  onTarget,
  onRelease,
}: {
  readonly container: HTMLDivElement;
  readonly target: HTMLDivElement;
  readonly onTarget: (target: HTMLDivElement) => void;
  readonly onRelease: () => void;
}): SerialScrollAnchor => {
  const targetId = target.id;
  const controls = container.parentElement ?? container;
  let currentTarget = target;
  let active = true;
  let settleTimer: ReturnType<typeof setTimeout> | null = null;

  const restoreTarget = () => {
    console.warn(`[serialdbg] anchor restore active=${active} containerConnected=${container.isConnected} targetConnected=${currentTarget.isConnected}`);
    if (!active) return;
    if (!container.contains(currentTarget)) {
      const replacement = targetId
        ? container.ownerDocument.getElementById(targetId)
        : null;
      if (!replacement || !container.contains(replacement)) return;
      visibilityObserver?.unobserve(currentTarget);
      currentTarget = replacement as HTMLDivElement;
      visibilityObserver?.observe(currentTarget);
    }
    onTarget(currentTarget);
  };

  const visibilityObserver =
    typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(restoreTarget, {
          root: container,
          threshold: [0, 1],
        });
  // The list content grows and shrinks as rows hydrate and media loads; the
  // scroll container itself keeps its size.
  const contentObserver =
    typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(restoreTarget);
  const observeContent = () => {
    for (const child of Array.from(container.children)) {
      contentObserver?.observe(child);
    }
  };
  // IntersectionObserver follows a DOM node, not its ID. Rebind after hydration
  // replaces that node, including when removal and insertion happen separately.
  const replacementObserver =
    typeof MutationObserver === "undefined"
      ? null
      : new MutationObserver(() => {
          observeContent();
          if (targetId && !container.contains(currentTarget)) restoreTarget();
        });

  const onScroll = () => {
    if (settleTimer !== null) clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      settleTimer = null;
      restoreTarget();
    }, SCROLL_SETTLE_MS);
  };

  function release(event?: Event) {
    if (!active) return;
    console.warn(`[serialdbg] anchor release cause=${event?.type ?? "call"} t=${Math.round(performance.now())}`);
    active = false;
    visibilityObserver?.disconnect();
    contentObserver?.disconnect();
    replacementObserver?.disconnect();
    container.removeEventListener("scroll", onScroll);
    if (settleTimer !== null) clearTimeout(settleTimer);
    settleTimer = null;
    for (const event of READER_INPUT_EVENTS) {
      controls.removeEventListener(event, release, true);
    }
    onRelease();
  }

  visibilityObserver?.observe(currentTarget);
  observeContent();
  replacementObserver?.observe(container, { childList: true, subtree: true });
  container.addEventListener("scroll", onScroll, { passive: true });
  // DEBUG: sample the anchor's view of the world for 12 s.
  let samples = 0;
  const sampler = setInterval(() => {
    samples += 1;
    const live = container.ownerDocument.getElementById(targetId);
    const containerRect = container.getBoundingClientRect();
    const liveRect = live?.getBoundingClientRect();
    console.warn(
      `[serialdbg] anchor sample#${samples} active=${active} containerConnected=${container.isConnected} targetConnected=${currentTarget.isConnected} liveInContainer=${Boolean(live && container.contains(live))} scrollTop=${Math.round(container.scrollTop)} cTop=${Math.round(containerRect.top)} cH=${Math.round(containerRect.height)} liveTop=${liveRect ? Math.round(liveRect.top) : "none"} liveH=${liveRect ? Math.round(liveRect.height) : "none"}`
    );
    if (samples >= 12) clearInterval(sampler);
  }, 1000);
  for (const event of READER_INPUT_EVENTS) {
    controls.addEventListener(event, release, { capture: true, passive: true });
  }

  return {
    get target() {
      return currentTarget;
    },
    isActive: () => active,
    release,
  };
};
