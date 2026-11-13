const activeHolds = new WeakMap<HTMLElement, () => void>();

/**
 * Keeps a row of the reversed wave chat still on screen while content is
 * inserted or resized below it, and returns a function that ends the hold.
 *
 * The chat scrolls from its bottom edge, so content added between a row and
 * the bottom pushes that row up the screen. Browsers that anchor scrolling
 * correct this themselves; others (Safari) do not. The hold turns the
 * browser's own anchoring off for its duration and applies the correction
 * itself, so every engine behaves the same way.
 *
 * It tracks the row's distance from the bottom of the content, which reader
 * scrolling does not change, so it never fights a scroll in progress.
 */
export const holdReverseScrollAnchor = (
  container: HTMLElement,
  anchor: Element
): (() => void) => {
  // Two holds would each correct the same insertion.
  activeHolds.get(container)?.();

  const content = container.firstElementChild;
  if (!content || typeof ResizeObserver === "undefined") {
    return () => undefined;
  }

  const getDistanceFromBottom = () =>
    content.getBoundingClientRect().bottom -
    anchor.getBoundingClientRect().bottom;

  let distance = getDistanceFromBottom();
  const restore = () => {
    if (!container.contains(anchor)) return;
    const nextDistance = getDistanceFromBottom();
    const growth = nextDistance - distance;
    distance = nextDistance;
    if (Math.abs(growth) >= 1) {
      container.scrollTop -= growth;
    }
  };

  const previousOverflowAnchor = container.style.overflowAnchor;
  container.style.overflowAnchor = "none";
  // Runs after layout and before paint, so the correction is never visible.
  const observer = new ResizeObserver(restore);
  observer.observe(content);

  let active = true;
  const release = () => {
    if (!active) return;
    active = false;
    restore();
    observer.disconnect();
    container.style.overflowAnchor = previousOverflowAnchor;
    if (activeHolds.get(container) === release) {
      activeHolds.delete(container);
    }
  };
  activeHolds.set(container, release);
  return release;
};
