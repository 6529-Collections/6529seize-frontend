import React from "react";

interface WaveDropsScrollBottomButtonProps {
  readonly isAtBottom: boolean;
  readonly scrollToBottom: () => void;
}

export const WaveDropsScrollBottomButton: React.FC<
  WaveDropsScrollBottomButtonProps
> = ({ isAtBottom, scrollToBottom }) => {
  if (isAtBottom) return null;

  return (
    <button
      onClick={scrollToBottom}
      className="tw-flex-shrink-0 tw-border tw-border-solid tw-border-iron-700 tw-absolute tw-z-[99] tw-bottom-3 tw-right-2 lg:tw-right-6 tw-bg-iron-700 tw-text-iron-300 tw-rounded-full tw-size-10 
      lg:tw-size-8 tw-flex tw-items-center tw-justify-center hover:tw-bg-iron-650 hover:tw-border-iron-650 tw-transition-all tw-duration-300"
      aria-label="Scroll to bottom"
    >
      <svg
        className="tw-flex-shrink-0 tw-size-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M19 14l-7 7m0 0l-7-7m7 7V3"
        />
      </svg>
    </button>
  );
};
