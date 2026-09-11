"use client";

import { useEffect, type RefObject } from "react";
import useDeviceInfo from "@/hooks/useDeviceInfo";

const TEXT_ENTRY_SELECTOR =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]), textarea, [contenteditable="true"]';

// The software keyboard needs time to finish animating in (and the browser
// to finish its own auto-scroll) before we can position the field reliably;
// scrolling earlier fights the browser and leaves inputs half off-screen.
const KEYBOARD_SETTLE_MS = 350;

const scrollFieldIntoVisibleViewport = (field: HTMLElement) => {
  // scrollIntoView delegates to the browser, which knows which ancestor
  // actually scrolls (the create-wave flow scrolls inside a modal container,
  // not the document — a manual window.scrollBy is a no-op there). block
  // "center" lands the field in the middle of the scrollport, above the
  // software keyboard, and stays correct as the visual viewport shrinks.
  field.scrollIntoView({ behavior: "smooth", block: "center" });
};

/**
 * On touch-first devices, deliberately scrolls whichever text field receives
 * focus inside the container into the visible region of the viewport once the
 * software keyboard has settled, instead of leaving the field wherever the
 * browser's default keyboard-avoidance dumped it.
 *
 * A single fixed delay is not enough: the keyboard can finish animating (and
 * the visual viewport finish shrinking) *after* that delay, especially on
 * slower devices, which leaves the field parked under the keyboard. So the
 * focused field is also re-positioned on every visualViewport resize while it
 * stays focused — that is the event that actually fires when the keyboard
 * arrives, however long it takes.
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
    let activeField: HTMLElement | null = null;

    const repositionActiveField = () => {
      if (
        activeField &&
        document.activeElement === activeField &&
        activeField.isConnected
      ) {
        scrollFieldIntoVisibleViewport(activeField);
      }
    };

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (!target.matches(TEXT_ENTRY_SELECTOR)) {
        return;
      }

      activeField = target;
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(repositionActiveField, KEYBOARD_SETTLE_MS);
    };

    const onFocusOut = () => {
      activeField = null;
    };

    // The keyboard shrinking the viewport is a visualViewport resize; re-run
    // the reposition then so a late keyboard still tucks the field into view.
    const onViewportResize = () => repositionActiveField();

    container.addEventListener("focusin", onFocusIn);
    container.addEventListener("focusout", onFocusOut);
    window.visualViewport?.addEventListener("resize", onViewportResize);
    return () => {
      container.removeEventListener("focusin", onFocusIn);
      container.removeEventListener("focusout", onFocusOut);
      window.visualViewport?.removeEventListener("resize", onViewportResize);
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [hasTouchScreen, containerRef]);
}
