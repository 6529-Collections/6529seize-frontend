import Link from "next/link";
import React from "react";

interface BrainLeftSidebarCreateAWaveButtonProps {}

const BrainLeftSidebarCreateAWaveButton: React.FC<
  BrainLeftSidebarCreateAWaveButtonProps
> = () => {
  return (
    <Link
      href="/waves?new=true"
      className="tw-no-underline tw-text-iron-300 tw-w-full tw-flex tw-items-center tw-justify-center tw-gap-x-1.5 tw-rounded-lg tw-py-2 tw-px-2.5 tw-text-sm tw-bg-iron-900 desktop-hover:hover:tw-text-primary-400 tw-font-semibold tw-transition-colors tw-duration-300"
    >
      <svg
        className="tw-size-4 tw-flex-shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 5V19M5 12H19"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>Create a Wave</span>
    </Link>
  );
};

export default BrainLeftSidebarCreateAWaveButton;
