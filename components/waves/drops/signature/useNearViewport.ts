"use client";

import { useEffect, useState, type RefObject } from "react";

/** Starts a seal's check a little before it scrolls into view. */
const ROOT_MARGIN = "200px 0px";

const onChange = new WeakMap<Element, (near: boolean) => void>();
let sharedObserver: IntersectionObserver | null = null;

/** One observer for every seal. */
function getObserver(): IntersectionObserver {
  sharedObserver ??= new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        onChange.get(entry.target)?.(entry.isIntersecting);
      });
    },
    { rootMargin: ROOT_MARGIN }
  );
  return sharedObserver;
}

/**
 * Whether the element is near the viewport now. Without
 * IntersectionObserver every element counts as near.
 */
export function useNearViewport(ref: RefObject<Element | null>): boolean {
  const [near, setNear] = useState(
    () => typeof IntersectionObserver === "undefined"
  );
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      return;
    }
    const observer = getObserver();
    onChange.set(element, setNear);
    observer.observe(element);
    return () => {
      onChange.delete(element);
      observer.unobserve(element);
    };
  }, [ref]);
  return near;
}
