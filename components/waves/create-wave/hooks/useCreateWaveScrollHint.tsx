"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type RefObject,
} from "react";

interface CreateWaveScrollHint {
  /** True while the active scroller still has content below the fold. */
  readonly canScrollDown: boolean;
}

const CreateWaveScrollHintContext = createContext<CreateWaveScrollHint>({
  canScrollDown: false,
});

export const CreateWaveScrollHintProvider =
  CreateWaveScrollHintContext.Provider;

export function useCreateWaveScrollHint(): CreateWaveScrollHint {
  return useContext(CreateWaveScrollHintContext);
}

// Whether the create-wave scroller can still scroll down, so the sticky footer
// can show a "more below" fade (and, by its absence, signal the end of the
// step). The scroller differs by surface and must be read live: the modal
// scrolls the internal region (regionRef); the native route lets the document
// scroll (pageScroll). Recompute on scroll, viewport resize, and content growth
// (step changes and the software-keyboard inset both change the height).
export function useCanScrollDown(
  regionRef: RefObject<HTMLElement | null>,
  pageScroll: boolean
): boolean {
  const [canScrollDown, setCanScrollDown] = useState(false);

  useEffect(() => {
    const browserWindow = globalThis.window;
    if (!browserWindow) {
      return;
    }
    const region = regionRef.current;
    const scroller: HTMLElement | null = pageScroll
      ? ((document.scrollingElement as HTMLElement | null) ??
        document.documentElement)
      : region;
    if (!scroller) {
      return;
    }

    const compute = () => {
      const remaining =
        scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
      // Small epsilon so sub-pixel rounding doesn't flicker the hint at the end.
      setCanScrollDown(remaining > 2);
    };
    compute();

    const scrollTarget: Window | HTMLElement = pageScroll
      ? browserWindow
      : scroller;
    scrollTarget.addEventListener("scroll", compute, { passive: true });
    browserWindow.addEventListener("resize", compute);
    browserWindow.visualViewport?.addEventListener("resize", compute);

    // The region grows/shrinks as steps swap and the keyboard inset changes;
    // observe it so the hint tracks height changes without a scroll event.
    const observed = region ?? scroller;
    const resizeObserver = new ResizeObserver(compute);
    resizeObserver.observe(observed);

    return () => {
      scrollTarget.removeEventListener("scroll", compute);
      browserWindow.removeEventListener("resize", compute);
      browserWindow.visualViewport?.removeEventListener("resize", compute);
      resizeObserver.disconnect();
    };
  }, [regionRef, pageScroll]);

  return canScrollDown;
}
