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

// Network corrects only its editor scroll position, after keyboard and result
// layout changes settle. Other consumers retain their existing centering.
const scrollFieldWithinContainer = (
  container: HTMLElement,
  field: HTMLElement
) => {
  const viewport = globalThis.visualViewport;
  const bounds = container.getBoundingClientRect();
  const top = Math.max(bounds.top, viewport?.offsetTop ?? 0) + 12;
  const bottom =
    Math.min(
      bounds.bottom,
      (viewport?.offsetTop ?? 0) + (viewport?.height ?? globalThis.innerHeight)
    ) - 12;
  const fieldBounds = field.getBoundingClientRect();
  const target =
    field.closest("[data-keyboard-scroll-target]")?.getBoundingClientRect() ??
    fieldBounds;
  const targetBottom = Math.min(target.bottom, fieldBounds.top + bottom - top);
  let delta = Math.max(0, targetBottom - bottom);
  if (fieldBounds.top - delta < top) delta = fieldBounds.top - top;
  if (Math.abs(delta) > 1)
    container.scrollBy({ top: delta, behavior: "instant" });
};

/** Position touch inputs after keyboard layout settles. */
export default function useKeyboardFocusScroll(
  containerRef: RefObject<HTMLElement | null>,
  mode: "center" | "nearest" = "center"
) {
  const { hasTouchScreen } = useDeviceInfo();

  useEffect(() => {
    const container = containerRef.current;
    if (!hasTouchScreen || !container) {
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    let activeField: HTMLElement | null = null;
    let activeTarget: Element | null = null;

    const repositionActiveField = () => {
      if (
        activeField &&
        document.activeElement === activeField &&
        activeField.isConnected
      ) {
        if (mode === "center") {
          scrollFieldIntoVisibleViewport(activeField);
          return;
        }

        scrollFieldWithinContainer(container, activeField);
      }
    };

    const scheduleReposition = () => {
      clearTimeout(timer);
      timer = setTimeout(repositionActiveField, KEYBOARD_SETTLE_MS);
    };

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (!target.matches(TEXT_ENTRY_SELECTOR)) {
        return;
      }

      if (activeTarget) observer?.unobserve(activeTarget);
      activeField = target;
      activeTarget = target.closest("[data-keyboard-scroll-target]") ?? target;
      observer?.observe(activeTarget);
      scheduleReposition();
    };

    const onFocusOut = () => {
      if (activeTarget) observer?.unobserve(activeTarget);
      activeTarget = null;
      activeField = null;
      clearTimeout(timer);
    };

    // Coalesce Network keyboard frames into one correction. Centered fields
    // also move immediately, then settle against the final scrollport height.
    const onViewportResize = () => {
      if (!activeField) return;
      if (mode === "center") repositionActiveField();
      scheduleReposition();
    };
    const observer =
      mode === "nearest" ? new ResizeObserver(scheduleReposition) : null;
    observer?.observe(container);

    container.addEventListener("focusin", onFocusIn);
    container.addEventListener("focusout", onFocusOut);
    window.visualViewport?.addEventListener("resize", onViewportResize);
    if (mode === "nearest") {
      window.visualViewport?.addEventListener("scroll", scheduleReposition, {
        passive: true,
      });
    }
    return () => {
      container.removeEventListener("focusin", onFocusIn);
      container.removeEventListener("focusout", onFocusOut);
      window.visualViewport?.removeEventListener("resize", onViewportResize);
      window.visualViewport?.removeEventListener("scroll", scheduleReposition);
      observer?.disconnect();
      clearTimeout(timer);
    };
  }, [hasTouchScreen, containerRef, mode]);
}
