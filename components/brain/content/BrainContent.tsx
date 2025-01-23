import React, { useRef, useEffect } from "react";
import BrainContentPinnedWaves from "./BrainContentPinnedWaves";
import BrainContentInput from "./input/BrainContentInput";
import { ActiveDropState } from "../../waves/detailed/chat/WaveChat";

interface BrainContentProps {
  readonly children: React.ReactNode;
  readonly showPinnedWaves?: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly onCancelReplyQuote: () => void;
  readonly waveId?: string;
}

const BrainContent: React.FC<BrainContentProps> = ({
  children,
  showPinnedWaves = true,
  activeDrop,
  onCancelReplyQuote,
  waveId,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollPositionRef = useRef<number>(0);

  useEffect(() => {
    if (!scrollContainerRef.current) return;

    if (waveId) {
      lastScrollPositionRef.current = scrollContainerRef.current.scrollTop;
    } else {
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = lastScrollPositionRef.current;
        }
      });
    }
  }, [waveId]);

  return (
    <div className="tw-relative tw-flex tw-flex-col tw-h-full">
      {showPinnedWaves && (
        <div className="tw-sticky tw-top-0 tw-z-10 tw-bg-black tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0">
          <BrainContentPinnedWaves />
        </div>
      )}
      <div
        ref={scrollContainerRef}
        className="tw-flex-1 tw-flex tw-flex-col-reverse tw-overflow-x-hidden lg:tw-overflow-y-auto no-scrollbar lg:tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 lg:tw-pr-2 tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0"
      >
        <div>{children}</div>
      </div>
      <div className="tw-sticky tw-bottom-0 tw-z-10 tw-bg-black tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0">
        <BrainContentInput
          activeDrop={activeDrop}
          onCancelReplyQuote={onCancelReplyQuote}
        />
      </div>
    </div>
  );
};

export default BrainContent;
