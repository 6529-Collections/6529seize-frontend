"use client";

import { useCallback, type CSSProperties } from "react";
import { useLayoutViewportLock } from "@/components/brain/my-stream/layout/LayoutContext";
import { observeFocusedField } from "@/helpers/focused-field-visibility";
import useCapacitor from "./useCapacitor";

const KEYBOARD_SCROLL_CONTAINER = "data-keyboard-scroll-container";

/** Fit a fixed dialog viewport without changing its panel, controls or gestures. */
export const DIALOG_KEYBOARD_VIEWPORT_STYLE: CSSProperties = {
  bottom:
    "max(var(--dialog-bottom-reserve, 0px), var(--native-keyboard-inset-bottom, 0px))",
  transition:
    "bottom var(--native-keyboard-layout-transition-duration, 0ms) var(--native-keyboard-layout-transition-easing, ease-out)",
};

export default function useDialogKeyboard(
  isOpen: boolean,
  { observeFocus = true }: { readonly observeFocus?: boolean } = {}
) {
  const { isCapacitor } = useCapacitor();
  useLayoutViewportLock(isOpen && isCapacitor);

  return useCallback(
    (element: HTMLElement | null) => {
      if (!isOpen || !element) return;
      const previousMarker = element.getAttribute(KEYBOARD_SCROLL_CONTAINER);
      element.setAttribute(KEYBOARD_SCROLL_CONTAINER, "");
      const focusedField = observeFocus
        ? observeFocusedField(element, { observeContentResize: true })
        : null;
      const viewport = globalThis.visualViewport;
      const resetBrowserViewport = () => {
        element.style.removeProperty("--native-keyboard-inset-bottom");
        element.style.removeProperty("--dialog-viewport-height");
        element.style.removeProperty("--dialog-viewport-top");
        element.style.removeProperty("top");
      };
      const fitViewport = () => {
        if (!isCapacitor && viewport) {
          if (viewport.scale > 1) {
            resetBrowserViewport();
          } else {
            const inset = Math.max(
              0,
              globalThis.innerHeight - viewport.height - viewport.offsetTop
            );
            if (inset > 0) {
              element.style.setProperty(
                "--native-keyboard-inset-bottom",
                `${inset}px`
              );
            } else {
              element.style.removeProperty("--native-keyboard-inset-bottom");
            }
            element.style.setProperty(
              "--dialog-viewport-height",
              `${viewport.height}px`
            );
            element.style.setProperty(
              "--dialog-viewport-top",
              `${viewport.offsetTop}px`
            );
            if (viewport.offsetTop > 0)
              element.style.top = `${viewport.offsetTop}px`;
            else element.style.removeProperty("top");
          }
        }
        focusedField?.reveal();
      };
      fitViewport();
      viewport?.addEventListener("resize", fitViewport);
      viewport?.addEventListener("scroll", fitViewport, { passive: true });
      return () => {
        focusedField?.disconnect();
        viewport?.removeEventListener("resize", fitViewport);
        viewport?.removeEventListener("scroll", fitViewport);
        if (!isCapacitor) resetBrowserViewport();
        if (previousMarker === null)
          element.removeAttribute(KEYBOARD_SCROLL_CONTAINER);
        else element.setAttribute(KEYBOARD_SCROLL_CONTAINER, previousMarker);
      };
    },
    [isCapacitor, isOpen, observeFocus]
  );
}
