"use client";

import { useState, useSyncExternalStore, type RefCallback } from "react";

/**
 * Draw at the width you get (EXPLAINED.md §7.1): a figure reads its
 * container's width and sets its viewBox to it, so its text never scales
 * below its set size. Until the browser measures, the figure draws at
 * `fallback` (the server's guess for its column), on the server and in the
 * first client render alike, so hydration matches.
 */
export function useMeasuredWidth<T extends HTMLElement>(
  fallback: number
): [RefCallback<T>, number] {
  const [store] = useState(() => widthStore(fallback));
  const width = useSyncExternalStore(
    store.subscribe,
    store.read,
    () => fallback
  );
  return [store.attach, width];
}

/** The element's width, kept outside React and read through a subscription. */
function widthStore(fallback: number) {
  let width = fallback;
  let element: HTMLElement | null = null;
  let notify: (() => void) | null = null;
  let observer: ResizeObserver | null = null;

  const measure = () => {
    if (element === null) {
      return;
    }
    const next = Math.floor(element.getBoundingClientRect().width);
    if (next > 0 && next !== width) {
      width = next;
      notify?.();
    }
  };
  const stop = () => {
    observer?.disconnect();
    observer = null;
  };
  const watch = () => {
    stop();
    if (element === null || notify === null) {
      return;
    }
    measure();
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(measure);
      observer.observe(element);
    }
  };

  return {
    read: () => width,
    subscribe: (onChange: () => void) => {
      notify = onChange;
      watch();
      return () => {
        notify = null;
        stop();
      };
    },
    attach: (node: HTMLElement | null) => {
      element = node;
      watch();
    },
  };
}
