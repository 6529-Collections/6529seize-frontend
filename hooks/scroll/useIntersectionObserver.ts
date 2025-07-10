"use client";

import { RefObject, useEffect } from "react";

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
  targetRef: RefObject<Element | null>,
  options: UseIntersectionObserverOptions,
  callback: (entry: IntersectionObserverEntry) => void,
  enabled: boolean = true
): void {
  useEffect(() => {
    const target = targetRef.current;

    if (!enabled || !target) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]) {
        callback(entries[0]);

        if (options.freezeOnceVisible && entries[0].isIntersecting) {
          observer.disconnect();
        }
      }
    }, options);

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [
    targetRef,
    options.rootMargin,
    options.threshold,
    enabled,
    callback,
    options.freezeOnceVisible,
  ]);
}
