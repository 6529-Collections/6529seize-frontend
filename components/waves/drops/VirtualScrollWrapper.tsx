"use client";

import type { ReactNode } from "react";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import {
  clearWaveDropNearViewport,
  setWaveDropNearViewport,
} from "@/contexts/wave/drop-visibility";

interface ResizeSubscription {
  readonly updateHeight: (height: number) => void;
}

const resizeSubscriptions = new Map<Element, ResizeSubscription>();
let sharedResizeObserver: ResizeObserver | null = null;

function getSharedResizeObserver(): ResizeObserver | null {
  if (typeof ResizeObserver === "undefined") {
    return null;
  }

  sharedResizeObserver ??= new ResizeObserver((entries) => {
    for (const entry of entries) {
      const subscription = resizeSubscriptions.get(entry.target);
      if (!subscription) {
        continue;
      }

      const borderBoxSize = (entry as Partial<ResizeObserverEntry>)
        .borderBoxSize?.[0];
      subscription.updateHeight(
        borderBoxSize?.blockSize ?? entry.contentRect.height
      );
    }
  });

  return sharedResizeObserver;
}

function observeHeight(
  element: HTMLElement,
  subscription: ResizeSubscription
): (() => void) | undefined {
  const observer = getSharedResizeObserver();
  if (!observer) {
    return undefined;
  }

  resizeSubscriptions.set(element, subscription);
  observer.observe(element);

  return () => {
    observer.unobserve(element);
    resizeSubscriptions.delete(element);

    if (resizeSubscriptions.size === 0) {
      observer.disconnect();
      if (observer === sharedResizeObserver) {
        sharedResizeObserver = null;
      }
    }
  };
}

/**
 * Props for VirtualScrollWrapper
 */
interface VirtualScrollWrapperProps {
  /**
   * A manual delay in milliseconds to wait after media loads
   * before measuring (to account for any last-minute layout changes).
   */
  readonly delay?: number | undefined;

  readonly scrollContainerRef: React.RefObject<HTMLDivElement | null>;

  readonly dropId?: string | undefined;
  readonly dropSerialNo: number;
  readonly waveId: string;
  readonly type: DropSize;
  readonly suspendLightDropHydration?: boolean | undefined;
  readonly rootMargin?: string | undefined;

  /**
   * The child components to be rendered or virtualized.
   */
  readonly children: ReactNode;
}

/**
 * VirtualScrollWrapper (TypeScript version)
 *
 * Wraps children, measuring their rendered height once all child media
 * (images/videos) are loaded. When out of the viewport, it replaces
 * the children with an empty <div> that maintains layout by having
 * the same measured height.
 *
 * Usage Example:
 * ---------------
 * <VirtualScrollWrapper delay={500}>
 *   <p>
 *     This block of content will only fully render when in the viewport.
 *   </p>
 *   <img src="https://via.placeholder.com/600x200" alt="Example" />
 *   <p>
 *     Scroll down so this content leaves the viewport. It will be replaced
 *     by a placeholder <div> of the same height.
 *   </p>
 * </VirtualScrollWrapper>
 */
export default function VirtualScrollWrapper({
  delay = 1000,
  scrollContainerRef,
  children,
  dropId,
  dropSerialNo,
  waveId,
  type,
  suspendLightDropHydration = false,
  rootMargin = "5000px 0px 5000px 0px",
}: VirtualScrollWrapperProps) {
  const { fetchAroundSerialNo } = useMyStream();

  /**
   * isInView: Tracks if the component is currently in the viewport.
   */
  const [isInView, setIsInView] = useState<boolean>(true);

  /**
   * measuredHeight: Holds the current measured height of the content.
   * If null, it means we haven't measured the content yet.
   */
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);

  const hasMeasuredHeightRef = useRef(false);

  /**
   * containerRef: Reference to the top-level container element
   * to measure size, observe media, and attach an IntersectionObserver.
   */
  const containerRef = useRef<HTMLDivElement | null>(null);

  /**
   * measureHeight: Uses getBoundingClientRect to measure the
   * rendered height of the container element.
   */
  const updateMeasuredHeight = useCallback((height: number) => {
    if (!Number.isFinite(height) || height <= 0) {
      return;
    }

    hasMeasuredHeightRef.current = true;
    setMeasuredHeight((currentHeight) =>
      currentHeight === height ? currentHeight : height
    );
  }, []);

  const measureHeight = useCallback(() => {
    if (containerRef.current) {
      updateMeasuredHeight(containerRef.current.getBoundingClientRect().height);
    }
  }, [updateMeasuredHeight]);

  /** Keep FULL-drop height tracking active across viewport transitions. */
  useEffect(() => {
    if (type === DropSize.LIGHT) return;
    const element = containerRef.current;
    if (!element) return;

    hasMeasuredHeightRef.current = false;
    const stopObservingHeight = observeHeight(element, {
      updateHeight: updateMeasuredHeight,
    });

    return () => {
      stopObservingHeight?.();
    };
  }, [type, updateMeasuredHeight]);

  /**
   * Fall back to one delayed layout read when ResizeObserver has not supplied
   * a usable height. Cancel it while the drop is outside the render window.
   */
  useEffect(() => {
    if (type === DropSize.LIGHT || !isInView || hasMeasuredHeightRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      if (!hasMeasuredHeightRef.current) {
        measureHeight();
      }
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [delay, isInView, measureHeight, type]);

  /**
   * Intersection Observer to track if the element is in the viewport.
   * - If the component is about to leave the viewport, measure its
   *   height one more time (to capture possible changes).
   * - Update isInView state accordingly.
   */
  useEffect(() => {
    // Avoid running Intersection Observer on the server
    if (typeof window === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = !!entry?.isIntersecting;
        if (dropId) {
          setWaveDropNearViewport({
            waveId,
            dropId,
            isNearViewport: inView,
          });
        }
        if (!inView && containerRef.current && type !== DropSize.LIGHT) {
          // Capture the current border box immediately before replacing the
          // drop with its placeholder. This preserves the chat's scroll
          // geometry even if a resize notification is still pending.
          measureHeight();
        }
        setIsInView((currentValue) =>
          currentValue === inView ? currentValue : inView
        );
        if (inView && type === DropSize.LIGHT && !suspendLightDropHydration) {
          fetchAroundSerialNo(waveId, dropSerialNo);
        }
      },
      {
        // Keep enough content mounted around the reversed viewport to avoid
        // visible placeholder swaps during fast scrolling.
        rootMargin,
        threshold: 0.0,
        root: scrollContainerRef.current,
      }
    );

    const observedElement = containerRef.current;
    if (observedElement) {
      observer.observe(observedElement);
    }

    // Cleanup observer on unmount
    return () => {
      if (observedElement) {
        observer.unobserve(observedElement);
      }
      observer.disconnect();
    };
  }, [
    dropId,
    dropSerialNo,
    fetchAroundSerialNo,
    measureHeight,
    rootMargin,
    scrollContainerRef,
    suspendLightDropHydration,
    type,
    waveId,
  ]);

  useEffect(() => {
    if (!dropId) {
      return;
    }

    return () => {
      clearWaveDropNearViewport(waveId, dropId);
    };
  }, [dropId, waveId]);

  /**
   * Determine if we should render the actual children
   * or just the placeholder.
   *
   * 1. On server side (Next.js SSR), always render children.
   * 2. If in viewport, render children.
   * 3. If out of viewport, render a placeholder <div> with
   *    the same measured height.
   * 4. If we haven't measured yet (measuredHeight === null),
   *    also render children so we can measure them.
   */
  const isServer = typeof window === "undefined";
  const shouldRenderChildren = isServer || isInView || measuredHeight === null;

  return (
    <div ref={containerRef}>
      {shouldRenderChildren ? (
        children
      ) : (
        <div
          style={{
            height: measuredHeight ?? "auto",
          }}
        />
      )}
    </div>
  );
}
