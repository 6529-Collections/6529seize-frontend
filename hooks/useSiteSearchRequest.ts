"use client";

import { useEffect, useRef } from "react";

/**
 * A request to open the site search from outside the search controls (the
 * 6529 Desktop shell's Ctrl/Cmd+F). The controls that already open search on
 * Ctrl/Cmd+K listen for it too.
 */
const SITE_SEARCH_REQUEST_EVENT = "6529:open-site-search";

export function requestSiteSearch(): void {
  if (typeof window === "undefined") return;
  // Cancelable, so the first listener can claim it: one request opens at
  // most one search, even if two search controls are mounted.
  window.dispatchEvent(
    new Event(SITE_SEARCH_REQUEST_EVENT, { cancelable: true })
  );
}

/**
 * Handle site-search requests. `onRequest` returns false when this control
 * cannot open search right now, leaving the request for another listener.
 */
export function useSiteSearchRequest(onRequest: () => boolean | void): void {
  const handler = useRef(onRequest);

  useEffect(() => {
    handler.current = onRequest;
  }, [onRequest]);

  useEffect(() => {
    const listener = (event: Event) => {
      if (event.defaultPrevented) return;
      if (handler.current() !== false) event.preventDefault();
    };
    window.addEventListener(SITE_SEARCH_REQUEST_EVENT, listener);
    return () => {
      window.removeEventListener(SITE_SEARCH_REQUEST_EVENT, listener);
    };
  }, []);
}
