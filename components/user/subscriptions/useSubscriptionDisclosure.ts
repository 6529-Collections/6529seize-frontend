"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Open a subscription dialog for existing hash links without moving the page. */
export function useSubscriptionDisclosure(
  id: string,
  enabled = true,
  focusId = `${id}-title`,
  mediaQuery?: string
) {
  const [expanded, setExpandedState] = useState(false);
  const initialHashId = useRef<string | undefined>(undefined);
  const setExpanded = useCallback(
    (open: boolean) => {
      setExpandedState(open);
      if (!open && window.location.hash === `#${id}`) {
        window.history.replaceState(
          window.history.state,
          "",
          window.location.pathname + window.location.search
        );
      }
    },
    [id]
  );

  useEffect(() => {
    if (!enabled) return;
    const sheetViewport = mediaQuery
      ? window.matchMedia(mediaQuery)
      : undefined;
    let frame: number | undefined;
    const revealHash = () => {
      if (
        sheetViewport?.matches !== false &&
        window.location.hash === `#${id}`
      ) {
        setExpanded(true);
      }
    };
    const revealLink = (event: MouseEvent) => {
      if (
        sheetViewport?.matches === false ||
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
      event.preventDefault();
      if (window.location.hash !== link.hash) {
        window.history.pushState(window.history.state, "", link.href);
      }
      setExpanded(true);
      // A repeated click on the current hash does not emit hashchange.
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        document.getElementById(focusId)?.focus({ preventScroll: true })
      );
    };
    // Resizing can close a sheet, but only navigation or a click may open one.
    const closeOutsideSheetViewport = () => {
      if (sheetViewport?.matches === false) setExpanded(false);
    };
    let initialFrame: number | undefined;
    if (initialHashId.current !== id) {
      initialFrame = requestAnimationFrame(() => {
        initialHashId.current = id;
        revealHash();
      });
    }
    sheetViewport?.addEventListener("change", closeOutsideSheetViewport);
    window.addEventListener("hashchange", revealHash);
    document.addEventListener("click", revealLink, true);
    return () => {
      if (initialFrame !== undefined) cancelAnimationFrame(initialFrame);
      sheetViewport?.removeEventListener("change", closeOutsideSheetViewport);
      window.removeEventListener("hashchange", revealHash);
      document.removeEventListener("click", revealLink, true);
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [id, enabled, focusId, mediaQuery, setExpanded]);
  return { expanded, setExpanded };
}
