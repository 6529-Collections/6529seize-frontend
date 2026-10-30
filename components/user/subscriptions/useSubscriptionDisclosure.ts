"use client";

import { useEffect, useState } from "react";

/** Keep the tab's existing hash destinations reachable inside disclosures. */
export function useSubscriptionDisclosure(id: string, enabled = true) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let frame: number | undefined;
    const revealHash = () => {
      if (window.location.hash === `#${id}`) setExpanded(true);
    };
    const revealLink = (event: MouseEvent) => {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (!(link instanceof HTMLAnchorElement)) return;
      if (
        link.origin !== window.location.origin ||
        link.pathname !== window.location.pathname ||
        link.search !== window.location.search ||
        link.hash !== `#${id}`
      )
        return;
      setExpanded(true);
      // A repeated click on the current hash does not emit hashchange.
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        document.getElementById(`${id}-title`)?.focus({ preventScroll: true })
      );
    };
    const initialFrame = requestAnimationFrame(revealHash);
    window.addEventListener("hashchange", revealHash);
    document.addEventListener("click", revealLink);
    return () => {
      cancelAnimationFrame(initialFrame);
      window.removeEventListener("hashchange", revealHash);
      document.removeEventListener("click", revealLink);
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [id, enabled]);
  return { expanded, setExpanded };
}
