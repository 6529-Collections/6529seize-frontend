"use client";

import { useEffect, useRef } from "react";

export function useIntersectionObserver(
  onIntersection: (state: boolean) => void
) {
  const intersectionElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (intersectionElementRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            onIntersection(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      observer.observe(intersectionElementRef.current);

      return () => observer.disconnect();
    }
  }, [onIntersection]);

  return intersectionElementRef;
}
