import React from "react";
import { formatNumberWithCommas } from "../../../helpers/Helpers";

interface DropTrophyIconProps {
  readonly rank: number | null;
}

export const DropTrophyIcon: React.FC<DropTrophyIconProps> = ({ rank }) => {
  if (!rank) {
    return (
      <div className="tw-font-semibold tw-text-xs tw-text-iron-400 tw-flex tw-items-center tw-size-6 tw-rounded-lg tw-bg-gradient-to-br tw-from-iron-700/90 tw-to-iron-800 tw-justify-center tw-ring-1 tw-ring-iron-600/50 tw-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2.5"
          stroke="currentColor" 
          className="tw-size-3.5 tw-flex-shrink-0"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
        </svg>
      </div>
    );
  }
  if (rank === 1) {
    return (
      <div className="tw-shadow-lg tw-ring-1 tw-bg-gradient-to-b tw-to-iron-900 tw-from-[#E8D48A]/30 tw-ring-[#E8D48A]/30 tw-rounded-lg tw-py-1 tw-px-2 tw-text-[#E8D48A] tw-font-semibold tw-text-xs tw-flex tw-items-center tw-gap-x-2">
        <svg
          className="tw-size-4 tw-flex-shrink-0 tw-text-[#E8D48A]"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 576 512"
        >
          {/* Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. */}
          <path
            fill="currentColor"
            d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"
          />
        </svg>
        <span>1</span>
      </div>
    );
  }

  if (rank === 2) {
    return (
      <div className="tw-shadow-lg tw-ring-1 tw-bg-gradient-to-b tw-to-iron-900 tw-from-[#dddddd]/20 tw-ring-[#dddddd]/30 tw-rounded-lg tw-py-1 tw-px-2 tw-text-[#DDDDDD] tw-font-semibold tw-text-xs tw-flex tw-items-center tw-gap-x-2">
        <svg
          className="tw-size-4 tw-flex-shrink-0 tw-text-[#DDDDDD]"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 576 512"
        >
          {/* Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. */}
          <path
            fill="currentColor"
            d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"
          />
        </svg>
        <span>2</span>
      </div>
    );
  }

  if (rank === 3) {
    return (
      <div className="tw-shadow-lg tw-ring-1 tw-bg-gradient-to-b tw-to-iron-900 tw-from-[#CD7F32]/20 tw-ring-[#CD7F32]/30 tw-rounded-lg tw-py-1 tw-px-2 tw-text-[#CD7F32] tw-font-semibold tw-text-xs tw-flex tw-items-center tw-gap-x-2">
        <svg
          className="tw-size-4 tw-flex-shrink-0 tw-text-[#CD7F32]"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          viewBox="0 0 576 512"
        >
          {/* Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. */}
          <path
            fill="currentColor"
            d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"
          />
        </svg>
        <span>3</span>
      </div>
    );
  }

  return (
    <div className="tw-font-semibold tw-text-xs tw-text-iron-300 tw-flex tw-items-center tw-size-6 tw-rounded-lg tw-bg-gradient-to-br tw-from-iron-700/90 tw-to-iron-800 tw-justify-center tw-ring-1 tw-ring-iron-600/50 tw-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
      <span>{formatNumberWithCommas(rank)}</span>
    </div>
  );
};