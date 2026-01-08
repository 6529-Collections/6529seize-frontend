"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { createBreakpoint } from "react-use";
import BrainContentPinnedWaves from "./BrainContentPinnedWaves";
import BrainContentInput from "./input/BrainContentInput";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import { useLayout } from "../my-stream/layout/LayoutContext";
import useDeviceInfo from "@/hooks/useDeviceInfo";

// Create breakpoint hook with the same values as tailwind classes
// lg:tw-hidden is applied at min-width 1024px
const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

interface BrainContentProps {
  readonly children: React.ReactNode;
  readonly activeDrop: ActiveDropState | null;
  readonly onCancelReplyQuote: () => void;
  readonly showPinnedWaves?: boolean | undefined;
}

const BrainContent: React.FC<BrainContentProps> = ({
  children,
  activeDrop,
  onCancelReplyQuote,
  showPinnedWaves = true,
}) => {
  // Get layout context registration function
  const { registerRef } = useLayout();

  // Get current breakpoint and device info
  const breakpoint = useBreakpoint();
  const { isApp } = useDeviceInfo();

  // Local refs for component-specific needs
  const pinnedElementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showPinnedWaves) {
      registerRef("pinned", null);
    }
  }, [showPinnedWaves, registerRef]);

  // Callback refs for registration with LayoutContext
  const setPinnedRef = useCallback(
    (element: HTMLDivElement | null) => {
      // Update local ref
      pinnedElementRef.current = element;

      if (showPinnedWaves) {
        // Register with LayoutContext
        registerRef("pinned", element);
      }
    },
    [registerRef, showPinnedWaves]
  );

  // Only show pinned waves in the app on small screens (not mobile web)
  const shouldShowPinnedWaves = showPinnedWaves && breakpoint === "S" && isApp;

  return (
    <div className="tw-relative tw-flex tw-flex-col tw-h-full">
      {showPinnedWaves && (
        <div
          ref={setPinnedRef}
          className="tw-sticky tw-top-0 tw-z-10 tw-bg-iron-950 tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0 lg:tw-hidden">
          {shouldShowPinnedWaves && <BrainContentPinnedWaves />}
        </div>
      )}
      <div className="tw-flex-1 tw-overflow-hidden">
        <div className="tw-h-full">
          {children}
        </div>
      </div>
      {activeDrop && (
        <div className="tw-sticky tw-bottom-0 tw-z-[80] tw-bg-black tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0">
          <BrainContentInput
            activeDrop={activeDrop}
            onCancelReplyQuote={onCancelReplyQuote}
          />
        </div>
      )}
    </div>
  );
};

export default BrainContent;
