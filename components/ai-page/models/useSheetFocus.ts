"use client";

import { useEffect, type RefObject } from "react";

/** The phone's Filters sheet. */
export const SHEET_ID = "ai-model-filters";
const FOCUSABLE = "input, select, button, a[href]";

/**
 * On a phone, the open Filters sheet holds the keyboard: the focus starts
 * on its first control, Tab and Shift+Tab stay inside it, Escape closes
 * it, and the focus goes back to the Filters button when it closes.
 */
export function useSheetFocus(
  open: boolean,
  close: () => void,
  opener: RefObject<HTMLButtonElement | null>
): void {
  useEffect(() => {
    const sheet = open ? document.getElementById(SHEET_ID) : null;
    if (!sheet) {
      return undefined;
    }
    const button = opener.current;
    const controls = () =>
      Array.from(sheet.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (control) => !control.hasAttribute("disabled")
      );
    controls()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      const list = controls();
      const first = list[0];
      const last = list.at(-1);
      if (!first || !last) {
        return;
      }
      const at = document.activeElement;
      const outside = !sheet.contains(at);
      if (event.shiftKey && (outside || at === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (outside || at === last)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      button?.focus();
    };
  }, [open, close, opener]);
}
