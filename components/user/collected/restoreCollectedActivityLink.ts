const RESTORATION_WINDOW_MS = 2_000;
const USER_INPUT_EVENTS = [
  "wheel",
  "touchstart",
  "pointerdown",
  "keydown",
] as const;

/** Keep a returned row visible while Details and browser scroll restoration settle. */
export function restoreCollectedActivityLink(link: HTMLAnchorElement) {
  const fragment = `#${link.id}`;
  if (globalThis.location.hash !== fragment) return;

  let stopped = false;
  let frame: number | null = null;
  let intersecting = true;

  const reveal = () =>
    link.scrollIntoView({
      behavior: "instant",
      block: "center",
      inline: "nearest",
    });

  const stop = () => {
    if (stopped) return;
    stopped = true;
    if (frame !== null) globalThis.cancelAnimationFrame(frame);
    globalThis.clearTimeout(deadline);
    intersectionObserver?.disconnect();
    resizeObserver?.disconnect();
    for (const event of USER_INPUT_EVENTS) {
      globalThis.removeEventListener(event, stop, true);
    }
    globalThis.removeEventListener("focusin", onFocusChange, true);
    globalThis.removeEventListener("hashchange", stop);
    globalThis.removeEventListener("popstate", stop);
  };

  const correct = () => {
    frame = null;
    if (stopped) return;
    if (
      !link.isConnected ||
      globalThis.location.hash !== fragment ||
      globalThis.document.activeElement !== link
    ) {
      stop();
      return;
    }
    const bounds = link.getBoundingClientRect();
    const inViewport =
      bounds.bottom > 0 &&
      bounds.top < globalThis.innerHeight &&
      bounds.right > 0 &&
      bounds.left < globalThis.innerWidth;
    if (!intersecting || !inViewport) reveal();
  };

  const scheduleCorrection = () => {
    if (!stopped && frame === null) {
      frame = globalThis.requestAnimationFrame(correct);
    }
  };

  const onFocusChange = () => {
    if (globalThis.document.activeElement !== link) stop();
  };
  const intersectionObserver =
    typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(
          (entries) => {
            const entry = entries.at(-1);
            if (!entry) return;
            intersecting = entry.isIntersecting && entry.intersectionRatio > 0;
            if (!intersecting) scheduleCorrection();
          },
          { threshold: [0, 0.01] }
        );
  const resizeObserver =
    typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(scheduleCorrection);
  const deadline = globalThis.setTimeout(stop, RESTORATION_WINDOW_MS);

  link.focus({ preventScroll: true });
  reveal();
  intersectionObserver?.observe(link);
  // Ancestors include the animated clipping panel and content above the row.
  for (
    let element: HTMLElement | null = link;
    element;
    element = element.parentElement
  ) {
    resizeObserver?.observe(element);
  }
  for (const event of USER_INPUT_EVENTS) {
    globalThis.addEventListener(event, stop, { capture: true, passive: true });
  }
  globalThis.addEventListener("focusin", onFocusChange, true);
  globalThis.addEventListener("hashchange", stop);
  globalThis.addEventListener("popstate", stop);
  scheduleCorrection();

  return stop;
}
