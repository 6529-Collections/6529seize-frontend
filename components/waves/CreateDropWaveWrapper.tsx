import React, { useEffect, useCallback, useMemo, useRef } from "react";
import useCapacitor from "../../hooks/useCapacitor";
import { useDebouncedCallback } from "use-debounce";

export enum CreateDropWaveWrapperContext {
  WAVE_CHAT = "WAVE_CHAT",
  SINGLE_DROP = "SINGLE_DROP",
  MY_STREAM = "MY_STREAM",
}

interface CreateDropWaveWrapperProps {
  readonly children: React.ReactNode;
  readonly context?: CreateDropWaveWrapperContext;
}

function useResizeObserver(
  containerRef: React.RefObject<HTMLDivElement>,
  fixedBottomRef: React.RefObject<HTMLDivElement>
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
    if (!containerRef.current || !fixedBottomRef.current) return;
    const observer = new ResizeObserver(debouncedHandleResize);
    observer.observe(containerRef.current);
    observer.observe(fixedBottomRef.current);

    return () => observer.disconnect();
  }, [debouncedHandleResize, containerRef, fixedBottomRef]);
}

export function CreateDropWaveWrapper({
  children,
  context = CreateDropWaveWrapperContext.WAVE_CHAT,
}: CreateDropWaveWrapperProps) {
  const capacitor = useCapacitor();

  const containerRef = useRef<HTMLDivElement>(null);
  const fixedBottomRef = useRef<HTMLDivElement>(null);

  useResizeObserver(containerRef, fixedBottomRef);

  const containerClassName = useMemo(() => {
    const isMyStreamOrWaveChat =
      context === CreateDropWaveWrapperContext.MY_STREAM ||
      context === CreateDropWaveWrapperContext.WAVE_CHAT;

    if (capacitor.isCapacitor) {
      const marginClass =
        isMyStreamOrWaveChat && !capacitor.keyboardVisible
          ? "tw-mb-[3.75rem]"
          : "";
      return `tw-max-h-[calc(100vh-14.7rem)] ${marginClass} tw-z-[998]`;
    }

    return "tw-max-h-[calc(100vh-8.5rem)] lg:tw-max-h-[calc(100vh-7.5rem)] tw-z-30";
  }, [capacitor.isCapacitor, capacitor.keyboardVisible, context]);
  return (
    <div
      ref={containerRef}
      className={`${containerClassName} tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-py-4 tw-px-4 tw-top-0 tw-sticky tw-w-full tw-rounded-b-xl tw-flex-none tw-transition-colors tw-duration-500 tw-border-t tw-border-solid tw-border-x-0 tw-border-b-0 lg:tw-border-x lg:tw-border-b tw-border-iron-800 tw-bg-iron-950`}>
      {children}
      <div ref={fixedBottomRef}></div>
    </div>
  );
}
