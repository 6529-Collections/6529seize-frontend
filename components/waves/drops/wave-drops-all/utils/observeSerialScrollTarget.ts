export interface SerialScrollAnchor {
  readonly target: HTMLDivElement;
  readonly isActive: () => boolean;
  readonly release: () => void;
}

/** Follow the serial row across LIGHT/FULL React key changes until reader input. */
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
  // IntersectionObserver follows a DOM node, not its ID. Rebind after hydration
  // replaces that node, including when removal and insertion happen separately.
  const replacementObserver =
    targetId && typeof MutationObserver !== "undefined"
      ? new MutationObserver(() => {
          if (!container.contains(currentTarget)) restoreTarget();
        })
      : null;

  function release(event?: Event) {
    if (!active) return;
    console.warn(`[serialdbg] anchor release cause=${event?.type ?? "call"} t=${Math.round(performance.now())} stack=${event ? "" : (new Error().stack ?? "").split(String.fromCharCode(10)).slice(2, 6).map((l) => l.trim()).join(" <- ")}`);
    active = false;
    visibilityObserver?.disconnect();
    replacementObserver?.disconnect();
    for (const event of ["wheel", "touchstart", "pointerdown", "keydown"]) {
      controls.removeEventListener(event, release, true);
    }
    onRelease();
  }

  visibilityObserver?.observe(currentTarget);
  replacementObserver?.observe(container, { childList: true, subtree: true });
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
  for (const event of ["wheel", "touchstart", "pointerdown", "keydown"]) {
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
