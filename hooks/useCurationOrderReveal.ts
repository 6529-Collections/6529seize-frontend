"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { CurationOrder } from "./useCurationOrder";

export function useCurationOrderReveal(
  order: CurationOrder,
  container: RefObject<HTMLElement | null>,
  scrollToIndex?: (index: number) => void
) {
  const { drops, registerReveal, revealRequest, busy, revealDrop } = order;
  const handled = useRef<CurationOrder["revealRequest"]>(null);
  useEffect(() => {
    let observer: MutationObserver | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const clear = () => {
      observer?.disconnect();
      clearTimeout(timeout);
    };
    registerReveal((id) => {
      clear();
      const index = drops.findIndex((drop) => drop.id === id);
      if (index < 0 || !container.current) return;
      const focus = () => {
        const handle = container.current?.querySelector<HTMLButtonElement>(
          `[data-curation-order-handle="${CSS.escape(id)}"]`
        );
        if (!handle) return false;
        handle.focus({ preventScroll: true });
        handle.scrollIntoView({ block: "center", behavior: "instant" });
        clear();
        return true;
      };
      if (focus()) return;
      scrollToIndex?.(index);
      observer = new MutationObserver(focus);
      observer.observe(container.current, { childList: true, subtree: true });
      timeout = setTimeout(clear, 2000);
    });
    return () => {
      clear();
      registerReveal(null);
    };
  }, [drops, registerReveal, container, scrollToIndex]);
  useEffect(() => {
    if (
      busy ||
      !revealRequest ||
      handled.current === revealRequest ||
      !drops.some((drop) => drop.id === revealRequest.id)
    )
      return;
    const frame = requestAnimationFrame(() => {
      handled.current = revealRequest;
      revealDrop(revealRequest.id);
    });
    return () => cancelAnimationFrame(frame);
  }, [busy, drops, revealRequest, revealDrop]);
}
