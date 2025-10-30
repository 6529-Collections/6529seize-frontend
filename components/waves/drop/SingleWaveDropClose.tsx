import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface SingleWaveDropCloseProps {
  readonly onClose: () => void;
}

export const SingleWaveDropClose: React.FC<SingleWaveDropCloseProps> = ({ onClose }) => {
  return (
    <button
      type="button"
      className="tw-absolute tw-z-1000 tw-top-[calc(env(safe-area-inset-top,0px)+0.5rem)] tw-right-4 lg:tw-top-0 tw-text-iron-300 desktop-hover:hover:tw-text-iron-400 tw-bg-transparent tw-border-0 tw-transition tw-duration-300 tw-ease-out"
      onClick={onClose}
    >
      <XMarkIcon
        aria-hidden="true"
        className="tw-h-6 tw-w-6 tw-flex-shrink-0"
      />
    </button>
  );
}; 
