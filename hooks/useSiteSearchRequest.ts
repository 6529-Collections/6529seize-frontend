"use client";

import { useEffect, useRef } from "react";

/**
 * A request to open the site search from outside the search controls (the
 * 6529 Desktop shell's Ctrl/Cmd+F). The controls that already open search on
 * Ctrl/Cmd+K listen for it too.
 */
const SITE_SEARCH_REQUEST_EVENT = "6529:open-site-search";

export function requestSiteSearch(): void {
  window.dispatchEvent(new Event(SITE_SEARCH_REQUEST_EVENT));
}

export function useSiteSearchRequest(onRequest: () => void): void {
  const handler = useRef(onRequest);

  useEffect(() => {
    handler.current = onRequest;
  }, [onRequest]);

  useEffect(() => {
    const listener = () => handler.current();
    window.addEventListener(SITE_SEARCH_REQUEST_EVENT, listener);
    return () => {
      window.removeEventListener(SITE_SEARCH_REQUEST_EVENT, listener);
    };
  }, []);
}
