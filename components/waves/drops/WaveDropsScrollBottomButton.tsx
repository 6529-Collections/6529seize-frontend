import React from "react";

interface WaveDropsScrollBottomButtonProps {
  readonly isAtBottom: boolean;
  readonly scrollToBottom: () => void;
  readonly pendingCount?: number;
  readonly onRevealPending?: () => void;
}

export const WaveDropsScrollBottomButton: React.FC<
  WaveDropsScrollBottomButtonProps
> = ({ isAtBottom, scrollToBottom, pendingCount = 0, onRevealPending }) => {
  const hasPending = pendingCount > 0;

  if (isAtBottom && !hasPending) return null;

  const handleClick = () => {
    if (hasPending && onRevealPending) {
      onRevealPending();
    } else {
      scrollToBottom();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`tw-flex-shrink-0 tw-border tw-border-solid tw-border-iron-700 tw-absolute tw-z-[49] tw-bottom-3 tw-right-2 lg:tw-right-6 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-transition-all tw-duration-300 ${
        hasPending
          ? "tw-bg-indigo-500 tw-text-white tw-pl-4 tw-pr-5 tw-h-10 tw-min-w-[120px] lg:tw-h-9"
          : "tw-bg-iron-700 tw-text-iron-300 tw-size-10 lg:tw-size-8"
      } hover:tw-bg-iron-650 hover:tw-border-iron-650`}
      aria-label={hasPending ? `Show ${pendingCount} new messages` : "Scroll to bottom"}
    >
      {hasPending ? (
        <span className="tw-text-sm tw-font-medium">
          {pendingCount} new
        </span>
      ) : (
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
      )}
    </button>
  );
};
