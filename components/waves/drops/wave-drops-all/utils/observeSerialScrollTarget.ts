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

  function release() {
    if (!active) return;
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
