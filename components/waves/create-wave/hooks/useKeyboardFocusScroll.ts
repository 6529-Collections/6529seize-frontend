"use client";

import { useEffect, type RefObject } from "react";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { observeFocusedField } from "@/helpers/focused-field-visibility";

const TEXT_ENTRY_SELECTOR =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]), textarea, [contenteditable="true"]';

// The software keyboard needs time to finish animating in (and the browser
// to finish its own auto-scroll) before we can position the field reliably;
// scrolling earlier fights the browser and leaves inputs half off-screen.
const KEYBOARD_SETTLE_MS = 350;

const getScrollContainer = (element: HTMLElement): HTMLElement => {
  let parent = element;
  while (
    parent.parentElement &&
    !/^(auto|scroll)$/.test(getComputedStyle(parent).overflowY)
  ) {
    parent = parent.parentElement;
  }
  return parent;
};

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
  field: HTMLElement,
  edgePadding = 12
) => {
  const viewport = globalThis.visualViewport;
  const bounds = container.getBoundingClientRect();
  const top = Math.max(bounds.top, viewport?.offsetTop ?? 0) + edgePadding;
  const bottom =
    Math.min(
      bounds.bottom,
      (viewport?.offsetTop ?? 0) + (viewport?.height ?? globalThis.innerHeight)
    ) - edgePadding;
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
  mode: "center" | "nearest" | "reveal" = "center",
  { appOnly = false }: { readonly appOnly?: boolean } = {}
) {
  const { hasTouchScreen, isApp } = useDeviceInfo();

  useEffect(() => {
    const container = containerRef.current;
    if (!hasTouchScreen || !container || (appOnly && !isApp)) {
      return;
    }
    // The shared sheet already follows each keyboard layout frame. A second
    // delayed smooth scroll would move the field again after the keyboard.
    if (container.closest("[data-keyboard-scroll-container]")) return;

    if (container.closest('[role="dialog"], dialog')) {
      const focusedField = observeFocusedField(container, {
        observeContentResize: true,
      });
      const viewport = globalThis.visualViewport;
      viewport?.addEventListener("resize", focusedField.reveal);
      viewport?.addEventListener("scroll", focusedField.reveal, {
        passive: true,
      });
      return () => {
        focusedField.disconnect();
        viewport?.removeEventListener("resize", focusedField.reveal);
        viewport?.removeEventListener("scroll", focusedField.reveal);
      };
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    let activeField: HTMLElement | null = null;
    let activeTarget: Element | null = null;
    // Vote forms sit inside the list's scrollport; move that scrollport only
    // if the field remains clipped after the native keyboard layout settles.
    const scrollContainer =
      mode === "reveal" ? getScrollContainer(container) : container;

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

        scrollFieldWithinContainer(
          scrollContainer,
          activeField,
          mode === "reveal" ? 0 : 12
        );
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
      mode !== "center" ? new ResizeObserver(scheduleReposition) : null;
    observer?.observe(container);
    if (scrollContainer !== container) observer?.observe(scrollContainer);

    container.addEventListener("focusin", onFocusIn);
    container.addEventListener("focusout", onFocusOut);
    window.visualViewport?.addEventListener("resize", onViewportResize);
    if (mode !== "center") {
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
  }, [hasTouchScreen, isApp, appOnly, containerRef, mode]);
}
