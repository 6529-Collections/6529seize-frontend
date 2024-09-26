import React, { forwardRef } from "react";

interface WaveDropsScrollContainerProps {
  readonly children: React.ReactNode;
  readonly onScroll: () => void;
}

export const WaveDropsScrollContainer = forwardRef<
  HTMLDivElement,
  WaveDropsScrollContainerProps
>(({ children, onScroll }, ref) => {
  return (
    <div
      ref={ref}
      className="tw-bg-iron-950 tw-flex tw-flex-col-reverse tw-flex-grow tw-overflow-y-auto tw-divide-y tw-divide-iron-800 tw-divide-solid tw-divide-x-0 tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-transition-all tw-duration-300"
      onScroll={onScroll}
    >
      <div className="tw-flex tw-flex-col-reverse tw-flex-grow">
        <div className="tw-overflow-hidden">{children}</div>
      </div>
    </div>
  );
});

WaveDropsScrollContainer.displayName = "WaveDropsScrollContainer";
