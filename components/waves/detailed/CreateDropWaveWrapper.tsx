import React, { useEffect, useCallback, useMemo, useRef } from 'react';
import useCapacitor from '../../../hooks/useCapacitor';
import { useDebouncedCallback } from 'use-debounce';

interface CreateDropWaveWrapperProps {
  readonly children: React.ReactNode;
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

export function CreateDropWaveWrapper({ children }: CreateDropWaveWrapperProps) {
  const capacitor = useCapacitor();

  const containerRef = useRef<HTMLDivElement>(null);
  const fixedBottomRef = useRef<HTMLDivElement>(null);

  useResizeObserver(containerRef, fixedBottomRef);
  
  const containerClassName = useMemo(() => {
    return capacitor.isCapacitor
      ? `tw-max-h-[calc(100vh-14.7rem)] ${capacitor.keyboardVisible ? "" : "tw-mb-[3.75rem]"}`
      : "tw-max-h-[calc(100vh-8.8rem)] lg:tw-max-h-[calc(100vh-7.5rem)]";
  }, [capacitor.isCapacitor, capacitor.keyboardVisible]);
  return (
    <div
    ref={containerRef}
    className={`${containerClassName} tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-py-4 tw-px-4 tw-top-0 tw-sticky tw-z-10 tw-w-full tw-rounded-b-xl tw-flex-none tw-transition-colors tw-duration-500 tw-lg:z-50 tw-border-t tw-border-solid tw-border-b-0 tw-border-x-0 tw-border-iron-700  tw-bg-iron-950`}
  >
    {children}
    <div ref={fixedBottomRef}></div>
    </div>
  );
}