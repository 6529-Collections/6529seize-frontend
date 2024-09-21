import React from 'react';

interface WaveDropsScrollBottomButtonProps {
  readonly isAtBottom: boolean;
  readonly scrollToBottom: () => void;
}

export const WaveDropsScrollBottomButton: React.FC<WaveDropsScrollBottomButtonProps> = ({
  isAtBottom,
  scrollToBottom,
}) => {
  if (isAtBottom) return null;

  return (
    <button
      onClick={scrollToBottom}
      className="tw-absolute tw-bottom-4 tw-right-4 tw-bg-transparent tw-text-iron-200 tw-rounded-full tw-w-6 tw-h-6 tw-flex tw-items-center tw-justify-center tw-transition-all tw-duration-300"
      aria-label="Scroll to bottom"
    >
      <svg
        className="tw-w-3 tw-h-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 14l-7 7m0 0l-7-7m7 7V3"
        />
      </svg>
    </button>
  );
};