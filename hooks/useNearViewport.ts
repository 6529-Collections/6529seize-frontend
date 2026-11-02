"use client";

import {
  useCallback,
  useRef,
  useSyncExternalStore,
  type RefObject,
} from "react";

/** Visibility subscription shared by encrypted rows and individual photos. */
export function useNearViewport(
  targetRef: RefObject<HTMLElement | null>,
  rootMargin: string,
  rootRef?: RefObject<HTMLElement | null>
): boolean {
  const visible = useRef(typeof IntersectionObserver === "undefined");
  const subscribe = useCallback(
    (notify: () => void) => {
      const element = targetRef.current;
      if (!element || typeof IntersectionObserver === "undefined")
        return () => {};
      const observer = new IntersectionObserver(
        ([entry]) => {
          const next = Boolean(entry?.isIntersecting);
          if (next !== visible.current) {
            visible.current = next;
            notify();
          }
        },
        {
          root: rootRef?.current ?? element.closest("[data-e2ee-scroll]"),
          rootMargin,
        }
      );
      observer.observe(element);
      return () => observer.disconnect();
    },
    [targetRef, rootRef, rootMargin]
  );
  const getSnapshot = useCallback(() => visible.current, []);
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
