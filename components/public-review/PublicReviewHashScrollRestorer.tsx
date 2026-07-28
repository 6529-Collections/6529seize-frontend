"use client";

import { useEffect, useRef } from "react";

function getHashTarget(): HTMLElement | null {
  const encodedId = window.location.hash.slice(1);
  if (!encodedId) {
    return null;
  }
  try {
    return document.getElementById(decodeURIComponent(encodedId));
  } catch {
    return null;
  }
}

export function PublicReviewHashScrollRestorer() {
  const markerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let observer: MutationObserver | null = null;
    let observerTimeout: number | null = null;

    const stopObserving = (): void => {
      observer?.disconnect();
      observer = null;
      if (observerTimeout !== null) {
        window.clearTimeout(observerTimeout);
        observerTimeout = null;
      }
    };

    const restoreHashPosition = (): void => {
      stopObserving();
      if (!window.location.hash) {
        return;
      }

      const scrollToTarget = (): boolean => {
        const target = getHashTarget();
        if (!target) {
          return false;
        }
        target.scrollIntoView({ behavior: "auto", block: "start" });
        return true;
      };

      if (scrollToTarget()) {
        return;
      }

      observer = new MutationObserver(() => {
        if (scrollToTarget()) {
          stopObserving();
        }
      });
      observer.observe(markerRef.current?.parentElement ?? document.body, {
        childList: true,
        subtree: true,
      });
      observerTimeout = window.setTimeout(stopObserving, 10_000);
    };

    const animationFrame = window.requestAnimationFrame(restoreHashPosition);
    window.addEventListener("hashchange", restoreHashPosition);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("hashchange", restoreHashPosition);
      stopObserving();
    };
  }, []);

  return <span ref={markerRef} aria-hidden="true" className="tw-hidden" />;
}
