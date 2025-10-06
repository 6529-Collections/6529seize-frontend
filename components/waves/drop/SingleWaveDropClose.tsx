import React from "react";
import useCapacitor from "@/hooks/useCapacitor";

interface SingleWaveDropCloseProps {
  readonly onClose: () => void;
}

export const SingleWaveDropClose: React.FC<SingleWaveDropCloseProps> = ({ onClose }) => {
  const { isCapacitor } = useCapacitor();

  if (isCapacitor) return null;

  return (
    <button
      type="button"
      className="tw-absolute tw-z-1000 tw-top-2.5 lg:tw-top-0 tw-right-4 tw-text-iron-300 desktop-hover:hover:tw-text-iron-400 tw-bg-transparent tw-border-0 tw-transition tw-duration-300 tw-ease-out"
      onClick={onClose}
    >
      <svg
        className="tw-h-6 tw-w-6"
        aria-hidden="true"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  );
}; 