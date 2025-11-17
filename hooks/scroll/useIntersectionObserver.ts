"use client";

import { RefObject, useEffect, useEffectEvent } from "react";

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
  targetRef: RefObject<Element | null>,
  options: UseIntersectionObserverOptions,
  callback: (entry: IntersectionObserverEntry) => void,
  enabled: boolean = true
): void {
  const { root, rootMargin, threshold, freezeOnceVisible } = options;

  const handleEntry = useEffectEvent(
    (entry: IntersectionObserverEntry, observer: IntersectionObserver) => {
      callback(entry);

      if (freezeOnceVisible && entry.isIntersecting) {
        observer.disconnect();
      }
    }
  );

  useEffect(() => {
    const target = targetRef.current;

    if (!enabled || !target) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];

      if (!entry) {
        return;
      }

      handleEntry(entry, observer);
    }, {
      root,
      rootMargin,
      threshold,
    });

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [targetRef, root, rootMargin, threshold, enabled, handleEntry]);
}
