"use client";

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import useCapacitor from "@/hooks/useCapacitor";
import {
  LayoutContext,
  useLayout,
  defaultSpaces,
  calculateNativeKeyboardHeightStyle,
  type LayoutRefType,
} from "@/components/brain/my-stream/layout/LayoutContext";

/** Retained lists measure their own header without registering a second viewport lock. */
export default function PhoneListLayoutProvider({
  active,
  children,
}: {
  readonly active: boolean;
  readonly children: ReactNode;
}) {
  const parent = useLayout();
  const { isCapacitor } = useCapacitor();
  const header = useRef<HTMLDivElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState(64);
  const measureHeader = useCallback(() => {
    const height = header.current?.getBoundingClientRect().height ?? 0;
    if (height > 0) setHeaderHeight(height);
  }, []);
  const registerRef = useCallback(
    (type: LayoutRefType, element: HTMLDivElement | null) => {
      // Lists have no Wave/About tab bars; their refs belong to the outer page.
      if (type !== "header") return;
      header.current = element;
      measureHeader();
    },
    [measureHeader]
  );
  useLayoutEffect(() => {
    if (!active || !header.current) return;
    const element = header.current;
    const observer = new ResizeObserver(measureHeader);
    observer.observe(element);
    return () => observer.disconnect();
  }, [active, measureHeader]);
  const value = useMemo(() => {
    const spaces = {
      ...defaultSpaces,
      headerSpace: headerHeight,
      measurementsComplete: true,
    };
    const style = calculateNativeKeyboardHeightStyle(
      spaces,
      active && isCapacitor,
      parent.isViewportLocked
    );
    return {
      ...parent,
      registerRef,
      spaces,
      mobileWavesViewStyle: style,
      waveViewStyle: style,
    };
  }, [active, headerHeight, isCapacitor, parent, registerRef]);
  return (
    <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
  );
}
