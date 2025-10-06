"use client";

import React, { useCallback, useRef } from "react";
import { createBreakpoint } from "react-use";
import BrainContentPinnedWaves from "./BrainContentPinnedWaves";
import BrainContentInput from "./input/BrainContentInput";
import { ActiveDropState } from "@/types/dropInteractionTypes";
import { useLayout } from "../my-stream/layout/LayoutContext";
import { useAndroidKeyboard } from "@/hooks/useAndroidKeyboard";

// Create breakpoint hook with the same values as tailwind classes
// lg:tw-hidden is applied at min-width 1024px
const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

interface BrainContentProps {
  readonly children: React.ReactNode;
  readonly activeDrop: ActiveDropState | null;
  readonly onCancelReplyQuote: () => void;
  readonly keyboardAdjustment?: number;
}

const BrainContent: React.FC<BrainContentProps> = ({
  children,
  activeDrop,
  onCancelReplyQuote,
  keyboardAdjustment = 40,
}) => {
  // Get layout context registration function for measuring
  const { registerRef } = useLayout();
  
  // Android keyboard handling - only apply when input is visible
  const { getContainerStyle } = useAndroidKeyboard();

  // Get current breakpoint
  const breakpoint = useBreakpoint();

  // Local refs for component-specific needs
  const pinnedElementRef = useRef<HTMLDivElement | null>(null);

  // Callback refs for registration with LayoutContext
  const setPinnedRef = useCallback(
    (element: HTMLDivElement | null) => {
      // Update local ref
      pinnedElementRef.current = element;

      // Register with LayoutContext
      registerRef("pinned", element);
    },
    [registerRef]
  );

  // Only render the pinned waves on mobile (S breakpoint)
  const shouldShowPinnedWaves = breakpoint === "S";

  // Only apply Android keyboard adjustments when input is visible
  const containerStyle = activeDrop ? getContainerStyle({}, keyboardAdjustment) : {};

  return (
    <div className="tw-relative tw-flex tw-flex-col tw-h-full" style={containerStyle}>
      <div
        ref={setPinnedRef}
        className="tw-sticky tw-top-0 tw-z-10 tw-bg-black tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0 lg:tw-hidden">
        {shouldShowPinnedWaves && <BrainContentPinnedWaves />}
      </div>
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
