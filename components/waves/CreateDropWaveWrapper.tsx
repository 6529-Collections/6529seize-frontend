"use client";

import React, { useEffect, useCallback, useMemo, useRef } from "react";
import useCapacitor from "@/hooks/useCapacitor";
import { useDebouncedCallback } from "use-debounce";

export enum CreateDropWaveWrapperContext {
  WAVE_CHAT = "WAVE_CHAT",
  SINGLE_DROP = "SINGLE_DROP",
}

interface CreateDropWaveWrapperProps {
  readonly children: React.ReactNode;
  readonly context?: CreateDropWaveWrapperContext | undefined;
}

function useResizeObserver(
  containerRef: React.RefObject<HTMLDivElement | null>,
  fixedBottomRef: React.RefObject<HTMLDivElement | null>,
  enabled: boolean
) {
  const handleResize = useCallback(() => {
    const container = containerRef.current;
    const fixedBottom = fixedBottomRef.current;
    if (!container || !fixedBottom) return;
    const containerRect = container.getBoundingClientRect();
    const fixedBottomRect = fixedBottom.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    if (fixedBottomRect.bottom > viewportHeight) {
      window.scrollTo({
        top: window.scrollY + (fixedBottomRect.bottom - viewportHeight) + 20,
        behavior: "smooth",
      });
    } else if (fixedBottomRect.bottom < viewportHeight) {
      const newScrollTop = Math.max(
        0,
        window.scrollY - (viewportHeight - fixedBottomRect.bottom) + 20
      );
      window.scrollTo({
        top: newScrollTop,
        behavior: "smooth",
      });
    }

    if (containerRect.top < 0) {
      window.scrollTo({
        top: window.scrollY + containerRect.top,
        behavior: "smooth",
      });
    }
  }, [containerRef, fixedBottomRef]);

  const debouncedHandleResize = useDebouncedCallback(handleResize, 100);

  useEffect(() => {
    if (!enabled) return;
    if (!containerRef.current || !fixedBottomRef.current) return;
    const observer = new ResizeObserver(debouncedHandleResize);
    observer.observe(containerRef.current);
    observer.observe(fixedBottomRef.current);

    return () => observer.disconnect();
  }, [debouncedHandleResize, containerRef, fixedBottomRef, enabled]);
}

export function CreateDropWaveWrapper({
  children,
  context = CreateDropWaveWrapperContext.WAVE_CHAT,
}: CreateDropWaveWrapperProps) {
  const capacitor = useCapacitor();

  const containerRef = useRef<HTMLDivElement>(null);
  const fixedBottomRef = useRef<HTMLDivElement>(null);

  const shouldObserve = context !== CreateDropWaveWrapperContext.SINGLE_DROP;
  useResizeObserver(containerRef, fixedBottomRef, shouldObserve);

  const containerClassName = useMemo(() => {
    if (capacitor.isIos) {
      return "tw-max-h-[calc(100vh-14.7rem)] tw-z-[998]";
    }

    return "tw-max-h-[calc(100vh-8.5rem)] lg:tw-max-h-[calc(100vh-7.5rem)] tw-z-30";
  }, [capacitor.isIos, capacitor.keyboardVisible, context]);
  return (
    <div
      ref={containerRef}
      className={`${containerClassName} tw-sticky tw-top-0 tw-w-full tw-flex-none tw-overflow-y-auto tw-rounded-b-xl tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-4 tw-py-2 tw-transition-colors tw-duration-500 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300`}
    >
      {children}
      <div ref={fixedBottomRef}></div>
    </div>
  );
}
