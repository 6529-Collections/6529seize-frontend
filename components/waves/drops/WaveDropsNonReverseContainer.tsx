import React, { forwardRef, useRef, useEffect, useState } from "react";

interface WaveDropsNonReverseContainerProps {
  readonly children: React.ReactNode;
  readonly onScroll: () => void;
  readonly onTopIntersection: () => void;
  readonly isFetchingNextPage: boolean;
  readonly onUserScroll?: (
    direction: "up" | "down",
    isAtBottom: boolean
  ) => void;
}

export const WaveDropsNonReverseContainer = forwardRef<
  HTMLDivElement,
  WaveDropsNonReverseContainerProps
>(
  (
    { children, onScroll, onTopIntersection, isFetchingNextPage, onUserScroll },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className="tw-pb-2 tw-flex tw-flex-col-reverse tw-bg-iron-950  tw-overflow-y-auto tw-overflow-x-hidden no-scrollbar lg:tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300"
      >
       {children}
      </div>
    );
  }
);

WaveDropsNonReverseContainer.displayName = "WaveDropsNonReverseContainer";
