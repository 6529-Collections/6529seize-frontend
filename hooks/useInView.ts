"use client";

import { useEffect, useRef, useState } from "react";

interface UseInViewOptions extends IntersectionObserverInit {
  readonly freezeOnceVisible?: boolean | undefined;
}

const DEFAULT_ROOT_MARGIN = "1000px 0px";

export function useInView<T extends HTMLElement>(
  options: UseInViewOptions = {}
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { freezeOnceVisible = true, root, rootMargin, threshold } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (freezeOnceVisible && isVisible) return; // already visible -> skip

    const io = new IntersectionObserver(
      ([entry]) => {
        const nextVisible = entry?.isIntersecting ?? false;
        setIsVisible(nextVisible);
        if (freezeOnceVisible && nextVisible) {
          io.disconnect();
        }
      },
      {
        rootMargin: rootMargin ?? DEFAULT_ROOT_MARGIN,
        ...(root !== undefined ? { root } : {}),
        ...(threshold !== undefined ? { threshold } : {}),
      }
    );

    io.observe(element);
    return () => io.disconnect();
  }, [freezeOnceVisible, isVisible, root, rootMargin, threshold]);

  return [ref, isVisible];
}
