import React from "react";

interface PinnedWavesScrollButtonProps {
  readonly direction: "left" | "right";
  readonly onClick: () => void;
}

const PinnedWavesScrollButton: React.FC<PinnedWavesScrollButtonProps> = ({
  direction,
  onClick,
}) => {
  const isLeft = direction === "left";

  return (
    <button
      type="button"
      aria-label={isLeft ? "Scroll left" : "Scroll right"}
      onClick={onClick}
      className={`tw-group tw-absolute tw-top-0 tw-z-10 tw-inline-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-md tw-border-none tw-bg-iron-700 tw-p-0 tw-ring-1 tw-ring-inset tw-ring-white/10 sm:tw-top-0.5 sm:tw-size-7 ${
        isLeft ? "tw-left-0" : "tw-right-0"
      }`}
    >
      <svg
        className={`tw-size-5 tw-text-iron-200 tw-transition tw-duration-300 tw-ease-out group-hover:tw-text-iron-400 sm:tw-size-4 ${
          isLeft ? "tw-rotate-90" : "-tw-rotate-90"
        }`}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M6 9L12 15L18 9"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};

export default PinnedWavesScrollButton;
