"use client";

import type { ReactNode, RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

const NOTIFICATION_RENDER_MARGIN = "1200px 0px";

interface ResizeSubscription {
  readonly updateHeight: (height: number) => void;
}

const resizeSubscriptions = new Map<Element, ResizeSubscription>();
let sharedResizeObserver: ResizeObserver | null = null;

function observeHeight(
  element: HTMLElement,
  subscription: ResizeSubscription
): (() => void) | undefined {
  if (typeof ResizeObserver === "undefined") {
    return undefined;
  }

  sharedResizeObserver ??= new ResizeObserver((entries) => {
    for (const entry of entries) {
      const currentSubscription = resizeSubscriptions.get(entry.target);
      if (!currentSubscription) {
        continue;
      }

      const borderBoxSize = (entry as Partial<ResizeObserverEntry>)
        .borderBoxSize?.[0];
      currentSubscription.updateHeight(
        borderBoxSize?.blockSize ?? entry.contentRect.height
      );
    }
  });

  const observer = sharedResizeObserver;
  resizeSubscriptions.set(element, subscription);
  observer.observe(element);

  return () => {
    observer.unobserve(element);
    resizeSubscriptions.delete(element);

    if (resizeSubscriptions.size === 0) {
      observer.disconnect();
      if (sharedResizeObserver === observer) {
        sharedResizeObserver = null;
      }
    }
  };
}

interface NotificationVirtualizedItemProps {
  readonly children: ReactNode;
  readonly domId: string;
  readonly forceRender: boolean;
  readonly scrollContainerRef: RefObject<HTMLDivElement | null>;
}

export default function NotificationVirtualizedItem({
  children,
  domId,
  forceRender,
  scrollContainerRef,
}: NotificationVirtualizedItemProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isNearViewport, setIsNearViewport] = useState(true);
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);

  const updateMeasuredHeight = useCallback((height: number) => {
    if (!Number.isFinite(height) || height <= 0) {
      return;
    }

    setMeasuredHeight((currentHeight) =>
      currentHeight === height ? currentHeight : height
    );
  }, []);

  const measureHeight = useCallback(() => {
    const element = containerRef.current;
    if (element) {
      updateMeasuredHeight(element.getBoundingClientRect().height);
    }
  }, [updateMeasuredHeight]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    return observeHeight(element, { updateHeight: updateMeasuredHeight });
  }, [updateMeasuredHeight]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry?.isIntersecting ?? true;
        if (!isIntersecting) {
          measureHeight();
        }
        setIsNearViewport((currentValue) =>
          currentValue === isIntersecting ? currentValue : isIntersecting
        );
      },
      {
        root: scrollContainerRef.current,
        rootMargin: NOTIFICATION_RENDER_MARGIN,
        threshold: 0,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [measureHeight, scrollContainerRef]);

  const shouldRenderChildren =
    forceRender || isNearViewport || measuredHeight === null;

  return (
    <div
      ref={containerRef}
      id={domId}
      {...(!shouldRenderChildren && {
        "data-notification-placeholder": "true",
        style: { height: measuredHeight },
      })}
    >
      {shouldRenderChildren ? children : null}
    </div>
  );
}
