"use client";

import { useEffect, type RefObject } from "react";
import useDeviceInfo from "@/hooks/useDeviceInfo";

const TEXT_ENTRY_SELECTOR =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]), textarea, [contenteditable="true"]';

// The software keyboard needs time to finish animating in (and the browser
// to finish its own auto-scroll) before we can position the field reliably;
// scrolling earlier fights the browser and leaves inputs half off-screen.
const KEYBOARD_SETTLE_MS = 350;

// Where in the *visible* viewport the field should end up, as a fraction of
// its height from the top. High enough to keep the field's label in view,
// low enough to clear sticky headers.
const TARGET_VIEWPORT_FRACTION = 0.3;

const scrollFieldIntoVisibleViewport = (field: HTMLElement) => {
  const visualViewport = window.visualViewport;
  if (!visualViewport) {
    field.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  // getBoundingClientRect is relative to the layout viewport; the region the
  // keyboard leaves visible is [offsetTop, offsetTop + height) of the visual
  // viewport. scrollIntoView knows nothing about the keyboard and happily
  // centres fields underneath it.
  const fieldTop = field.getBoundingClientRect().top;
  const targetTop =
    visualViewport.offsetTop +
    visualViewport.height * TARGET_VIEWPORT_FRACTION;
  window.scrollBy({ top: fieldTop - targetTop, behavior: "smooth" });
};

/**
 * On touch-first devices, deliberately scrolls whichever text field receives
 * focus inside the container to the centre of the viewport once the software
 * keyboard has settled, instead of leaving the field wherever the browser's
 * default keyboard-avoidance dumped it.
 */
export default function useKeyboardFocusScroll(
  containerRef: RefObject<HTMLElement | null>
) {
  const { hasTouchScreen } = useDeviceInfo();

  useEffect(() => {
    const container = containerRef.current;
    if (!hasTouchScreen || !container) {
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (!target.matches(TEXT_ENTRY_SELECTOR)) {
        return;
      }

      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        if (document.activeElement !== target) {
          return;
        }
        scrollFieldIntoVisibleViewport(target);
      }, KEYBOARD_SETTLE_MS);
    };

    container.addEventListener("focusin", onFocusIn);
    return () => {
      container.removeEventListener("focusin", onFocusIn);
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [hasTouchScreen, containerRef]);
}
