"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

interface NotificationVirtualWrapperProps {
  readonly children: ReactNode;
  readonly scrollContainerRef?: RefObject<HTMLDivElement | null>;
  readonly measurementDelay?: number;
}

const DEFAULT_MEASUREMENT_DELAY = 150;
const DEFAULT_ROOT_MARGIN = "600px 0px";

/**
 * Lightweight virtualization wrapper for notification list items.
 *
 * Keeps the actual notification in the DOM only while it is near the viewport.
 * When it scrolls away, the component renders a placeholder div with the last
 * measured height so the layout remains stable without rendering heavy content.
 */
export default function NotificationVirtualWrapper({
  children,
  scrollContainerRef,
  measurementDelay = DEFAULT_MEASUREMENT_DELAY,
}: NotificationVirtualWrapperProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(true);
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);
  const measureRafRef = useRef<number | null>(null);

  const isServer = typeof window === "undefined";

  const measureHeight = useCallback(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const readDimensions = () => {
      const rect = element.getBoundingClientRect();
      if (rect.height <= 0) {
        return;
      }

      const nextHeight = Math.round(rect.height);
      setMeasuredHeight((previous) =>
        previous === nextHeight ? previous : nextHeight
      );
    };

    if (typeof window === "undefined") {
      readDimensions();
      return;
    }

    if (measureRafRef.current !== null) {
      window.cancelAnimationFrame(measureRafRef.current);
    }

    measureRafRef.current = window.requestAnimationFrame(() => {
      measureRafRef.current = null;
      readDimensions();
    });
  }, []);

  useEffect(() => {
    if (isServer) return;
    const timeoutId = window.setTimeout(() => {
      measureHeight();
    }, measurementDelay);
    return () => window.clearTimeout(timeoutId);
  }, [isServer, measurementDelay, measureHeight]);

  useEffect(() => {
    if (isServer) return;

    const element = containerRef.current;
    if (!element) {
      return;
    }

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      if (isInView) {
        measureHeight();
      }
    });

    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, [isServer, measureHeight, isInView]);

  useEffect(() => {
    if (isServer) return;

    const rootElement = scrollContainerRef?.current ?? null;
    if (typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) {
          return;
        }
        const inView = entry.isIntersecting;

        if (!inView) {
          measureHeight();
        }

        setIsInView((prev) => (prev === inView ? prev : inView));
      },
      {
        root: rootElement,
        rootMargin: DEFAULT_ROOT_MARGIN,
        threshold: 0,
      }
    );

    const element = containerRef.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
      observer.disconnect();
    };
  }, [isServer, scrollContainerRef, measureHeight]);

  useEffect(() => {
    return () => {
      if (typeof window === "undefined") {
        return;
      }
      if (measureRafRef.current !== null) {
        window.cancelAnimationFrame(measureRafRef.current);
        measureRafRef.current = null;
      }
    };
  }, []);

  const shouldRenderChildren = isServer || measuredHeight === null || isInView;

  return (
    <div ref={containerRef}>
      {shouldRenderChildren ? (
        children
      ) : (
        <div style={{ height: measuredHeight ?? 0 }} />
      )}
    </div>
  );
}
